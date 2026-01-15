/**
 * A lightweight Mock MCP Server that runs in-process.
 * Allows calling tools directly without JSON-RPC transport.
 */
export class MockMcpServer {
    constructor(info) {
        this.name = info?.name || 'mock-server';
        this.tools = new Map();
    }

    /**
     * Register a tool
     * @param {string} name 
     * @param {object} schema 
     * @param {function} handler 
     */
    tool(name, schema, handler) {
        this.tools.set(name, { schema, handler });
    }

    /**
     * Simulate calling a tool via the Client interface
     * @param {object} request {name, arguments}
     */
    async callTool(request) {
        const toolEntry = this.tools.get(request.name);

        if (!toolEntry) {
            throw new Error(`Tool "${request.name}" not found in server ${this.name}`);
        }

        try {
            // Execute the handler directly
            const result = await toolEntry.handler(request.arguments || {});

            // Format as MCP-like response if it isn't already
            if (result && result.content) {
                return result;
            }
            // Fallback for tools that might return raw text
            return {
                content: [{ type: "text", text: typeof result === 'string' ? result : JSON.stringify(result) }]
            };

        } catch (error) {
            console.error(`[${this.name}] Error executing tool ${request.name}:`, error);
            throw error;
        }
    }
}
