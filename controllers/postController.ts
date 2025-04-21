import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import PostRepository, { Post } from '../models/postRepository';

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
    updatePayload: UpdatePostPayload
): Promise<Post | null> {
    try {
        const result = PostRepository.update(postId, updatePayload);
        if (!result) {
            logger.error('No post of given ID');
            return null;
        }
        return result;
    } catch (err: any) {
        logger.error('Error while updating post:', err);
        throw new Error(err.message);
    }
}
