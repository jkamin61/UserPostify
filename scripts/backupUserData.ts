import fs from 'fs';
import path from 'path';

const usersDataPath = path.join(__dirname, '../storage/users.json');
const backupPath = path.join(
    __dirname,
    '../storage',
    'backup',
    `users_backup_${Date.now()}.json`
);

function backupUserData(): void {
    const readStream: fs.ReadStream = fs.createReadStream(usersDataPath, {
        encoding: 'utf-8',
    });

    const writeStream: fs.WriteStream = fs.createWriteStream(backupPath, {
        encoding: 'utf-8',
    });

    readStream.pipe(writeStream);

    readStream.on('error', (err) => {
        console.error('Error reading the user data file:', err);
    });

    writeStream.on('finish', () => {
        console.log('Backup completed successfully!');
    });

    writeStream.on('error', (err) => {
        console.error('Error writing the backup file:', err);
    });
}

backupUserData();
