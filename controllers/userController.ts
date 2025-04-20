import { promises as fs } from 'node:fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import logger from '../utils/logger';
import { IUser } from '../models/user';
import pool from '../storage/db';
import { QueryResult } from 'pg';

const MIN_PASSWORD_LENGTH: number = 8;
const HASH_ROUNDS: number = 10;

const usersPath = path.join(process.cwd(), 'storage', 'users.json');

async function getUsersData(): Promise<IUser[]> {
    const data: string = await fs.readFile(usersPath, 'utf-8');
    return JSON.parse(data);
}

function validateEmail(email: string): boolean {
    const re: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export async function findUserByEmail(email: string): Promise<IUser | null> {
    if (!email || !validateEmail(email)) {
        throw new Error('Invalid email format');
    }
    try {
        const result: QueryResult<IUser> = await pool.query(
            'SELECT * from users WHERE email=$1',
            [email]
        );
        if (result.rows.length === 0) {
            logger.info(`User with email: ${email} not found.`);
            return null;
        }
        const user: IUser = result.rows[0];
        logger.info('User found:', user.email);
        return user;
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            throw new Error('Users file not found');
        } else if (err instanceof SyntaxError) {
            throw new Error('Error parsing JSON data');
        } else {
            throw new Error('An unexpected error occurred: ' + err.message);
        }
    }
}

export async function registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string
): Promise<IUser> {
    if (!email || !validateEmail(email)) {
        throw new Error('Invalid email format');
    }

    if (!firstName || !lastName) {
        throw new Error('Invalid first name or last name');
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
        throw new Error('Password must be at least 8 characters long');
    }

    try {
        const hashedPassword: string = await bcrypt.hash(password, HASH_ROUNDS);
        const user: IUser = {
            userId: uuidv4(),
            email: email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
            token: '',
        };
        await pool.query(
            'INSERT INTO users (user_id, email, password, first_name, last_name, token) VALUES ($1, $2, $3, $4, $5, $6)',
            [
                user.userId,
                user.email,
                user.password,
                user.firstName,
                user.lastName,
                user.token,
            ]
        );
        return user;
    } catch (err) {
        logger.error('Error registering user:', err);
        throw new Error('Could not register user');
    }
}

export async function authenticateUser(
    email: string,
    password: string
): Promise<IUser | null> {
    try {
        const user: IUser | null = await findUserByEmail(email);
        if (!user) {
            throw new Error('User does not exist');
        }

        const isMatch: boolean = await bcrypt.compare(password, user.password);

        if (isMatch) {
            logger.info('Authentication successful');
            return user;
        } else {
            logger.error('Authentication unsuccessful');
            return null;
        }
    } catch (err: any) {
        logger.error('Error during authentication:', err.message);
        throw new Error('Authentication failed');
    }
}

export async function setToken(email: string, token: string): Promise<void> {
    try {
        const user: IUser | null = await findUserByEmail(email);
        if (!user) {
            throw new Error('User does not exist');
        }
        await pool.query('UPDATE users SET token = $1 WHERE email=$2', [
            token,
            email,
        ]);
        logger.info(`Token for user ${email} has been updated`);
    } catch (err: any) {
        logger.error('Error setting token:', err.message);
        throw new Error('Could not update user token');
    }
}

export async function updateUser(
    user: IUser,
    firstName: string,
    lastName: string
): Promise<IUser> {
    try {
        const users: IUser[] = await getUsersData();
        const userIndex: number = users.findIndex(
            (users) => users.userId === user.userId
        );
        if (userIndex === -1) {
            throw new Error('User does not exist');
        }

        users[userIndex].firstName = firstName;
        users[userIndex].lastName = lastName;

        await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8');

        return users[userIndex];
    } catch (err: any) {
        logger.error('Error updating user,', err.message);
        throw new Error('Could not update user information');
    }
}
