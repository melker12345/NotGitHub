# GitHub Clone Project - Implemented Features

## Overview
This document outlines the features currently implemented in our self-hosted GitHub clone project, which provides code management and collaboration capabilities with full user control.

## Backend Features

### Authentication & Authorization
- User registration with username and password
- User login with JWT token generation
- Authentication middleware for protected routes
- User permissions for repository access

### Repository Management
- Create repositories with name and description
- List user repositories
- Update repository details (name, description, visibility)
- Delete repositories
- GitHub-style URL structure (`/{username}/{reponame}`)

### Git Integration
- SSH server for Git operations (port 2222)
- Bare Git repository initialization
- Git commands support via SSH (push, pull, clone)
- Repository filesystem management

### File & Code Browsing
- Repository file structure browsing
- File content viewing
- Commit history viewing

### SSH Key Management
- Add SSH public keys to user accounts
- List user's SSH keys
- Delete SSH keys
- SSH authentication using stored public keys

## Frontend Features

### User Interface
- React-based dynamic UI
- Tailwind CSS styling
- Responsive design for various screen sizes

### Authentication
- Login page with form validation
- Registration page with form validation
- JWT token storage and management
- Protected routes for authenticated users

### Repository Management
- Repository creation form
- Repository listing page
- Repository settings page
- Repository deletion confirmation

### Code Browsing
- File browser interface
- Syntax-highlighted code viewing
- Directory navigation
- Commit history display

### SSH Keys
- SSH key management interface
- SSH key upload
- SSH key listing and deletion

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login

### Repository Management
- GET `/api/repositories` - List repositories
- POST `/api/repositories` - Create repository
- GET `/api/{username}/{reponame}` - Get repository details
- PUT `/api/{username}/{reponame}` - Update repository
- DELETE `/api/{username}/{reponame}` - Delete repository

### Repository Content
- GET `/api/{username}/{reponame}/contents` - Get repository contents
- GET `/api/{username}/{reponame}/file` - Get file content
- GET `/api/{username}/{reponame}/commits` - Get commit history

### SSH Keys
- POST `/api/ssh-keys` - Add SSH key
- GET `/api/ssh-keys` - List SSH keys
- DELETE `/api/ssh-keys/{id}` - Delete SSH key

## Upcoming Features
- HTTP Git support (for clone/pull/push over HTTP)
- Pull request management
- Issue tracking
- User profiles
- Notifications
- Code reviews
- Markdown rendering for README files
- Web hooks for repository events
