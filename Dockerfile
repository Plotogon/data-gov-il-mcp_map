FROM node:18-slim

# Install system dependencies for spawn usage if needed
# (node:slim usually has everything needed for standard node apps)

WORKDIR /app

# Copy the monorepo structure for the relevant packages
COPY packages/mcp-geospatial ./packages/mcp-geospatial
COPY packages/govmap-explorer ./packages/govmap-explorer
# If there are shared internal packages (e.g. mcp-discovery), copy them too. 
# Based on context, only these two are critical for the demo.

# Install dependencies for MCP Geospatial Server
WORKDIR /app/packages/mcp-geospatial
RUN npm install --production

# Install dependencies for GovMap Explorer
WORKDIR /app/packages/govmap-explorer
RUN npm install --production

# Expose the application port
EXPOSE 3001

# Start the explorer (which will spawn the MCP server internally)
CMD ["node", "src/server.js"]
