import pool from '../storage/db';
import { UpdatePostPayload } from '../controllers/postController';

export interface Post {
    postId: string;
    title: string;
    description: string;
    createdDate: Date;
    authorId: string;
}

const PostRepository = {
    findById: async (postId: string): Promise<Post> => {
        const result = await pool.query(
            'SELECT * FROM posts WHERE post_id=$1',
            [postId]
        );
        return result.rows[0] || null;
    },
    getUserPosts: async (userId: string): Promise<Post[]> => {
        const result = await pool.query(
            `SELECT *
             FROM posts
             WHERE author_id = $1`,
            [userId]
        );
        return result.rows || null;
    },
    getAllPosts: async (): Promise<Post[]> => {
        const result = await pool.query(
            `SELECT *
             FROM posts`
        );
        return result.rows || null;
    },
    create: async (post: Post): Promise<void> => {
        await pool.query(
            `INSERT INTO posts (post_id, title, description, created_date, author_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                post.postId,
                post.title,
                post.description,
                post.createdDate,
                post.authorId,
            ]
        );
    },
    delete: async (postId: string): Promise<boolean | null> => {
        const result = await pool.query(
            `DELETE
             FROM posts
             WHERE post_id = $1`,
            [postId]
        );
        return result.rowCount! > 0 || null;
    },
    update: async (
        postId: string,
        updatePayload: UpdatePostPayload
    ): Promise<Post | null> => {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (updatePayload.title) {
            updates.push(`title = $${index++}`);
            values.push(updatePayload.title);
        }

        if (updatePayload.description) {
            updates.push(`description = $${index++}`);
            values.push(updatePayload.description);
        }

        if (updates.length === 0) {
            throw new Error('No fields to update');
        }

        const query = `
            UPDATE posts
            SET ${updates.join(', ')}
            WHERE post_id = ${'$' + index} RETURNING post_id AS "postId", title, description, created_date AS "createdDate", author_id AS "authorId"`;

        values.push(postId);

        const result = await pool.query(query, values);
        return result.rows[0];
    },
};

export default PostRepository;
