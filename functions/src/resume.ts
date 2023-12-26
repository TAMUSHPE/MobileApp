import * as functions from 'firebase-functions';
import archiver from 'archiver';
import { bucket, db } from './firebaseConfig';


const generateSignedUrl = async (fileName: string) => {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 1000 * 60 * 60); // URL valid for 1 hour

    const options = {
        action: 'read' as const,
        expires: expiresAt,
    };

    try {
        const [url] = await bucket.file(fileName).getSignedUrl(options);
        return { url, createdAt, expiresAt };
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw error;
    }
};


export const zipResume = functions.https.onRequest(async (req, res) => {
    await db.collection('resumes').doc('status').set({ isGenerated: false });
    // Create Zip File
    const zipFileName = 'SHPEResumes.zip';

    const zipFile = bucket.file(zipFileName);

    const archive = archiver('zip', { zlib: { level: 9 } });
    const zipStream = zipFile.createWriteStream();
    archive.pipe(zipStream);

    // retrieve all user docs
    const [files] = await bucket.getFiles({
        prefix: 'user-docs/',
    });

    for (const file of files) {
        if (file.name.endsWith('/user-resume') && file.metadata.contentType === 'application/pdf') {
            const userId = file.name.split('/')[1];

            try {
                const userDoc = await db.collection('users').doc(userId).get();
                const displayName = userDoc.exists ? userDoc.data()?.displayName || userId : userId;

                const fileStream = file.createReadStream();
                archive.append(fileStream, { name: `${displayName}-resume.pdf` });
            } catch (error) {
                console.error(`Error fetching user data for ${userId}:`, error);
            }
        }
    }

    archive.finalize();

    zipStream.on('finish', async () => {
        await db.collection('resumes').doc('status').set({ isGenerated: true });
        try {
            const { url, createdAt, expiresAt } = await generateSignedUrl(zipFileName);

            const docRef = await db.collection('resumes').doc('data').set({
                url,
                createdAt,
                expiresAt
            });

            res.status(200).send({ data: { docId: docRef } });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send({ error: 'Failed to process request' });
        }
    });


    zipStream.on('error', async (err) => {
        await db.collection('resumes').doc('status').set({ isGenerated: true });
        console.error('Error writing to zip stream:', err);
        res.status(500).send({ error: 'Failed to create zip file' });
    });
});
