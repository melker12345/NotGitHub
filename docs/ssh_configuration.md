# SSH Configuration Guide for GitHub Clone

This guide explains how to set up SSH for secure Git operations with your GitHub Clone repository.

## SSH Key Setup

### 1. Generate an SSH Key (if needed)

If you don't already have an SSH key, generate one using:

```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Press Enter to accept the default file location or specify a custom path.

### 2. Add Your SSH Key to GitHub Clone

1. Copy your public key content:
   ```powershell
   Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
   ```

2. Log in to GitHub Clone in your browser
3. Navigate to SSH Keys page (Profile > SSH Keys)
4. Click "Add SSH Key" 
5. Paste your public key content and add a title (e.g., "My Laptop")

### 3. Configure Git Repository

When creating a new repository or configuring an existing one, set the remote using:

```powershell
# For a new repository
git init
git add .
git commit -m "Initial commit"
git remote add origin ssh://git@localhost:2222/username/repository.git

# Push to the repository
git push -u origin master
```

### 4. Debugging SSH Connections

If you encounter SSH connection issues:

1. Test your SSH connection:
   ```powershell
   ssh -vT git@localhost -p 2222
   ```

2. Verify your SSH key is added to the application through the web interface

3. Make sure you're using the correct remote URL format:
   ```
   ssh://git@localhost:2222/username/repository.git
   ```

4. If you're still having problems, check the server logs for more information
