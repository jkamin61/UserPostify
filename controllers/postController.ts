import { promises as fs } from 'node:fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import PostRepository, { Post } from '../models/postRepository';

const postsPath = path.join(process.cwd(), 'storage', 'posts.json');

export interface UpdatePostPayload {
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
        const post: Post = {
            postId: uuidv4(),
            title,
            description,
            createdDate: new Date(),
            authorId,
        };
        await PostRepository.create(post);

        return post;
    } catch (err: any) {
        logger.error('Error creating post:', err.message);
        throw new Error('Could not create post');
    }
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
