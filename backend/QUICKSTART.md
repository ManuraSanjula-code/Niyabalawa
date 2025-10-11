# 🚀 Quick Start Guide - Niyabalawa Backend

## ✅ Your Database is Ready!

You're using **Neon PostgreSQL** - a serverless PostgreSQL database. Your database is already configured!

**Database:** Neon PostgreSQL (Singapore region)
**Status:** ✅ Connected

---

## 📋 Setup Steps

### Step 1: Install Dependencies

```powershell
# Navigate to backend folder
cd backend

# Install all packages
npm install
```

This will install:
- Express (API server)
- Socket.IO (Real-time communication)
- PostgreSQL client
- Redis client
- TypeScript and all dependencies

### Step 2: Set Up Redis

You have 2 options:

#### Option A: Upstash Redis (Recommended - Free Cloud Redis)

1. Go to [https://upstash.com/](https://upstash.com/)
2. Sign up with GitHub or email
3. Create a new Redis database
4. Copy the connection URL (looks like: `rediss://...`)
5. Update `.env` file:
   ```
   REDIS_URL=your_upstash_redis_url
   ```

#### Option B: Local Redis (Development Only)

**For Windows:**

```powershell
# Option 1: Using WSL (Windows Subsystem for Linux)
wsl --install
wsl
sudo apt-get update
sudo apt-get install redis-server
redis-server

# Option 2: Download Redis for Windows
# Visit: https://github.com/microsoftarchive/redis/releases
# Download Redis-x64-3.0.504.msi
# Install and run Redis service
```

**For Mac:**
```bash
brew install redis
redis-server
```

### Step 3: Initialize Database

```powershell
# Create database tables
npm run db:setup

# Seed menu items (Chicken, Fish, Pork, Rice, etc.)
npm run db:seed
```

This will:
- ✅ Create all necessary tables (orders, menu_items, token_log)
- ✅ Set up indexes for performance
- ✅ Insert all menu items from your restaurant

### Step 4: Start the Server

```powershell
# Development mode (auto-reload on changes)
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🍽️  NIYABALAWA RESTAURANT POS - BACKEND SERVER     ║
║                                                       ║
║   Status: Running                                     ║
║   Port: 3001                                          ║
║   Environment: development                            ║
║                                                       ║
║   API: http://localhost:3001/api                      ║
║   Health: http://localhost:3001/api/health            ║
║                                                       ║
║   WebSocket: Enabled (Socket.IO)                      ║
║   Database: PostgreSQL + Redis                        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### Step 5: Test the Backend

Open your browser or use curl:

```powershell
# Test health endpoint
curl http://localhost:3001/api/health

# Test menu endpoint
curl http://localhost:3001/api/menu

# Test pending orders
curl http://localhost:3001/api/orders/pending
```

---

## 🧪 Testing the API

### Create a Test Order

```powershell
# Using PowerShell
Invoke-RestMethod -Uri "http://localhost:3001/api/orders" -Method POST -ContentType "application/json" -Body '{
  "orderType": "dine-in",
  "items": [
    {
      "id": "1-half-WhiteRice",
      "name": "Chicken",
      "price": 580,
      "quantity": 1,
      "portion": "half",
      "category": "main",
      "riceType": "White Rice",
      "ricePrice": 0
    }
  ],
  "total": 580,
  "frontendId": "counter-1"
}'
```

You should get a response like:
```json
{
  "id": "uuid-here",
  "tokenNumber": "T0001",
  "orderType": "dine-in",
  "status": "pending",
  "total": 580,
  "items": [...],
  "createdAt": "2025-10-11T..."
}
```

---

## 🔌 Connect Frontend to Backend

Now update your frontend to use the backend:

1. **Create API configuration file:**

```typescript
// src/config/api.ts
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
```

2. **Install Socket.IO client in frontend:**

```powershell
cd ..  # Go back to root
npm install socket.io-client
```

3. **Create API service:**

```typescript
// src/services/api.ts
import { API_URL } from '../config/api';

