# NotGitHub

NotGitHub is a self-hosted GitHub alternative that provides users with full control over their code repositories and collaboration tools. This platform enables developers to manage code, track versions, handle issues, and collaborate securely through SSH and HTTP protocols.

## Overview

NotGitHub aims to provide the core functionality of GitHub while giving users complete ownership of their data. The application is built with a clear separation between frontend and backend components, using modern web technologies and a robust architecture.

## Technology Stack

- **Frontend**: React with Tailwind CSS for a responsive and modern UI
- **Backend**: Golang for high-performance server implementation
- **Database**: SQL database (via Go's database/sql package)
- **Version Control**: Git integration for repository management
- **Authentication**: JWT-based authentication system
- **Protocols**: Support for both SSH and HTTP Git protocols

## Application Architecture

### Backend Architecture

The backend is built with Go and follows a modular structure organized by functional components. Here's a detailed explanation of each directory and its purpose:

#### `/backend`

The root directory of the server implementation contains the main application entry point (`main.go`). This file initializes the server, sets up routes, connects to the database, and starts both the HTTP and SSH servers in separate goroutines.

Key initialization steps include:
1. Loading environment variables
2. Establishing database connections
3. Starting the SSH server
4. Setting up HTTP routes with CORS support
5. Initializing the web server

#### `/backend/config`

Handles configuration and environment setup for the application:

- `db.go`: Manages database connection setup and provides the global database instance
- `env.go`: Loads environment variables from .env files for configuration

The database connection is a critical component, providing a shared resource for the entire application to interact with persistent storage.

#### `/backend/auth`

Implements authentication mechanisms:

- `jwt.go`: Handles JWT token generation, validation, and management for secure user authentication

The JWT implementation provides stateless authentication, allowing the application to verify user identity without maintaining session state on the server.

#### `/backend/models`

Defines data structures and database schemas:

- `user.go`: User account data structure and methods
- `repository.go`: Repository information and metadata
- `issue.go`: Issue tracking functionality
- `issue_vote.go`: Voting system for repository issues
- `ssh_key.go`: SSH key management for secure repository access
- `public_repository.go`: Public repository information accessible without authentication

These models serve as both database schemas and business logic containers, encapsulating CRUD operations and validation rules.

#### `/backend/handlers`

Contains HTTP request handlers that process incoming API requests:

- `auth.go`: User registration, login, and authentication
- `repository.go`: Repository creation, deletion, and management
- `repository_browser.go`: File browsing within repositories
- `repository_by_name.go`: Access repositories by username/repository name
- `git_http.go`: Handles Git HTTP protocol requests (clone, pull, push)
- `issue.go`: Issue creation, retrieval, and management
- `issue_vote.go`: Vote tracking for repository issues
- `ssh_key.go`: SSH key management for repository access
- `public_repository.go` and `public_repository_list.go`: Public repository exploration

These handlers form the API layer, translating HTTP requests into business logic operations and returning appropriate responses.

#### `/backend/routes`

Manages API endpoint routing and middleware configuration. The main.go file currently handles routing directly, but this directory may contain additional route organization in the future.

#### `/backend/ssh`

Implements SSH server functionality for secure Git operations:

- `server.go`: SSH server implementation that handles Git operations over SSH

The SSH server provides secure repository access using standard Git tooling, allowing users to clone, pull, and push using SSH keys for authentication.

#### `/backend/utils`

Provides helper functions and utilities:

- `auth_context.go`: Authentication context management
- `git.go`: Git operations like cloning and repository management
- `git_browser.go`: Utilities for browsing Git repositories
- `password.go`: Password hashing and verification
- `repo_access.go`: Repository access control
- `user.go`: User-related utility functions
- `user_stats.go`: User activity statistics calculation

These utilities provide reusable functions that simplify complex operations across the application.

#### `/backend/repositories`

Implements the repository pattern for data access, potentially containing custom database access logic beyond what the models provide.

#### `/backend/scripts`

Contains utility scripts for maintenance and testing:

- `delete_ssh_keys.go`: Maintenance script for SSH key cleanup
- `migrate_repository_paths.go`: Repository path migration tool
- `test_ssh.go` and `test_ssh_connection.go`: SSH connection testing

These scripts assist in development, testing, and maintenance operations.




### Frontend Architecture

The React frontend is organized into functional components with a clean separation of concerns:

#### `/frontend/src`

The main source directory containing React application code.

#### `/frontend/src/components`

Reusable UI components organized by functionality:

- `/repositories`: Repository-specific components for display and interaction

#### `/frontend/src/pages`

Complete page components that combine multiple smaller components to form full application views.

#### `/frontend/src/contexts`

React contexts for state management across components, likely including authentication state.

#### `/frontend/src/services`

API interaction services that abstract communication with the backend API.

#### `/frontend/src/utils`

Helper functions and utilities for frontend operations.

#### `/frontend/src/assets`

Static resources like images, icons, and other media files.

## Key Features and Problem Solutions

### Authentication System

The application implements a secure JWT-based authentication system that:

1. Handles user registration and login through the auth handler
2. Generates secure JWT tokens with appropriate expiration
3. Validates tokens on protected routes
4. Maintains user sessions without server-side state

### Repository Management

The repository system is a core component that:

1. Creates and manages Git repositories on the server filesystem
2. Provides browsing capabilities for repository contents
3. Handles both SSH and HTTP Git protocols for clone/pull/push operations
4. Implements access control based on ownership and permissions

### Git Protocol Support

One of the most complex aspects of the application is Git protocol support:

1. **HTTP Git Protocol**: Implemented in `handlers/git_http.go`, which processes Git smart HTTP requests and delegates to the appropriate Git commands
2. **SSH Git Protocol**: Implemented in the SSH server, allowing secure Git operations authenticated by SSH keys

These integrations allow users to interact with repositories using standard Git clients and workflows.

### Issue Tracking

The issue tracking system provides GitHub-like functionality:

1. Issue creation and management
2. Status updates (open/closed)
3. Voting mechanism for prioritizing issues

### Public Repository Exploration

The application distinguishes between private and public repositories:

1. Public repositories can be browsed without authentication
2. Repository contents can be viewed through dedicated endpoints
3. User statistics provide insights into public activity

## Development Approach

This project is developed with a feature-by-feature approach to maintain a clean Git history, making it easier to track changes and understand the evolution of the codebase.

## Security Considerations

The application implements several security measures:

1. Password hashing for secure storage
2. JWT-based authentication
3. SSH key management for secure Git operations
4. Access control for repository operations
5. CORS configuration to prevent unauthorized cross-origin requests

## Deployment

The application can be deployed as a self-hosted solution, giving users complete control over their data and infrastructure. Both the HTTP server and SSH server can be configured to run on custom ports to avoid conflicts with existing services.

Companies that do not want to use GitHub or GitLab can use this application to host their repositories.

## Integration with Git Clients

Users can interact with repositories using standard Git clients through both HTTP and SSH protocols, providing a seamless experience similar to GitHub while maintaining full control over the hosting environment.
