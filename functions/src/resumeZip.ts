import * as functions from 'firebase-functions';
import archiver from 'archiver';
import { bucket } from './firebaseConfig';

export const zipResume = functions.https.onRequest(async (req, res) => {
    const zipFileName = 'SHPEResumes.zip';
    const zipFile = bucket.file(zipFileName);

    const archive = archiver('zip');

    const [files] = await bucket.getFiles({
        prefix: 'user-docs/',
    });

    console.log(`Found ${files.length} files.`);

    for (const file of files) {
        if (file.name.endsWith('/user-resume')) {
            const userId = file.name.split('/')[1];
            console.log(`Appending file for user: ${userId}`);

            const fileStream = file.createReadStream();
            const appendPromise = new Promise((resolve, reject) => {
                fileStream.on('end', resolve);
                fileStream.on('error', reject);

                archive.append(fileStream, { name: `${userId}.pdf` }); // assuming pdf
            });

            await appendPromise.catch((err) => {
                console.error(`Error appending file for user ${userId}:`, err);
            });
        }
    }

    const zipStream = zipFile.createWriteStream();

    zipStream.on('finish', () => {
        const zipUrl = `https://storage.googleapis.com/tamushpemobileapp.appspot.com/${zipFileName}`;
        res.status(200).send({ data: { url: zipUrl } });
    });

    zipStream.on('error', (err) => {
        console.error('Error writing to zip stream:', err);
        res.status(500).send({ error: 'Failed to create zip file' });
    });

    archive.pipe(zipStream);
    archive.finalize();
});
