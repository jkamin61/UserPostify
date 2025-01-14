import fs from 'fs';
import path from 'path';

const usersFilePath: string = path.join(__dirname, '../storage/users.json');

export interface IUser {
    userId: string;
    email: string;
    token: string;
    password: string;
    firstName: string;
    lastName: string;
}

const loadUsers = (): IUser[] => {
    const data: string = fs.readFileSync(usersFilePath, 'utf-8');
    return JSON.parse(data);
};

const User = {
    find: async (query: { userId: string }): Promise<IUser[]> => {
        const users = loadUsers();
        return users.filter((user) => user.userId === query.userId);
    },
};

export default User;
