# Deployment Guide

This application is ready to be deployed to any platform that supports Docker, such as **Render**, **Railway**, or **Fly.io**.

## Recommended: Render.com (Free Tier)

Render provides a generous free tier for web services.

### Steps:

1.  **Push your code to GitHub**
    *   Ensure your repository contains the entire `data-gov-il-mcp` folder structure (or at least the `packages` folder and `Dockerfile`).

2.  **Create a New Web Service on Render**
    *   Go to [dashboard.render.com](https://dashboard.render.com)
    *   Click **New +** -> **Web Service**
    *   Connect your GitHub repository.

3.  **Configure the Service**
    *   **Name**: `govmap-explorer` (or any name)
    *   **Runtime**: Select **Docker** (This is crucial! Do not select Node.js).
    *   **Region**: Frankfurt (closest to Israel) or any preference.
    *   **Instance Type**: Free
    *   **Environment Variables**: None required for basic usage.

4.  **Deploy**
    *   Click **Create Web Service**.
    *   Render will read the `Dockerfile` from the root, build the image, and start the server.

### Local Docker Testing

If you have Docker installed locally, you can test the build:

```bash
# Build the image
docker build -t govmap-explorer .

# Run the container
docker run -p 3001:3001 govmap-explorer
```

Then visit `http://localhost:3001`.
