import createError from 'http-errors';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv';
import './config/passport';

import healthRouter from './routes/healthRoutes';
import userRouter from './routes/userRoutes';

dotenv.config();

const app: Application = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/health', healthRouter);
app.use('/user', userRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
    next(createError(404));
});

app.use(function (err: any, req: Request, res: Response) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.json({ message: err.message });
});

export default app;
