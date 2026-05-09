# Deployment Guide

## Option 1: Deploy to Render (Recommended for Simplicity)

### Backend Deployment (Render)

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/soc-alerts.git
   git push -u origin main
   ```

2. **Create Render account** and connect GitHub

3. **Create New Web Service** for backend:
   - Source: GitHub repository
   - Build Command: `cd backend && npm install && npm run seed`
   - Start Command: `cd backend && npm start`
   - Environment Variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your-secret-key-here-make-it-strong
     FRONTEND_URL=https://your-frontend-url.vercel.app
     ```

4. **Deploy backend** - copy the URL (e.g., https://soc-alerts-backend.render.com)

### Frontend Deployment (Vercel)

1. **Create Vercel account** and import GitHub repository

2. **Configure Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.render.com
   ```

3. **Deploy** - Vercel automatically builds and deploys on push

### Update Frontend After Backend URL Known

Once backend is deployed, update frontend `.env`:
```
VITE_API_URL=https://your-backend-url.render.com
```

Then redeploy frontend on Vercel.

---

## Option 2: Deploy to Railway

### Backend

1. **Create Railway account** and connect GitHub

2. **Create new project** from repository

3. **Add PostgreSQL plugin** (optional, or use SQLite as-is)

4. **Set environment variables** in Railway dashboard

5. **Deploy** - Railway auto-deploys on push

### Frontend

Use Vercel (same as above).

---

## Option 3: Deploy to Fly.io

### Backend

```bash
# Install Fly CLI
brew install flyctl

# Login and initialize
flyctl auth login
flyctl launch

# Set secrets
flyctl secrets set JWT_SECRET=your-secret-key
flyctl secrets set FRONTEND_URL=https://your-frontend-url.fly.dev

# Deploy
flyctl deploy
```

### Frontend

Use Vercel.

---

## Testing Deployed Application

1. Visit frontend URL
2. Login with: `analyst@company.com` / `Alert123!`
3. Verify dashboard loads with stats
4. Test filtering and alert detail views
5. Try updating an alert status

---

## Monitoring

- **Backend logs**: Check Render/Railway/Fly dashboard
- **Frontend errors**: Check browser DevTools console
- **API errors**: Check Network tab in DevTools

---

## Troubleshooting Deployments

### CORS Errors
- Ensure `FRONTEND_URL` matches your actual frontend domain
- Backend CORS middleware should allow your frontend origin

### Database Errors
- Check that `npm run seed` runs successfully during build
- Verify SQLite database file is created in backend directory

### 404 on Routes
- Ensure Vite/frontend build output includes `index.html`
- Configure web server to redirect unknown routes to `index.html`

### Blank Page
- Check browser console for JavaScript errors
- Verify `VITE_API_URL` in frontend environment matches backend
- Check Network tab to see if API calls are reaching backend

---

## Scaling Beyond MVP

For production scale:

1. **Replace SQLite** with PostgreSQL/MySQL
2. **Add Redis** for caching and sessions
3. **Implement API Gateway** with rate limiting
4. **Add message queue** (RabbitMQ/Kafka) for real-time updates
5. **Use CDN** for frontend assets
6. **Implement auth service** (Keycloak/Auth0)
7. **Add monitoring** (Datadog/New Relic)
8. **Implement CI/CD** (GitHub Actions)

---

## Cost Estimates (Monthly)

- **Render (Backend)**: $7-12 (starter tier)
- **Vercel (Frontend)**: Free tier sufficient
- **Database**: Free (SQLite included in backend)
- **Total**: ~$7-12/month

(Costs increase with scale; these are starter tier estimates)
