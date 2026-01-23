#!/bin/bash
# Wrapper script for GitHub MCP server that ensures the token is passed to Docker

# Get the token from environment or from a secure location
TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN}"

if [ -z "$TOKEN" ]; then
    # Try to read from ~/.zshrc or ~/.bashrc if exported there
    # Or you can source it explicitly
    if [ -f ~/.zshrc ]; then
        source ~/.zshrc 2>/dev/null
        TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN}"
    fi
fi

if [ -z "$TOKEN" ]; then
    echo "Error: GITHUB_PERSONAL_ACCESS_TOKEN not set" >&2
    exit 1
fi

# Run Docker with the token
exec docker run -i --rm \
    -e "GITHUB_PERSONAL_ACCESS_TOKEN=${TOKEN}" \
    ghcr.io/github/github-mcp-server "$@"
