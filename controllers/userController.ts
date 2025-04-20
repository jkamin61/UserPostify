import { promises as fs } from 'node:fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import logger from '../utils/logger';
import { IUser } from '../models/userRepository';
import pool from '../storage/db';
import UserRepository from '../models/userRepository';

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
        await UserRepository.create(user);
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
        const user: IUser | null = await UserRepository.findByEmail(email);
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
        const user: IUser | null = await UserRepository.findByEmail(email);
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
