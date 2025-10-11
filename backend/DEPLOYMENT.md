# Deployment Guide - Niyabalawa Restaurant POS Backend

## 🚀 Quick Start with Docker

The easiest way to run the backend with all dependencies:

```powershell
# Start all services (PostgreSQL, Redis, Backend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## 📦 Cloud Deployment Options

### Option 1: Railway.app (Recommended - Easiest)

**Pros:** One-click PostgreSQL & Redis, automatic scaling, simple deployment
**Cost:** ~$20-40/month
**Setup Time:** 15 minutes

```powershell
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
cd backend
railway init

# 4. Add PostgreSQL
railway add

# Select "PostgreSQL" from the list

# 5. Add Redis
railway add

# Select "Redis" from the list

# 6. Link services
railway link

# 7. Deploy
railway up

# 8. Get database URLs
railway variables

# 9. Set environment variables
railway variables set FRONTEND_URL=https://your-frontend-url.com

# 10. Run database setup
railway run npm run db:setup
railway run npm run db:seed
```

Your backend is now live! Railway will give you a URL like:
`https://niyabalawa-backend-production.up.railway.app`

---

### Option 2: Render.com (Easy)

**Pros:** Free tier available, simple setup, automatic deployments
**Cost:** Free tier / $7+/month
**Setup Time:** 20 minutes

**Steps:**

1. **Push code to GitHub**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/niyabalawa.git
   git push -u origin main
   ```

2. **Create account on Render.com**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create PostgreSQL database**
   - Click "New +" → "PostgreSQL"
   - Name: niyabalawa-db
   - Plan: Free / Starter
   - Copy the "Internal Database URL"

4. **Create Redis instance**
   - Click "New +" → "Redis"
   - Name: niyabalawa-redis
   - Plan: Free
   - Copy the "Connection string"

5. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build && npm run db:setup && npm run db:seed`
   - Start Command: `npm start`
   
6. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=[paste PostgreSQL URL]
   REDIS_URL=[paste Redis URL]
   FRONTEND_URL=[your frontend URL]
   ```

7. **Deploy!**

---

### Option 3: AWS (Advanced)

**Pros:** Full control, highly scalable, enterprise-ready
**Cost:** ~$50-100/month
**Setup Time:** 1-2 hours

**Architecture:**
- **EC2** or **ECS Fargate**: Backend server
- **RDS PostgreSQL**: Database
- **ElastiCache Redis**: Token counter
- **Application Load Balancer**: Traffic distribution
- **CloudWatch**: Monitoring

**Quick Setup with Elastic Beanstalk:**

```powershell
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
cd backend
eb init

# 3. Create environment
eb create niyabalawa-backend

# 4. Set environment variables
eb setenv NODE_ENV=production DATABASE_URL=... REDIS_URL=...

# 5. Deploy
eb deploy
```

---

### Option 4: Heroku (Simple)

**Pros:** Easy deployment, managed services
**Cost:** ~$16+/month (no free tier)
**Setup Time:** 20 minutes

```powershell
# 1. Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# 2. Login
heroku login

# 3. Create app
cd backend
heroku create niyabalawa-backend

# 4. Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# 5. Add Redis
heroku addons:create heroku-redis:mini

# 6. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://your-frontend.com

# 7. Deploy
git push heroku main

# 8. Run database setup
heroku run npm run db:setup
heroku run npm run db:seed

# 9. View logs
heroku logs --tail
```

---

### Option 5: DigitalOcean (Balanced)

**Pros:** Good price/performance, simple interface
**Cost:** ~$12+/month
**Setup Time:** 30 minutes

1. **Create Droplet**
   - Size: Basic ($12/month)
   - Image: Ubuntu 22.04
   - Add SSH key

2. **Create Managed PostgreSQL**
   - Plan: Basic ($15/month)
   - Note connection string

3. **Create Managed Redis**
   - Plan: Basic ($15/month)
   - Note connection string

4. **Deploy App**
   ```bash
   # SSH into droplet
   ssh root@your-droplet-ip

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   npm install -g pm2

   # Clone repository
   git clone https://github.com/yourusername/niyabalawa.git
   cd niyabalawa/backend

   # Install dependencies
   npm install

   # Set environment variables
   nano .env
   # Paste your config

   # Build
   npm run build

   # Setup database
   npm run db:setup
   npm run db:seed

   # Start with PM2
   pm2 start dist/server.js --name niyabalawa-backend
   pm2 save
   pm2 startup
   ```

---

## 🌐 Frontend Connection

Update your frontend to connect to the backend:

```typescript
// src/config.ts
export const API_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';
export const SOCKET_URL = process.env.VITE_SOCKET_URL || 'http://localhost:3001';

// For production:
// API_URL = 'https://your-backend.railway.app/api'
// SOCKET_URL = 'https://your-backend.railway.app'
```

---

## 🔒 Production Checklist

- [ ] Set strong database passwords
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set up proper CORS origins
- [ ] Configure environment variables
- [ ] Set up database backups
- [ ] Enable logging and monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure rate limiting
- [ ] Set up health checks
- [ ] Document API endpoints

---

## 📊 Monitoring

### Railway
- Built-in metrics dashboard
- View logs in real-time
- Set up alerts

### Render
- Metrics tab shows CPU, memory
- Log stream available
- Uptime monitoring

### Custom Monitoring
```powershell
# Add monitoring service
npm install @sentry/node

# Configure in server.ts
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: "YOUR_DSN" });
```

---

## 🆘 Troubleshooting

### Database Connection Issues
```powershell
# Test PostgreSQL connection
psql "postgresql://user:pass@host:port/db"

# Check connection from server
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()', (err, res) => { console.log(err ? err : res.rows[0]); pool.end(); });"
```

### Redis Connection Issues
```powershell
# Test Redis connection
redis-cli -h your-redis-host -p 6379 ping

# Check from Node
node -e "const redis = require('redis'); const client = redis.createClient({ url: process.env.REDIS_URL }); client.on('error', err => console.log(err)); client.connect().then(() => { console.log('Connected'); client.quit(); });"
```

### Port Issues
```powershell
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill process (Windows)
taskkill /PID <PID> /F
```

---

## 💰 Cost Comparison

| Provider | PostgreSQL | Redis | Server | Total/Month |
|----------|-----------|-------|--------|-------------|
| Railway | Included | Included | ~$20 | ~$20-40 |
| Render | $7 | Free | Free-$7 | $7-14 |
| Heroku | $9 | $15 | $7 | $31 |
| AWS | $15 | $50 | $10+ | $75+ |
| DigitalOcean | $15 | $15 | $12 | $42 |

**Recommendation:** Start with Railway or Render for ease of use.

---

## 📝 Next Steps

1. Choose deployment platform
2. Deploy backend
3. Run database setup
4. Update frontend API URL
5. Deploy frontend (Vercel/Netlify)
6. Test end-to-end
7. Set up monitoring
8. Go live! 🎉
