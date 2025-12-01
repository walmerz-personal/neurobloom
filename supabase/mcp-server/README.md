# NeuroBloom Supabase MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with secure, structured access to the NeuroBloom Supabase database.

## Features

- **Query Data**: Search and filter records from any table
- **Insert Records**: Add new data to the database
- **Update Records**: Modify existing records by ID
- **Delete Records**: Remove records from tables
- **Schema Introspection**: Get table structure and column information
- **RPC Execution**: Execute custom Supabase functions

## Installation

1. Navigate to the MCP server directory:
```bash
cd supabase/mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the template:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DEBUG=false
```

> **⚠️ Security Warning**: The service role key has full admin access to your database. Never commit it to version control or share it publicly!

## Available Tools

### 1. query_table
Query data from a table with filtering and pagination.

**Parameters:**
- `table` (required): Table name (e.g., "users", "daily_logs")
- `columns` (optional): Comma-separated columns (default: "*")
- `filters` (optional): Filter conditions as key-value pairs
- `order` (optional): Column to sort by
- `ascending` (optional): Sort direction (default: true)
- `limit` (optional): Max records to return (default: 100)

**Example:**
```json
{
  "table": "daily_logs",
  "columns": "id,log_date,mood,pain_level",
  "filters": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "order": "log_date",
  "ascending": false,
  "limit": 10
}
```

### 2. insert_record
Insert a new record into a table.

**Parameters:**
- `table` (required): Table name
- `data` (required): Record data as key-value pairs

**Example:**
```json
{
  "table": "daily_logs",
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "log_date": "2025-11-29",
    "mood": "😄",
    "pain_level": 2,
    "energy_level": 8,
    "notes": "Great day today!"
  }
}
```

### 3. update_record
Update an existing record by ID.

**Parameters:**
- `table` (required): Table name
- `id` (required): Record ID (UUID)
- `data` (required): Updated fields as key-value pairs

**Example:**
```json
{
  "table": "daily_logs",
  "id": "987fcdeb-51a2-43f7-8d9e-1a2b3c4d5e6f",
  "data": {
    "mood": "🙂",
    "notes": "Updated my mood"
  }
}
```

### 4. delete_record
Delete a record by ID.

**Parameters:**
- `table` (required): Table name
- `id` (required): Record ID (UUID)

**Example:**
```json
{
  "table": "daily_logs",
  "id": "987fcdeb-51a2-43f7-8d9e-1a2b3c4d5e6f"
}
```

### 5. get_schema
Get schema information for a table.

**Parameters:**
- `table` (required): Table name

**Example:**
```json
{
  "table": "users"
}
```

### 6. execute_rpc
Execute a Supabase RPC function.

**Parameters:**
- `function_name` (required): Name of the RPC function
- `params` (optional): Function parameters

**Example:**
```json
{
  "function_name": "get_user_stats",
  "params": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## Database Tables

The NeuroBloom database includes the following tables:

- **users**: User accounts and basic information
- **user_profiles**: Onboarding data and recovery information
- **daily_logs**: Daily check-ins (mood, pain, energy, exercises)
- **conversations**: Lilly AI chat history

See `schema.sql` for complete table definitions.

## Integration with Claude Desktop

To use this MCP server with Claude Desktop, add it to your Claude configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "neurobloom-supabase": {
      "command": "node",
      "args": ["/Users/zack/Desktop/NeuroBloom/supabase/mcp-server/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key_here"
      }
    }
  }
}
```

After updating the config, restart Claude Desktop. The server tools will be available for use.

## Testing the Server

You can test the server locally using the MCP Inspector:

```bash
# Install MCP Inspector globally (if not already installed)
npm install -g @modelcontextprotocol/inspector

# Run the inspector
npx @modelcontextprotocol/inspector node index.js
```

This will open a web interface where you can test each tool.

## Debugging

Enable debug logging by setting `DEBUG=true` in your `.env` file. This will output detailed information about tool calls and database queries to stderr.

## Security Considerations

1. **Service Role Key**: This key bypasses Row Level Security (RLS) and has full database access. Use it only in trusted environments.
2. **Environment Variables**: Never commit `.env` files to version control.
3. **Network Access**: Consider running the MCP server on a secure network, especially in production.
4. **Input Validation**: The server validates inputs, but additional application-level validation is recommended.

## Troubleshooting

**Connection Issues:**
- Verify `SUPABASE_URL` is correct
- Check that the service role key is valid
- Ensure your network allows connections to Supabase

**Permission Errors:**
- Confirm you're using the service role key, not the anon key
- Check that the table exists in your database
- Verify RLS policies if queries return empty results

**Tool Not Available:**
- Restart Claude Desktop after updating the config
- Check the config file JSON is valid
- Review Claude Desktop logs for errors

## License

MIT
