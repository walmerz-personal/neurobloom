#!/usr/bin/env node

/**
 * NeuroBloom Supabase MCP Server
 * 
 * Provides Model Context Protocol access to the NeuroBloom Supabase database.
 * Exposes tools for querying, inserting, updating, and deleting records.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEBUG = process.env.DEBUG === 'true';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Missing required environment variables.');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
    process.exit(1);
}

// Initialize Supabase client with service role key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Create MCP server instance
const server = new Server(
    {
        name: 'neurobloom-supabase',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define available tools
const TOOLS = [
    {
        name: 'query_table',
        description: 'Query data from a Supabase table with optional filtering, ordering, and pagination. Returns matching records.',
        inputSchema: {
            type: 'object',
            properties: {
                table: {
                    type: 'string',
                    description: 'Table name (e.g., "users", "user_profiles", "daily_logs", "conversations")',
                },
                columns: {
                    type: 'string',
                    description: 'Comma-separated list of columns to select (e.g., "id,name,email"). Use "*" for all columns.',
                    default: '*',
                },
                filters: {
                    type: 'object',
                    description: 'Filter conditions as key-value pairs (e.g., {"role": "survivor", "email": "user@example.com"})',
                    additionalProperties: true,
                },
                order: {
                    type: 'string',
                    description: 'Column to order by (e.g., "created_at")',
                },
                ascending: {
                    type: 'boolean',
                    description: 'Sort in ascending order (default: true)',
                    default: true,
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of records to return',
                    default: 100,
                },
            },
            required: ['table'],
        },
    },
    {
        name: 'insert_record',
        description: 'Insert a new record into a Supabase table. Returns the created record.',
        inputSchema: {
            type: 'object',
            properties: {
                table: {
                    type: 'string',
                    description: 'Table name to insert into',
                },
                data: {
                    type: 'object',
                    description: 'Record data as key-value pairs',
                    additionalProperties: true,
                },
            },
            required: ['table', 'data'],
        },
    },
    {
        name: 'update_record',
        description: 'Update an existing record in a Supabase table by ID. Returns the updated record.',
        inputSchema: {
            type: 'object',
            properties: {
                table: {
                    type: 'string',
                    description: 'Table name to update',
                },
                id: {
                    type: 'string',
                    description: 'ID of the record to update (UUID)',
                },
                data: {
                    type: 'object',
                    description: 'Updated data as key-value pairs',
                    additionalProperties: true,
                },
            },
            required: ['table', 'id', 'data'],
        },
    },
    {
        name: 'delete_record',
        description: 'Delete a record from a Supabase table by ID. Returns confirmation.',
        inputSchema: {
            type: 'object',
            properties: {
                table: {
                    type: 'string',
                    description: 'Table name to delete from',
                },
                id: {
                    type: 'string',
                    description: 'ID of the record to delete (UUID)',
                },
            },
            required: ['table', 'id'],
        },
    },
    {
        name: 'get_schema',
        description: 'Get schema information for a table, including column names, types, and constraints.',
        inputSchema: {
            type: 'object',
            properties: {
                table: {
                    type: 'string',
                    description: 'Table name to get schema for',
                },
            },
            required: ['table'],
        },
    },
    {
        name: 'execute_rpc',
        description: 'Execute a Supabase RPC (Remote Procedure Call) function.',
        inputSchema: {
            type: 'object',
            properties: {
                function_name: {
                    type: 'string',
                    description: 'Name of the RPC function to execute',
                },
                params: {
                    type: 'object',
                    description: 'Parameters to pass to the function',
                    additionalProperties: true,
                },
            },
            required: ['function_name'],
        },
    },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: TOOLS,
    };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (DEBUG) {
        console.error(`[DEBUG] Tool called: ${name}`, JSON.stringify(args, null, 2));
    }

    try {
        switch (name) {
            case 'query_table': {
                const { table, columns = '*', filters = {}, order, ascending = true, limit = 100 } = args;

                let query = supabase.from(table).select(columns);

                // Apply filters
                for (const [key, value] of Object.entries(filters)) {
                    query = query.eq(key, value);
                }

                // Apply ordering
                if (order) {
                    query = query.order(order, { ascending });
                }

                // Apply limit
                query = query.limit(limit);

                const { data, error } = await query;

                if (error) throw error;

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }

            case 'insert_record': {
                const { table, data } = args;

                const { data: result, error } = await supabase
                    .from(table)
                    .insert(data)
                    .select();

                if (error) throw error;

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case 'update_record': {
                const { table, id, data } = args;

                const { data: result, error } = await supabase
                    .from(table)
                    .update(data)
                    .eq('id', id)
                    .select();

                if (error) throw error;

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case 'delete_record': {
                const { table, id } = args;

                const { error } = await supabase
                    .from(table)
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Successfully deleted record with ID: ${id} from table: ${table}`,
                        },
                    ],
                };
            }

            case 'get_schema': {
                const { table } = args;

                // Query information schema for table structure
                const { data, error } = await supabase
                    .from('information_schema.columns')
                    .select('column_name, data_type, is_nullable, column_default')
                    .eq('table_schema', 'public')
                    .eq('table_name', table)
                    .order('ordinal_position');

                if (error) throw error;

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }

            case 'execute_rpc': {
                const { function_name, params = {} } = args;

                const { data, error } = await supabase.rpc(function_name, params);

                if (error) throw error;

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        console.error(`[ERROR] Tool execution failed:`, error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    if (DEBUG) {
        console.error('[INFO] NeuroBloom Supabase MCP Server started successfully');
        console.error(`[INFO] Connected to Supabase at: ${SUPABASE_URL}`);
    }
}

main().catch((error) => {
    console.error('[FATAL] Server initialization failed:', error);
    process.exit(1);
});
