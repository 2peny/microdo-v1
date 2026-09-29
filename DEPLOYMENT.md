# MicroDo Deployment & Hosting Guide

MicroDo can be hosted in two ways depending on your server environment:

---

## Option A: cPanel Node.js Application (Full-Stack with AI Summarizer API)

Use this method if you want both the interactive frontend and the live server-side AI summarizer `/api/summarize-module`.

### Step 1: Upload Files
Upload the following files and folders into your application folder (e.g. `/home/username/microdo` or `studyflow`):
- `server.js`
- `package.json`
- `.env.example` (rename to `.env` and set your `GEMINI_API_KEY`)
- `dist/` (folder containing compiled assets and `index.html`)

### Step 2: Configure in cPanel
1. In cPanel, navigate to **Setup Node.js App** (CloudLinux / Passenger).
2. Click **Create Application**.
3. Configure the fields:
   - **Node.js version**: 18.x, 20.x, or 22.x
   - **Application mode**: `Production`
   - **Application root**: `microdo` (or your folder name)
   - **Application URL**: `yourdomain.com` (or subdomain)
   - **Application startup file**: `server.js`
4. Click **Create**.
5. Under **Environment variables**, add:
   - `GEMINI_API_KEY`: *your-api-key* (optional, fallback parser will activate if omitted)
6. Click **Run NPM Install**.
7. Click **Restart**.

Your application will now be running live with full server-side routing and fallback!

---

## Option B: Static Web Hosting (cPanel public_html, Apache, Nginx, Netlify, Vercel)

MicroDo is architected with a smart client-side fallback parser, meaning it runs 100% in the browser even without a Node.js server!

### Step 1: Upload the `dist/` contents
Copy or extract the contents of the `dist/` folder directly into your web root (e.g. `/home/username/public_html`):
- `index.html`
- `assets/`
- `.htaccess` (pre-configured for Apache URL rewrites and gzip compression)

### Step 2: Done!
Visit your domain. The interactive 3-tier progressive flow, demo playback, and module analysis will work right away in the browser.

---

## Testing Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
