# NotGitHub In-Depth Technical Analysis

This document provides a detailed breakdown of NotGitHub's backend architecture, examining each essential folder and its core components.

## Table of Contents
- [Auth](#auth)
- [Config](#config)
- [Models](#models)
- [Handlers](#handlers)
- [SSH](#ssh)
- [Utils](#utils)
- [Repositories](#repositories)

## Auth

The Auth folder contains authentication-related functionality, crucial for user identity management and security.

### `jwt.go`

#### What is JWT?
JWT (JSON Web Token) is a compact, self-contained method for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed using a secret key. JWTs are commonly used for authentication and information exchange.

#### Implementation Details

The file implements two primary functions:

1. **`GenerateToken(userID string) (string, error)`**
   - Creates and signs a new JWT token for the specified user
   - Uses the JWT_SECRET environment variable as the signing key
   - Sets token expiration based on JWT_EXPIRATION_HOURS (defaults to 24 hours)
   - Creates a payload with the user ID and standard JWT claims
   - Signs the token using HMAC-SHA256 algorithm

2. **`ValidateToken(tokenString string) (*Claims, error)`**
   - Validates and parses a JWT token
   - Verifies the token signature using the same JWT_SECRET
   - Checks token validity and expiration
   - Returns the claims containing the user ID if validation succeeds

The `Claims` structure extends the standard JWT claims with a custom `UserID` field to identify the authenticated user.

#### Security Considerations
- Uses environment variables for secrets, avoiding hardcoded credentials
- Implements proper expiration to limit token lifetimes
- Defines custom error types for clear error handling
- Employs standard JWT libraries with established security practices

## Config

The Config folder manages application configuration and database connections. It serves as the central point for environment variable management and database initialization.

### `env.go`

#### Purpose
Handles loading and validation of environment variables used throughout the application.

#### Implementation Details
- Uses the godotenv library to load variables from .env files
- Checks for required environment variables and logs warnings for missing values
- Provides a clean API for environment variable management

### `db.go`

#### Purpose
Manages database connections and schema initialization.

#### Implementation Details
1. **Database Connection**
   - Establishes connection to SQLite database
   - Uses environment variables or defaults for configuration
   - Provides a shared `DB` instance for the entire application

2. **Schema Initialization**
   - Creates database tables if they don't exist
   - Defines schemas for users, repositories, collaborators, SSH keys, issues, and issue votes
   - Sets up relationships with foreign key constraints

3. **Database Structure**
   - `users`: Stores user account information and credentials
   - `repositories`: Manages repository metadata and ownership
   - `repository_collaborators`: Handles access control for repositories
   - `ssh_keys`: Stores user SSH public keys for authentication
   - `issues`: Tracks issue information for repositories
   - `issue_votes`: Records user votes on issues

## Models

The Models folder defines data structures that map to database tables and implements business logic for data manipulation. It serves as the data access layer.

### `repository.go`

#### Purpose
Manages Git repository data, including creation, retrieval, updating, and deletion.

#### Key Structures
- `Repository`: Represents a Git repository with metadata
- `RepositoryInput`: Input structure for creating/updating repositories

#### Core Functions
1. **`CreateRepository(ownerID string, input RepositoryInput) (*Repository, error)`**
   - Creates a record in the database
   - Initializes a Git repository on the filesystem
   - Sets up Git hooks and permissions
   - Links the repository to an owner

2. **`GetRepositoryBy*` functions**
   - Various lookup methods to retrieve repositories by ID, name, or owner
   - Joins with user table to include owner information

3. **`UpdateRepository(id string, input RepositoryInput) (*Repository, error)`**
   - Updates repository metadata (name, description, visibility)

4. **`DeleteRepository(id string) error`**
   - Removes the repository from the database
   - Deletes the corresponding files from the filesystem

### `user.go`

#### Purpose
Manages user accounts, authentication, and profile information.

#### Key Operations
- User registration with password hashing
- Credential validation for authentication
- Profile data retrieval and updates
- User lookup by various identifiers (ID, username, email)

### `issue.go`

#### Purpose
Implements the issue tracking system for repositories.

#### Key Features
- Issue creation, retrieval, and updates
- Status management (open/closed)
- Association with repositories and creators

### `issue_vote.go`

#### Purpose
Handles the voting mechanism for repository issues.

#### Implementation Details
- `IssueVote` structure represents a user's vote on an issue
- `VoteOnIssue` function creates or updates a vote (upvote or downvote)
- `RemoveVote` function removes a user's vote from an issue
- Maintains vote counts for prioritizing issues

### `ssh_key.go`

#### Purpose
Manages SSH public keys for user authentication with the Git SSH server.

#### Implementation Details
- Stores key metadata (name, fingerprint) and the actual public key
- Links keys to user accounts
- Provides validation and verification methods

## SSH

The SSH folder implements a custom SSH server that handles Git operations over the SSH protocol.

### `server.go`

#### Purpose
Provides a secure SSH server for Git clone, pull, and push operations.

#### Implementation Details

1. **Server Setup**
   - `NewServer` initializes an SSH server with appropriate configuration
   - Loads or generates SSH host keys for server identity
   - Configures public key authentication only

2. **Authentication**
   - `authPublicKey` authenticates users based on stored SSH keys
   - Validates fingerprints against the database
   - Associates connections with user identities

3. **Command Execution**
   - Parses and validates Git commands (git-upload-pack, git-receive-pack)
   - Maps repository paths based on authenticated user and requested repository
   - Executes Git commands securely with appropriate permissions

4. **Security Features**
   - Timeout handling for connections
   - Proper key management and verification
   - Permission validation for repository access

## Handlers

The Handlers folder contains HTTP request handlers that process API requests and return responses. These form the controller layer of the application.

### Key Handler Files

1. **`auth.go`**
   - Handles user registration and login
   - Issues JWT tokens upon successful authentication
   - Validates credentials against the database

2. **`repository.go`**
   - Implements CRUD operations for repositories
   - Processes creation, listing, updating, and deletion requests
   - Enforces access control based on ownership

3. **`repository_browser.go`**
   - Enables browsing repository contents
   - Traverses Git trees to display files and directories
   - Provides file content retrieval

4. **`git_http.go`**
   - Implements Git Smart HTTP protocol
   - Handles Git operations over HTTP (clone, pull, push)
   - Acts as a bridge between Git clients and server-side repositories

5. **`issue.go`**
   - Manages issue creation, retrieval, and updates
   - Implements status changes and listing
   - Provides filtering capabilities

6. **`ssh_key.go`**
   - Handles SSH key management (add, list, delete)
   - Validates key format and uniqueness
   - Associates keys with user accounts

## Utils

The Utils folder contains helper functions and utilities used throughout the application. These are reusable components that simplify common operations.

### Key Utility Files

1. **`git.go`**
   - Git operations like repository initialization
   - Directory structure management
   - Path resolution and validation

2. **`git_browser.go`**
   - Functions for traversing Git repositories
   - File listing and content retrieval
   - Branch and commit handling

3. **`password.go`**
   - Secure password hashing using bcrypt
   - Password validation and verification
   - Security settings for password storage

4. **`repo_access.go`**
   - Repository access control logic
   - Permission checking and validation
   - Path sanitization and security measures

5. **`auth_context.go`**
   - Authentication context extraction from requests
   - JWT validation and user identification
   - Request scoping based on authenticated user

## Repositories 

The Repositories folder implements the repository pattern for data access. This folder may contain additional data access logic beyond what's provided in the models.

### Purpose
- Separates data access logic from business logic
- Provides a consistent interface for database operations
- Enables easier testing through dependency injection
- May implement caching or advanced query features

## Integration Points

The NotGitHub backend integrates several technologies to provide a cohesive experience:

1. **Git Integration**
   - Direct file system operations for repository management
   - Support for both HTTP and SSH Git protocols
   - Custom hooks for server-side validations

2. **Authentication Flow**
   - JWT-based authentication for API requests
   - SSH key authentication for Git operations
   - Unified user identity across protocols

3. **Database Interactions**
   - SQLite for data persistence
   - SQL queries with proper parameter binding for security
   - Transaction support for atomic operations

## Critical Security Considerations

1. **Authentication Security**
   - JWT tokens with proper expiration and secret management
   - Password hashing with bcrypt
   - SSH key verification with fingerprint comparison

2. **Access Control**
   - Repository ownership validation
   - Public/private repository differentiation
   - Permission checks before operations

3. **Input Validation**
   - Parameter sanitization
   - Path traversal prevention
   - SQL injection protection
