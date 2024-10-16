import express, { Response, Request, NextFunction, Router } from 'express';
import { version } from '../package.json';
import logger from '../utils/logger';
import { STATUS_CODE } from '../utils/statusCode';

const router: Router = express.Router();
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info(
            `GET /health request received from ${req.connection.remoteAddress}`
        );

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Powered-By', 'Node.js');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Date', new Date().toUTCString());

        res.statusCode = STATUS_CODE.OK;
        logger.info(
            `Response sent with status code ${res.statusCode} for GET /health`
        );
        res.end(JSON.stringify({ message: version }));
    } catch (err) {
        next(err);
    }
});

export default router;
