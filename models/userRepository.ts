import pool from '../storage/db';

export interface IUser {
    userId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    token: string;
}

const UserRepository = {
    findById: async (id: string): Promise<IUser> => {
        const result = await pool.query(
            'SELECT user_id as "userId",email,password,first_name as "firstName",last_name as "lastName",token FROM users WHERE user_id = $1',
            [id]
        );
        return result.rows[0] || null;
    },
    findByEmail: async (email: string): Promise<IUser> => {
        const result = await pool.query(
            'SELECT user_id as "userId",email,password,first_name as "firstName",last_name as "lastName",token FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    },
    create: async (user: IUser): Promise<void> => {
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
    },
};

export default UserRepository;
