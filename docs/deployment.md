# Coolify Deployment Guide

This guide walks through deploying the portfolio site to a self-hosted VPS using Coolify. The site is packaged as a Docker image (multi-stage Node.js build + Nginx static server) and served at a root domain with SSL managed by Coolify.

## Prerequisites

- VPS with at least 1 vCPU, 1 GB RAM (2 GB recommended)
- Coolify installed on the VPS ([installation guide](https://coolify.io/docs/installation))
- Domain name with DNS access
- Git repository pushed to GitHub (or any supported provider)
- Formspree account for contact form (free tier is sufficient)

---

## Step 1: Set Up Formspree

The contact form (`/contact/`) posts to Formspree. Do this before deploying so the form works on first launch.

1. Go to [formspree.io](https://formspree.io) and create a free account
2. Create a new form — set the email to `limcheekin@vobject.com`
3. Copy the form ID (e.g., `xpwzqabc`)
4. Edit `src/components/ContactForm.astro` line 2:
   ```diff
   - const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";
   + const FORMSPREE_ENDPOINT = "https://formspree.io/f/xpwzqabc";
   ```
5. Commit and push:
   ```bash
   git add src/components/ContactForm.astro
   git commit -m "fix: set Formspree form endpoint"
   git push
   ```

---

## Step 2: Update Domain in Site Config

The site URL is configured in two places. Update both before deploying.

**`src/data/site.ts` line 6:**
```typescript
export const SITE_URL = "https://limcheekin.com";  // replace with your actual domain
```

**`astro.config.mjs` line 7:**
```javascript
site: 'https://limcheekin.com',  // replace with your actual domain
```

This affects canonical URLs, OG meta tags, JSON-LD structured data, and the auto-generated sitemap.

Commit after updating:
```bash
git add src/data/site.ts astro.config.mjs
git commit -m "chore: set production domain"
git push
```

---

## Step 3: Configure DNS

Point your domain to the VPS before configuring Coolify so SSL provisioning succeeds.

1. Log in to your DNS provider
2. Add an **A record**: `@` (root domain) → your VPS IP address
3. Add a **CNAME record** (optional): `www` → `limcheekin.com`
4. Wait for DNS propagation (typically 5–30 minutes; verify with `dig limcheekin.com +short`)

---

## Step 4: Add the Repository to Coolify

1. Log in to your Coolify dashboard (usually `http://your-vps-ip:8000`)
2. Go to **Sources** → **Add** → **GitHub** (or your provider)
3. Follow the OAuth flow to connect your GitHub account
4. Coolify will have access to your repositories

---

## Step 5: Create a New Application

1. Go to **Projects** → select or create a project (e.g., "Portfolio")
2. Click **+ New Resource** → **Application**
3. Select your connected Git source
4. Choose the **`portfolio`** repository
5. Select branch: **`main`**

---

## Step 6: Configure Build Settings

In the application settings:

| Field | Value |
|-------|-------|
| Build Pack | **Dockerfile** |
| Dockerfile Location | `./Dockerfile` |
| Docker Context | `.` (repo root) |
| Port | `80` |
| Base Directory | *(leave empty)* |

Coolify will detect the `Dockerfile` at the repo root and use the multi-stage build:
- **Stage 1 (build):** `node:20-alpine` — runs `npm ci` then `npm run build` (Astro build + generate-api.ts)
- **Stage 2 (serve):** `nginx:alpine` — copies `dist/` and the custom `nginx.conf`

---

## Step 7: Configure the Domain

1. In your application, go to the **Domains** tab
2. Click **Add Domain**
3. Enter your domain: `limcheekin.com`
4. Enable **HTTPS** (Coolify auto-provisions SSL via Let's Encrypt)
5. Optionally add `www.limcheekin.com` as an alias and enable redirect to root

Coolify handles SSL renewal automatically.

---

## Step 8: Set Environment Variables (Optional)

The portfolio has no required environment variables for production. The build is entirely static.

If you ever add server-side features or want to inject variables at build time, add them in the **Environment Variables** tab. Variables prefixed with `PUBLIC_` are safe to expose to the browser in Astro.

---

## Step 9: Deploy

1. Click **Deploy** (or **Save and Deploy**)
2. Coolify will:
   - Clone the repository
   - Build the Docker image using the multi-stage `Dockerfile`
   - Run `npm run build` inside the container (Astro build + API generation)
   - Start the Nginx container
   - Wire up the reverse proxy with SSL

3. Monitor progress in the **Deployments** tab — the build log shows Astro page generation output

A successful deploy log ends with something like:
```
 18 pages built in 3.2s
Generated: dist/api/portfolio.json
Generated: dist/llms-full.txt
```

---

## Step 10: Verify the Deployment

Run these checks after the first deploy:

```bash
# Pages load with pre-rendered HTML
curl -s https://limcheekin.com/ | grep -o '<h1[^>]*>.*</h1>'
curl -s https://limcheekin.com/about/ | grep -q 'Work Experience' && echo "✓ /about/"
curl -s https://limcheekin.com/projects/ | grep -q 'All Projects' && echo "✓ /projects/"
curl -s https://limcheekin.com/contact/ | grep -q 'contact-form' && echo "✓ /contact/"

# API endpoint
curl -s https://limcheekin.com/api/portfolio.json | head -5

# Static assets
curl -o /dev/null -s -w "%{http_code}" https://limcheekin.com/images/profile.png

# LLM discovery files
curl -s https://limcheekin.com/llms.txt | head -3
curl -s https://limcheekin.com/llms-full.txt | head -3

# Sitemap
curl -s https://limcheekin.com/sitemap-index.xml

# 404 page
curl -o /dev/null -s -w "%{http_code}" https://limcheekin.com/does-not-exist/
# Expected: 404 (not 200)

# Resume
curl -o /dev/null -s -w "%{http_code}" https://limcheekin.com/resume.pdf
# Expected: 200
```

---

## Auto-Deploy on Push

Coolify supports webhooks for automatic redeployment when you push to `main`.

1. In your application, go to **Settings** → **Webhooks**
2. Copy the webhook URL
3. In GitHub, go to your repo → **Settings** → **Webhooks** → **Add webhook**
4. Paste the URL, set content type to `application/json`, select **Just the push event**
5. Save

Now every `git push origin main` triggers a rebuild and redeploy automatically. The GitHub Actions CI workflow (`.github/workflows/ci.yaml`) still runs in parallel as a build validation check — if CI fails, you'll know before the Coolify deploy finishes.

---

## Updating Content

The site content lives in:

| Content type | Location |
|---|---|
| Projects | `src/content/projects/*.md` |
| Articles | `src/content/articles/*.md` |
| Work experience | `src/content/experience/*.json` |
| Site metadata, nav, hero | `src/data/site.ts` |
| Value propositions (banner) | `src/data/value-props.ts` |

Workflow for content updates:
```bash
# Edit a content file, e.g. add a new project
# Create src/content/projects/new-project.md

git add src/content/projects/new-project.md
git commit -m "content: add new-project to portfolio"
git push
# Coolify auto-deploys (if webhook is configured)
```

The build regenerates `portfolio.json`, `llms-full.txt`, and `sitemap-index.xml` from the updated content automatically.

---

## Rolling Back a Deploy

If a bad deploy breaks the site:

1. Go to **Deployments** tab in Coolify
2. Find the last known-good deploy in the history
3. Click **Redeploy** on that entry

Coolify keeps previous image layers cached, so rollbacks are fast (seconds, not minutes).

---

## Updating Infrastructure

If you need to change the `Dockerfile` or `nginx.conf`:

- `Dockerfile` changes take effect on the next deploy automatically
- `nginx.conf` changes also take effect on the next deploy (it's copied into the image at build time)

To change Nginx config without a full rebuild, you can exec into the running container from Coolify's terminal, but the change won't survive a redeploy. Always commit changes to the repo.

---

## Resource Usage

Typical resource footprint once running:

| Resource | Idle | Under load |
|----------|------|------------|
| CPU | < 1% | 2–5% |
| RAM | ~10 MB | ~30 MB |
| Disk (image) | ~25 MB | — |
| Build time | — | ~30–60s |

The Nginx container is extremely lightweight since the entire site is static HTML/CSS/JS.

---

## Troubleshooting

### Build fails: "Cannot find module"

The Docker build runs `npm ci` which installs exact versions from `package-lock.json`. If you see module resolution errors:
1. Ensure `package-lock.json` is committed (not in `.gitignore`)
2. Run `npm install` locally to regenerate it, then commit

### 404 on all pages after deploy

The Nginx config enforces trailing slashes. Check:
```bash
curl -I https://limcheekin.com/about
# Should see: 301 Location: /about/
```
If you see a 404 instead, the `nginx.conf` may not have been copied into the image. Check the Coolify build log for the `COPY nginx.conf` step.

### Images return 404

Verify the `public/images/` directory is committed to the repository. Run locally:
```bash
ls public/images/
```
The `Dockerfile` does `COPY . .` before `npm run build`, so everything in `public/` gets included in the Astro build output at `dist/`.

### Contact form not sending

1. Verify the Formspree endpoint in `src/components/ContactForm.astro` is your real form ID (not `YOUR_FORM_ID`)
2. Check Formspree's dashboard for blocked submissions (spam filter or unverified email)
3. Formspree requires the form to be submitted once from the production URL to activate it — do a test submission after first deploy

### SSL certificate not provisioning

Coolify uses Let's Encrypt. Common causes:
- DNS hasn't propagated yet — wait and retry
- Port 80 is blocked by a firewall (Let's Encrypt HTTP-01 challenge needs port 80)
- Rate limit hit (5 certs per domain per week) — wait or use Let's Encrypt staging

### `generate-api.ts` fails during build

The script runs as `tsx scripts/generate-api.ts` after `astro build`. If it fails:
1. Check that `dist/` was created by `astro build` (should be, if Astro succeeded)
2. Check that `src/content/` has the expected files — the script reads frontmatter from there
3. Run locally to see the error: `npm run build`
