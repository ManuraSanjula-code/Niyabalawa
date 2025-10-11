# Niyabalawa Restaurant POS - Integration Complete! 🎉

## ✅ What's Been Completed

### Backend Setup
1. **Database Initialized**
   - PostgreSQL database created on Neon (serverless)
   - Tables created: `menu_items`, `orders`, `order_items`, `token_log`
   - 28 menu items seeded successfully

2. **Backend Server Running**
   - Express + TypeScript server on port 3001
   - Socket.IO for real-time communication
   - REST API endpoints for orders, menu, tokens
   - Database fallback for token generation (Redis not required for basic functionality)

3. **API Endpoints Available**
   - `POST /api/orders` - Create new order with token
   - `GET /api/orders/pending` - Get all pending orders
   - `GET /api/orders/:token` - Get order by token
   - `PUT /api/orders/:token` - Update order
   - `POST /api/orders/:token/complete` - Complete/pay order
   - `DELETE /api/orders/:token` - Cancel order
   - `GET /api/menu` - Get all menu items
   - `GET /api/tokens/current` - Get current token count

### Frontend Integration
1. **Services Created**
   - `src/services/api.ts` - Axios API client with all order/token functions
   - `src/services/socket.ts` - Socket.IO client for real-time updates

2. **Backend Connection**
   - Socket.IO connected on app mount
   - Real-time event listeners set up
   - API calls integrated into `useBilling` hook

3. **Updated Functionality**
   - `savePendingOrder()` now calls backend API and gets sequential token (T0001, T0002, etc.)
   - `completePendingOrder()` marks order as paid in database
   - `updatePendingOrder()` updates order in database
   - `loadPendingOrders()` fetches from backend on app load
   - LocalStorage used as fallback if backend fails

## 🚀 How to Use

### Start the Application

#### Terminal 1 - Backend
```bash
cd c:\Users\Pramuditha.weerakoon\Documents\Project\Niyabalawa\backend
npm run dev
```
Backend will run on: http://localhost:3001

#### Terminal 2 - Frontend
```bash
cd c:\Users\Pramuditha.weerakoon\Documents\Project\Niyabalawa
npm run dev
```
Frontend will run on: http://localhost:5173

### Test Token Generation

1. Open http://localhost:5173 in **multiple browser tabs/windows**
2. Add items to cart in first tab
3. Click "Print Token" for dine-in orders
4. You'll get sequential tokens: **T0001, T0002, T0003**, etc.
5. These tokens are synchronized across all frontend instances via the backend

### Check Backend is Working

Visit: http://localhost:3001/api/health
Should show: `{"status":"ok","timestamp":"...","environment":"development"}`

## 📁 File Structure

```
Niyabalawa/
├── src/
│   ├── services/
│   │   ├── api.ts          ✅ NEW - API client for backend
│   │   └── socket.ts       ✅ NEW - Socket.IO client
│   ├── hooks/
│   │   └── useBilling.ts   ✅ UPDATED - Now uses backend API
│   ├── App.tsx             ✅ UPDATED - Socket initialization
│   └── ...
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── database/
│   │   │   ├── postgres.ts  ✅ SSL connection enabled
│   │   │   ├── redis.ts     ✅ Optional fallback
│   │   │   ├── setup.ts     ✅ Tables created
│   │   │   └── seed.ts      ✅ Data seeded
│   │   ├── services/
│   │   ├── routes/
│   │   └── types/
│   ├── .env                 ✅ Database configured
│   └── package.json
└── .env                     ✅ API URL configured
```

## 🎯 Features Working

### For Customers (Dine-In)
1. ✅ Add items to cart
2. ✅ Select rice type for set menu
3. ✅ Click "Print Token"
4. ✅ Get unique token number (T0001, T0002, etc.)
5. ✅ Order saved as "pending" in database
6. ✅ Customer can pay later using token

### For Staff (Take-Away / Payment)
1. ✅ Add items to cart
2. ✅ Click "Pay Now" for immediate payment
3. ✅ Order saved and marked as "paid" in database
4. ✅ View pending orders
5. ✅ Search orders by token
6. ✅ Edit and update pending orders
7. ✅ Complete payment for pending orders

### Real-Time Sync
- ✅ All frontends connected via Socket.IO
- ✅ Token numbers generated sequentially using database
- ✅ Pending orders synchronized across all instances
- ✅ Updates broadcast to all connected clients

## ⚠️  Optional: Redis Setup (For Production)

For better performance and guaranteed atomic token generation, you can add Redis:

### Option 1: Upstash (Cloud - Free Tier)
1. Sign up at https://upstash.com
2. Create Redis database
3. Get connection URL
4. Update `backend/.env`:
```env
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST:PORT
```

### Option 2: Local Redis
```bash
# Install Redis (Windows - WSL)
wsl --install
wsl
sudo apt-get install redis-server
redis-server
```

## 🔧 Environment Variables

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3001/api
```

### Backend `.env`
```env
DATABASE_URL=postgresql://neondb_owner:npg_zP6tirRwJ2nF@ep-rough-smoke-a1zq5g0b-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
REDIS_URL=redis://localhost:6379  # Optional
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 🐛 Known Issues & Solutions

### Issue: Redis Connection Errors
**Status**: ⚠️  Expected (Redis not installed)
**Impact**: None - using database fallback
**Solution**: Backend works fine without Redis. Install only if you need higher performance.

### Issue: CORS Errors
**Status**: ✅ Resolved
**Solution**: CORS configured to allow frontend on port 5173

### Issue: SSL Certificate Error (PostgreSQL)
**Status**: ✅ Resolved
**Solution**: Updated postgres.ts with `ssl: { rejectUnauthorized: false }`

## 📊 Database Schema

### orders table
- `id` - UUID primary key
- `token` - Unique token (T0001, T0002, etc.)
- `order_type` - 'dine-in' or 'take-away'
- `total` - Total amount
- `status` - 'pending' or 'paid'
- `created_at` - Timestamp
- `updated_at` - Timestamp (auto-updated)

### order_items table
- `id` - UUID primary key
- `order_id` - Foreign key to orders
- `item_name` - Name of dish
- `price` - Item price
- `quantity` - Quantity ordered
- `portion` - 'half' or 'full'
- `rice_type` - Selected rice type (for set menu)
- `rice_price` - Additional rice cost

### token_log table
- `id` - Auto-increment primary key
- `token_number` - Token (T0001, etc.)
- `frontend_id` - Which frontend generated it
- `date` - Date generated
- `generated_at` - Timestamp

## 🎉 Success!

Your Niyabalawa Restaurant POS system is now fully connected:
- ✅ Backend running with PostgreSQL
- ✅ Frontend connected to backend
- ✅ Token generation working
- ✅ Orders saved to database
- ✅ Real-time synchronization enabled
- ✅ Pending orders management working

**Next Steps (Optional):**
1. Add Redis for production (Upstash recommended)
2. Deploy to cloud (Railway, Render, or Vercel)
3. Add user authentication
4. Add order history and analytics
5. Add print functionality for tokens
6. Add kitchen display system

## 📞 Need Help?

Check logs:
- Frontend: Browser console (F12)
- Backend: Terminal output

Test endpoints:
```bash
# Health check
curl http://localhost:3001/api/health

# Get menu
curl http://localhost:3001/api/menu

# Get pending orders
curl http://localhost:3001/api/orders/pending
```

---
**Built with:** React, TypeScript, Node.js, Express, PostgreSQL (Neon), Socket.IO, Axios, Tailwind CSS
