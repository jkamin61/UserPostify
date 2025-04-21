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
    update: async (
        user: IUser,
        newEmail?: string,
        newPassword?: string,
        newFirstName?: string,
        newLastName?: string
    ): Promise<IUser> => {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (newEmail) {
            updates.push(`email = $${index++}`);
            values.push(newEmail);
        }
        if (newPassword) {
            updates.push(`password = $${index++}`);
            values.push(newPassword);
        }
        if (newFirstName) {
            updates.push(`first_name = $${index++}`);
            values.push(newFirstName);
        }
        if (newLastName) {
            updates.push(`last_name = $${index++}`);
            values.push(newLastName);
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        const query = `
            UPDATE users
            SET ${updates.join(', ')}
            WHERE user_id = ${'$' + index}
            RETURNING user_id as "userId", email, password, first_name as "firstName", last_name as "lastName"`;

        values.push(user.userId);

        const result = await pool.query(query, values);
        return result.rows[0];
    },
};

export default UserRepository;