export const api = {
  async createOrder(orderData: any) {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return response.json();
  },

  async getPendingOrders() {
    const response = await fetch(`${API_URL}/orders/pending`);
    return response.json();
  },

  async updateOrder(tokenNumber: string, orderData: any) {
    const response = await fetch(`${API_URL}/orders/${tokenNumber}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return response.json();
  },

  async completeOrder(tokenNumber: string) {
    const response = await fetch(`${API_URL}/orders/${tokenNumber}/complete`, {
      method: 'POST',
    });
    return response.json();
  },
};
```

4. **Add Socket.IO connection:**

```typescript
// src/services/socket.ts
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
});

// Listen for real-time updates
socket.on('connect', () => {
  console.log('✅ Connected to backend');
  socket.emit('identify', 'counter-1'); // Identify this frontend
});

socket.on('order_created', (order) => {
  console.log('New order created:', order);
  // Update UI
});

socket.on('pending_orders_updated', () => {
  console.log('Pending orders updated');
  // Refresh pending orders list
});
```

---

## 📊 Database Management

### View Database (Neon Console)

1. Go to [https://console.neon.tech/](https://console.neon.tech/)
2. Login to your account
3. Select your database
4. Use SQL Editor to run queries

### Useful Queries

```sql
-- View all orders
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- View pending orders
SELECT token_number, order_type, total, created_at 
FROM orders 
WHERE status = 'pending';

-- View today's token count
SELECT COUNT(*) as today_orders 
FROM orders 
WHERE DATE(created_at) = CURRENT_DATE;

-- View menu items
SELECT * FROM menu_items ORDER BY category, name;

-- View token generation history
SELECT * FROM token_log 
WHERE date = CURRENT_DATE 
ORDER BY generated_at DESC;
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Redis"

**Solution:** Make sure Redis is running
```powershell
# Check if Redis is running (Windows)
netstat -ano | findstr :6379

# Start Redis (if using WSL)
wsl
redis-server
```

Or use Upstash Redis (cloud, no installation needed)

### Issue: "Database connection error"

**Solution:** Your Neon database URL is already configured. If you see this error:
1. Check internet connection
2. Verify the URL in `.env` is correct
3. Check Neon console for database status

### Issue: "Port 3001 already in use"

**Solution:**
```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID_NUMBER> /F

# Or change PORT in .env file
PORT=3002
```

### Issue: "Module not found"

**Solution:**
```powershell
# Delete node_modules and reinstall
rm -r node_modules
npm install
```

---

## 📦 Production Deployment

When you're ready to deploy to production:

### Option 1: Railway (Easiest)

```powershell
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init

# Add Redis
railway add

# Deploy
railway up

# Set environment variables
railway variables set DATABASE_URL=your_neon_url
railway variables set FRONTEND_URL=your_frontend_url
```

### Option 2: Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect GitHub repo
5. Add Redis addon
6. Set environment variables
7. Deploy!

---

## 🎯 Next Steps

1. ✅ Backend is running on `http://localhost:3001`
2. ✅ Database is set up (Neon PostgreSQL)
3. ⏳ Set up Redis (Upstash or local)
4. ⏳ Connect frontend to backend
5. ⏳ Test token generation across multiple tabs
6. ⏳ Deploy to production

---

## 📞 Need Help?

- **Database Issues:** Check Neon console
- **Redis Issues:** Use Upstash (free tier)
- **API Issues:** Check `npm run dev` logs
- **Port Issues:** Change PORT in `.env`

---

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Redis is running or Upstash configured
- [ ] Database tables created (`npm run db:setup`)
- [ ] Menu items seeded (`npm run db:seed`)
- [ ] Server starts successfully (`npm run dev`)
- [ ] Health endpoint works (`http://localhost:3001/api/health`)
- [ ] Can create test order
- [ ] Frontend connected to backend

---

Your backend is ready! 🎉

Start the server with `npm run dev` and begin testing!
