import app from './app';
import process from 'process';
import dotenv from 'dotenv';
import logger from './utils/logger';

dotenv.config();

const portEnv: string = process.env.PORT || '3000';
const PORT: number = parseInt(portEnv, 10);
const HOSTNAME: string = process.env.HOSTNAME || 'localhost';

app.listen(PORT, async () => {
    logger.info(`Server running at https://${HOSTNAME}:${PORT}/`);
});
