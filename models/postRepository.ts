import pool from '../storage/db';

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
};

export default PostRepository;
