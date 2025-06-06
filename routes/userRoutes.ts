import express, { Response, Request, NextFunction, Router } from 'express';
import jwt from 'jsonwebtoken';
import auth from '../middlewares/auth';
import logger from '../utils/logger';
import { STATUS_CODE } from '../utils/statusCode';
import { IUser } from '../models/userRepository';
import UserRepository from '../models/userRepository';
import dotenv from 'dotenv';
import {
    authenticateUser,
    registerUser,
    setToken,
    updateUser,
} from '../controllers/userController';
import {
    createPost,
    deletePost,
    getUserPosts,
    updatePost,
    UpdatePostPayload,
} from '../controllers/postController';
import PostRepository from '../models/postRepository';

dotenv.config();

const secret: string = process.env.JWT_SECRET || 'default_secret';
const router: Router = express.Router();

router.post(
    '/register',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logger.info(`POST /user/register request received from ${req.ip}`);

            const { email, password, firstName, lastName } = req.body;
            const user: IUser | null = await UserRepository.findByEmail(email);

            if (user) {
                logger.info('User already exists');
                res.status(STATUS_CODE.CONFLICT).json({
                    status: 'Conflict',
                    code: STATUS_CODE.CONFLICT,
                    message: 'Email in use. User already exists.',
                });
                return;
            }

            const newUser: IUser = await registerUser(
                email,
                password,
                firstName,
                lastName
            );
            if (newUser) {
                res.status(STATUS_CODE.CREATED).json({
                    status: 'Created',
                    code: STATUS_CODE.CREATED,
                    message: 'User created successfully.',
                });
            }
        } catch (err) {
            next(err);
        }
    }
);

router.post(
    '/login',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logger.info(`POST /user/login request received from ${req.ip}`);
            const { email, password } = req.body;
            const user: IUser | null = await UserRepository.findByEmail(email);
            if (!user) {
                res.status(STATUS_CODE.NOT_FOUND).json({
                    status: 'Not found',
                    code: STATUS_CODE.NOT_FOUND,
                    message: 'User not found',
                });
                return;
            }
            const userAuth: IUser | null = await authenticateUser(
                email,
                password
            );
            if (!userAuth) {
                res.status(STATUS_CODE.UNAUTHORIZED).json({
                    status: 'Unauthorized',
                    code: STATUS_CODE.UNAUTHORIZED,
                    message: 'Invalid email or password',
                });
                return;
            }
            const payload: { id: string; username: string } = {
                id: user.userId,
                username: user.firstName,
            };
            const token = jwt.sign(payload, secret, { expiresIn: '1h' });
            await setToken(user.email, token);
            logger.info('User login successful');
            res.status(STATUS_CODE.OK).json({
                status: 'Ok',
                code: STATUS_CODE.OK,
                message: `User logged in successfully. Token: ${token}`,
            });
        } catch (err) {
            next(err);
        }
    }
);

router.get(
    '/',
    auth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = req.user;
            if (!user) {
                res.status(STATUS_CODE.UNAUTHORIZED).json({
                    status: 'Unauthorized',
                    code: STATUS_CODE.UNAUTHORIZED,
                    message: 'User not authenticated',
                });
            }

            res.json({
                status: 'Success',
                code: STATUS_CODE.OK,
                data: user,
            });
        } catch (err) {
            next(err);
        }
    }
);

interface UserUpdateRequest extends Request {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
}

router.patch(
    '/update',
    auth,
    async (
        req: UserUpdateRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { newEmail, newPassword, newFirstName, newLastName } =
                req.body;

            if (req.body.length === 0) {
                throw new Error('Invalid number of parameters');
            }

            if (!req.user) {
                res.status(STATUS_CODE.UNAUTHORIZED).json({
                    status: 'Unauthorized',
                    code: STATUS_CODE.UNAUTHORIZED,
                    message: 'User not authenticated',
                });
                return;
            }

            const user: IUser = req.user as IUser;

            const updatedUser: IUser = await updateUser(
                user,
                newEmail,
                newPassword,
                newFirstName,
                newLastName
            );
            res.json({
                status: 'Success',
                code: STATUS_CODE.OK,
                data: updatedUser,
                message: 'User updated successfully',
            });
        } catch (err) {
            next(err);
        }
    }
);

