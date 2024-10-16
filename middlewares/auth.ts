import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/user';

const auth = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
        const authHeader = req.header('authorization');
        const token = authHeader ? authHeader.split(' ')[1] : null;

        if (err) {
            return next(err);
        }

        if (!user || !token || user.token !== token) {
            return res.status(401).json({
                status: 'error',
                code: 401,
                message: 'Unauthorized',
            });
        }

        req.user = user as IUser;
        next();
    })(req, res, next);
};

export default auth;
