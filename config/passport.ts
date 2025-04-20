import passport from 'passport';
import passportJWT, { ExtractJwt, StrategyOptions } from 'passport-jwt';
import User from '../models/user';
import dotenv from 'dotenv';

dotenv.config();

const secret: string = process.env.JWT_SECRET as string;

const params: StrategyOptions = {
    secretOrKey: secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

passport.use(
    new passportJWT.Strategy(params, async (payload: { id: string }, done) => {
        try {
            const users = await User.find({ userId: payload.id });
            const user = users[0]; // Assuming find returns an array

            if (!user) {
                return done(new Error('User not found'));
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);
