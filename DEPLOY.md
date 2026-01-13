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

    > **Note:** Render now requires a credit card even for free tier. If you don't have one, see Option 3 below.

3.  **Configure the Service**
    *   **Runtime**: Select **Docker** (This is crucial! Do not select Node.js).
    *   **Region**: Frankfurt (closest to Israel) or any preference.
    *   **Instance Type**: Free
    *   **Environment Variables**: None required for basic usage.

4.  **Deploy**
    *   Click **Create Web Service**.
    *   Render will read the `Dockerfile` from the root, build the image, and start the server.

## Option 3: Hugging Face Spaces (Truly Free)

[Hugging Face Spaces](https://huggingface.co/spaces) offers Docker hosting that often doesn't require a credit card for the basic CPU tier.

1.  **Sign up** at huggingface.co.
2.  **Create a new Space**.
    *   Select **Docker** as the SDK.
    *   Choose a generic "Blank" or "CPU" hardware.
3.  **Upload Code**:
    *   You can sync your GitHub repo (Settings -> Repository) OR just push your files there manually.
4.  **Configuration**:
    *   Hugging Face expects the app to listen on port `7860`.
    *   My code automatically detects this, so it should Just Work™!


### Local Docker Testing

If you have Docker installed locally, you can test the build:

```bash
# Build the image
docker build -t govmap-explorer .

# Run the container
docker run -p 3001:3001 govmap-explorer
```


## Option 2: Instant Sharing (No Deployment / No Credit Card)

If you just want to show friends quickly without signing up anywhere:

1.  **Keep your local server running** (`npm start`).
2.  Open a **new terminal** (PowerShell or CMD) in this folder.
3.  Run this command:

    ```bash
    npx localtunnel --port 3001
    ```

4.  It will give you a link (e.g., `https://calm-badger-42.loca.lt`).
5.  Send this link to your friends!

**Note:** The link only works while your computer is on and the command is running.

