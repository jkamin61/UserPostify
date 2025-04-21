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
    const posts: Post[] = await PostRepository.getUserPosts(userId);
    if (!posts) {
        logger.error('User does not have any posts');
        throw new Error('User is not registered as author of posts');
    }
    return posts;
}

export async function deletePost(postId: string): Promise<boolean> {
    try {
        const result = await PostRepository.delete(postId);
        if (!result) {
            logger.error('Post of given ID not found');
            throw new Error('Post not found');
        }
        return result;
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
