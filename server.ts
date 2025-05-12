import app from './app';
import process from 'process';
import dotenv from 'dotenv';
import logger from './utils/logger';

dotenv.config();

const portEnv: string = process.env.PORT || '4000';
const PORT: number = parseInt(portEnv, 10);

app.listen(PORT, async () => {
    logger.info(`Server running at PORT:${PORT}`);
});
