# MCP Server Setup Guide

This document explains the MCP (Model Context Protocol) servers configured for the NeuroBloom project.

## Configured Servers

### 1. Supabase MCP ✅
- **Status**: Already configured and working
- **Purpose**: Database management, migrations, edge functions, schema introspection
- **Configuration**: Remote server via Supabase Cloud

### 2. Render MCP ✅
- **Status**: Already configured and working
- **Purpose**: Infrastructure management and deployment
- **Configuration**: Remote server with API token

### 3. Expo MCP ✅
- **Status**: Already configured and working
- **Purpose**: Expo/React Native app management
- **Configuration**: Remote server via Expo Cloud

### 4. GitHub MCP ⚠️ (Requires Setup)
- **Status**: Configured but requires GitHub Personal Access Token and Docker
- **Purpose**: GitHub repository operations (issues, PRs, code search, etc.)
- **Setup Required**:
  
  **Prerequisites:**
  - Docker Desktop installed and running
  - GitHub Personal Access Token (PAT)
  
  **Steps:**
  
  1. **Start Docker Desktop** (if not already running)
     - Open Docker Desktop application
     - Wait for it to fully start
  
  2. **Create a GitHub Personal Access Token (PAT)**:
     - Go to: https://github.com/settings/tokens
     - Click "Generate new token (classic)"
     - Name it: "Cursor MCP Server"
     - Select scopes: `repo` (for private repos) or `public_repo` (for public only)
     - Copy the token (you won't see it again!)
  
  3. **Set the environment variable**:
     ```bash
     export GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"
     ```
     
     To make it persistent, add to your `~/.zshrc`:
     ```bash
     echo 'export GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"' >> ~/.zshrc
     source ~/.zshrc
     ```
  
  4. **Pull the Docker image** (first time only):
     ```bash
     docker pull ghcr.io/github/github-mcp-server
     ```
  
  5. **Restart Cursor** after completing the above steps

### 5. File System MCP ✅
- **Status**: Configured and ready
- **Purpose**: File operations within the NeuroBloom project directory
- **Access**: Limited to `/Users/zack/Desktop/NeuroBloom`
- **Note**: This server will be automatically installed via `npx` when first used

## Configuration Location

The MCP configuration is stored at: `~/.cursor/mcp.json`

## Troubleshooting

### GitHub MCP Not Working
- Verify Docker is installed: `docker --version`
- Verify the GitHub token is set: `echo $GITHUB_PERSONAL_ACCESS_TOKEN`
- Pull the Docker image: `docker pull ghcr.io/github/github-mcp-server`
- Restart Cursor after setting environment variables

### File System MCP Not Working
- Ensure Node.js/npm is installed: `node --version` and `npm --version`
- The server will auto-install on first use via `npx`
- Verify the project path is correct in the configuration

## Testing MCP Servers

After restarting Cursor, you can test if the MCP servers are working by:
1. Opening a chat in Cursor
2. Asking to list available MCP tools
3. Trying a simple operation (e.g., "List files in the project" for filesystem, or "Show my GitHub repos" for GitHub)

## Security Notes

- **Never commit** your GitHub Personal Access Token to version control
- The File System MCP is limited to your project directory for security
- Keep your MCP configuration file (`~/.cursor/mcp.json`) private
