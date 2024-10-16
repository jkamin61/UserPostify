import { promises as fs } from 'node:fs';
import fsP from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'stream';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

const postsPath = path.join(__dirname, '../storage/posts.json');

interface Post {
    postId: string;
    title: string;
    description: string;
    createdDate: Date;
    authorId: string;
}

interface UpdatePostPayload {
    title?: string;
    description?: string;
}

async function getPostsData(): Promise<Post[]> {
    const data: string = await fs.readFile(postsPath, 'utf-8');
    return JSON.parse(data);
}

export async function createPost(
    title: string,
    description: string,
    authorId: string
): Promise<Post> {
    if (!title || !description) {
        throw new Error('Invalid title or description');
    }

    try {
        const posts: Post[] = await readPostsStream();

        const post: Post = {
            postId: uuidv4(),
            title,
            description,
            createdDate: new Date(),
            authorId,
        };

        posts.push(post);

        await writePostsStream(posts);

        return post;
    } catch (err: any) {
        logger.error('Error creating post:', err.message);
        throw new Error('Could not create post');
    }
}

async function readPostsStream(): Promise<Post[]> {
    return new Promise((resolve, reject) => {
        let data = '';

        const readStream = fsP.createReadStream(postsPath, {
            encoding: 'utf-8',
        });

        readStream.on('data', (chunk) => {
            data += chunk;
        });

        readStream.on('end', () => {
            try {
                const posts: Post[] = JSON.parse(data || '[]');
                resolve(posts);
            } catch (err) {
                logger.error('Error:', err);
                reject(new Error('Error parsing JSON data'));
            }
        });

        readStream.on('error', (err) => {
            reject(err);
        });
    });
}

async function writePostsStream(posts: Post[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const jsonData = JSON.stringify(posts, null, 2);

        const writeStream = fsP.createWriteStream(postsPath, {
            flags: 'w',
            encoding: 'utf-8',
        });

        const readableStream: Readable = Readable.from([jsonData]);

        pipeline(readableStream, writeStream)
            .then(() => resolve())
            .catch((err) => {
                logger.error('Error: ', err);
                reject(new Error('Error writing JSON data'));
            });
    });
}

export async function getUserPosts(userId: string): Promise<Post[]> {
    const posts: Post[] = await getPostsData();
    return posts.filter((post) => post.authorId === userId);
}

export async function deletePost(
    postId: string,
    userId: string
): Promise<boolean> {
    try {
        const posts: Post[] = await getUserPosts(userId);
        const postToBeDeleted: Post | undefined = posts.find(
            (post) => post.postId === postId
        );
        if (!postToBeDeleted) {
            logger.error('No post of given ID');
            return false;
        }
        const newPosts: Post[] = posts.filter((post) => post.postId !== postId);
        await fs.writeFile(
            postsPath,
            JSON.stringify(newPosts, null, 2),
            'utf-8'
        );
        return true;
    } catch (err: any) {
        logger.error('Error while deleting post:', err);
        throw new Error(err.message);
    }
}

export async function updatePost(
    postId: string,
    userId: string,
    updatePayload: UpdatePostPayload
): Promise<Post | undefined> {
    try {
        const posts: Post[] = await getUserPosts(userId);
        const postToBeUpdated: Post | undefined = posts.find(
            (post) => post.postId === postId
        );

        if (!postToBeUpdated) {
            logger.error('No post of given ID');
            return undefined;
        }

        if (updatePayload.title) {
            postToBeUpdated.title = updatePayload.title;
        }
        if (updatePayload.description) {
            postToBeUpdated.description = updatePayload.description;
        }

        await fs.writeFile(postsPath, JSON.stringify(posts, null, 2), 'utf-8');

        return postToBeUpdated;
    } catch (err: any) {
        logger.error('Error while updating post:', err);
        throw new Error(err.message);
    }
}
