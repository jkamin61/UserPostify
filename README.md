# Project: Node.js API with Express.js - User Management and Posts System

## Overview

This project is a **Node.js application** utilizing **Express.js** to provide a complete RESTful API for user management
and post creation. The application allows users to **register, log in**, and manage their profiles, as well as **create,
view, update, and delete posts**. The authentication is handled using **JWT tokens**, and user data is stored in PostgreSQL.

---

## Features and Endpoints

### 1. **Health Check Endpoint**

- **URL**: `/health`
- **Method**: `GET`
- **Description**: This endpoint is used to check if the application is running.

### 2. **User Registration**

- **URL**: `/user/register`
- **Method**: `POST`
- **Description**: Register a new user with `first name`, `last name`, `email`, and `password`. The password is hashed
  before being stored.
- **Data Storage**: User data is stored in a users table.

### 3. **User Login**

- **URL**: `/user/login`
- **Method**: `POST`
- **Description**: Logs in the user by verifying the email and password. If authenticated, a JWT token is generated and
  returned.

### 4. **View Profile**

- **URL**: `/user/current`
- **Method**: `GET`
- **Description**: Fetches the authenticated user's profile data including `first name`, `last name`, and `email`.
- **Authorization**: Requires a valid JWT token.

### 5. **Update Profile**

- **URL**: `/user/update`
- **Method**: `PATCH`
- **Description**: Allows the authenticated user to update their profile’s `first name` and `last name`. Triggers
  a `profileUpdated` event and sends an email notification.
- **Authorization**: Requires a valid JWT token.

### 6. **Create Post**

- **URL**: `/user/post`
- **Method**: `POST`
- **Description**: Authenticated users can create a post with `title` and `description`. The post is stored with the
  user's ID and creation date in the posts table.
- **Authorization**: Requires a valid JWT token.

### 7. **View User’s Posts**

- **URL**: `/user/posts`
- **Method**: `GET`
- **Description**: Authenticated users can view all their own posts, including `title`, `description`, `created date`,
  and `author`.
- **Authorization**: Requires a valid JWT token.

### 8. **Delete Post**

- **URL**: `/user/post/:id`
- **Method**: `DELETE`
- **Description**: Authenticated users can delete their own posts by `post ID`.
- **Authorization**: Requires a valid JWT token.

### 9. **Update Post**

- **URL**: `/user/post/:id`
- **Method**: `PATCH`
- **Description**: Authenticated users can update their own posts by `post ID`. Only the `title` and `description` can
  be updated.
- **Authorization**: Requires a valid JWT token.

## Project Commands and Scripts

### Start the Application

```bash
  npm start
```
