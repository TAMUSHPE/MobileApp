import * as functions from 'firebase-functions';
import { FirestoreAdminClient } from '@google-cloud/firestore/build/src/v1/firestore_admin_client';
import { Storage } from '@google-cloud/storage';
import { db } from './firebaseConfig';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const client = new FirestoreAdminClient();
const storage = new Storage();

const bucketName = 'gs://tamushpemobileapp.appspot.com';
const maxBackups = 5;
const masterPassword = functions.config().admin.master_password;

// Scheduled backup function (for weekly backups)
export const scheduledFirestoreExport = functions.pubsub.schedule('every sunday 00:00').timeZone('America/Chicago').onRun(async (context) => {
    return exportFirestoreBackup();
});

// HTTP-triggered backup function (for testing)
export const httpFirestoreExport = functions.https.onRequest(async (req, res) => {
    try {
        await exportFirestoreBackup();
        res.status(200).send('Backup created successfully.');
    } catch (error) {
        console.error('Export operation failed:', error);
        res.status(500).send('Failed to create backup.');
    }
});

// Function to export Firestore backup
const exportFirestoreBackup = async () => {
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    if (!projectId) {
        throw new Error('Project ID is not set in environment variables.');
    }

    const databaseName = client.databasePath(projectId, '(default)');

    try {
        // List all backups in the bucket
        const [files] = await storage.bucket(bucketName).getFiles({ prefix: 'backups/' });
        const backups = files
            .filter(file => file.metadata.timeCreated)
            .map(file => ({
                name: file.name,
                timeCreated: new Date(file.metadata.timeCreated as string)
            }));

        backups.sort((a, b) => b.timeCreated.getTime() - a.timeCreated.getTime());

        // Delete older backups if there are more than maxBackups
        if (backups.length > maxBackups) {
            const backupsToDelete = backups.slice(maxBackups);
            for (const backup of backupsToDelete) {
                await storage.bucket(bucketName).file(backup.name).delete();
                console.log(`Deleted old backup: ${backup.name}`);
            }
        }

        // Perform the backup
        const [response] = await client.exportDocuments({
            name: databaseName,
            outputUriPrefix: `${bucketName}/backups/${new Date().toISOString()}`,
            collectionIds: []
        });
        console.log(`Export operation name: ${response.name}`);
    } catch (err) {
        console.error('Export operation failed:', err);
        throw new Error('Export operation failed');
    }
}

// HTTP function to reset points with password protection
export const resetPointsWithPassword = functions.https.onRequest(async (req, res) => {
    const providedPassword = req.query.password as string;

    if (providedPassword !== masterPassword) {
        res.status(403).send('Unauthorized: Incorrect password.');
        return;
    }

    try {
        await clearEventLogAndResetPoints();
        res.status(200).send('Event log cleared and points reset successfully.');
    } catch (error) {
        console.error('Failed to reset points:', error);
        res.status(500).send('Failed to reset points.');
    }
});

async function clearEventLogAndResetPoints() {
    const batchSize = 100;
    const usersSnapshot = await db.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
        // Reset points and pointsThisMonth fields to 0
        await userDoc.ref.update({ points: 0, pointsThisMonth: 0 });

        const eventLogRef = userDoc.ref.collection('event-logs');
        const eventLogSnapshot = await eventLogRef.get();

        const batches: QueryDocumentSnapshot[][] = [[]];

        eventLogSnapshot.docs.forEach((doc, index) => {
            if (index % batchSize === 0 && index !== 0) {
                batches.push([]);
            }
            batches[batches.length - 1].push(doc);
        });

        for (const batch of batches) {
            const batchDelete = db.batch();
            batch.forEach((doc) => batchDelete.delete(doc.ref));
            await batchDelete.commit();
        }
    }
}