router.post(
    '/post',
    auth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logger.info(`POST /user/post request received from ${req.ip}`);

            const { title, description } = req.body;
            const user = req.user as IUser;

            if (!user) {
                res.status(STATUS_CODE.UNAUTHORIZED).json({
                    status: 'Unauthorized',
                    code: STATUS_CODE.UNAUTHORIZED,
                    message: 'User not authenticated',
                });
                return;
            }

            const newPost = await createPost(title, description, user.userId);
            if (newPost) {
                res.status(STATUS_CODE.CREATED).json({
                    status: 'Created',
                    code: STATUS_CODE.CREATED,
                    message: 'Post created successfully.',
                });
            }
        } catch (err) {
            next(err);
        }
    }
);

router.get(
    '/posts',
    auth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = req.user as IUser;
            if (!user) {
                res.status(STATUS_CODE.UNAUTHORIZED).json({
                    status: 'Unauthorized',
                    code: STATUS_CODE.UNAUTHORIZED,
                    message: 'User not authenticated',
                });
                return;
            }
            const posts = await getUserPosts(user.userId);
            res.json({
                status: 'OK',
                code: STATUS_CODE.OK,
                data: posts,
            });
        } catch (err) {
            next(err);
        }
    }
);

router.get(
    '/all-posts',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const posts = await PostRepository.getAllPosts();
            if (!posts || posts.length === 0) {
                res.status(STATUS_CODE.NOT_FOUND).json({
                    status: 'Not found',
                    code: STATUS_CODE.NOT_FOUND,
                    message: 'No posts found',
                });
            }
            res.json({
                status: 'OK',
                code: STATUS_CODE.OK,
                data: posts,
            });
        } catch (err) {
            next(err);
        }
    }
);

router.delete(
    '/post/:id',
    auth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const user = req.user as IUser;
            if (!user) {
                res.status(STATUS_CODE.UNAUTHORIZED).json({
                    status: 'Unauthorized',
                    code: STATUS_CODE.UNAUTHORIZED,
                    message: 'User not authenticated',
                });
                return;
            }
            const result = await deletePost(id);
            if (result) {
                res.json({
                    status: 'OK',
                    code: STATUS_CODE.OK,
                    message: `Post ${id} deleted successfully`,
                });
            } else {
                res.status(STATUS_CODE.NOT_FOUND).json({
                    status: 'Not found',
                    code: STATUS_CODE.NOT_FOUND,
                    message: `There is no post of ID: ${id}`,
                });
            }
        } catch (err) {
            next(err);
        }
    }
);

router.patch(
    '/post/:id',
    auth,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const user = req.user as IUser;
            if (!user) {
                res.status(STATUS_CODE.UNAUTHORIZED).json({
                    status: 'Unauthorized',
                    code: STATUS_CODE.UNAUTHORIZED,
                    message: 'User not authenticated',
                });
                return;
            }
            const updatePayload: UpdatePostPayload = req.body;
            const post = await updatePost(id, updatePayload);

            if (!post) {
                res.status(STATUS_CODE.NOT_FOUND).json({
                    status: 'Not found',
                    code: STATUS_CODE.NOT_FOUND,
                    message: `Post ID: ${id} doesn't exist or no access`,
                });
            }
            res.json({
                status: 'OK',
                code: STATUS_CODE.OK,
                message: `Successfully updated post ID: ${id}`,
                data: post,
            });
        } catch (err) {
            next(err);
        }
    }
);

router.delete(
    '/:id',
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            const user = await UserRepository.findById(id);
            if (!user) {
                res.status(STATUS_CODE.NOT_FOUND).json({
                    status: 'Not found',
                    code: STATUS_CODE.NOT_FOUND,
                    message: `User ID: ${id} doesn't exist or no access`,
                });
                return;
            }

            const result = await UserRepository.delete(id);

            if (result === 0) {
                res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
                    status: 'Could not delete user',
                    code: STATUS_CODE.INTERNAL_SERVER_ERROR,
                    message: `Could not delete user ID: ${id}. No access`,
                });
            } else if (result === 1) {
                res.json({
                    status: 'User deleted successfully',
                    code: STATUS_CODE.OK,
                    message: `Successfully deleted user ID: ${id}.`,
                });
            } else {
                res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
                    status: 'Critical error - more then 1 user deleted',
                    code: STATUS_CODE.INTERNAL_SERVER_ERROR,
                    message: 'More users then 1 was deleted. Critical error.',
                });
            }
        } catch (err) {
            next(err);
        }
    }
);

export default router;
