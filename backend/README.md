# Niyabalawa Restaurant POS - Backend

Backend API server for the Niyabalawa Restaurant Point of Sale system with real-time token generation and order management.

## 🏗️ Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (main database)
- **Cache/Counter**: Redis (token sequencing)
- **Real-time**: Socket.IO (WebSocket)

## 📋 Features

- ✅ **Sequential Token Generation** - Atomic counters using Redis
- ✅ **Real-time Sync** - WebSocket communication across all frontends
- ✅ **Order Management** - Create, update, complete orders
- ✅ **Pending Orders** - Track dine-in orders awaiting payment
- ✅ **Menu API** - Serve menu items from database
- ✅ **Audit Trail** - Token generation logging

## 🚀 Setup Instructions

### Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)
3. **Redis** (v7 or higher)

### Installation

```powershell
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Edit .env file with your database credentials
notepad .env
```

### Database Setup

#### Option 1: Local PostgreSQL

```powershell
# Install PostgreSQL (Windows)
# Download from: https://www.postgresql.org/download/windows/

# Create database
psql -U postgres
CREATE DATABASE niyabalawa;
\q
```

#### Option 2: Cloud PostgreSQL (Recommended)

```powershell
# Use Railway, Supabase, or any cloud provider
# Copy connection string to .env
```

### Redis Setup

#### Option 1: Local Redis (Windows)

```powershell
# Install Redis using WSL or download Redis for Windows
# Download from: https://github.com/microsoftarchive/redis/releases

# Start Redis
redis-server
```

#### Option 2: Cloud Redis (Recommended)

```powershell
# Use Upstash, Railway, or Redis Cloud
# Copy connection URL to .env
```

### Environment Configuration

Edit `.env` file:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# PostgreSQL Database
DATABASE_URL=postgresql://user:password@localhost:5432/niyabalawa
DB_HOST=localhost
DB_PORT=5432
DB_NAME=niyabalawa
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
FRONTEND_URL=http://localhost:5173

# Token Configuration
TOKEN_PREFIX=T
TOKEN_PADDING=4
```

### Initialize Database

```powershell
# Create database tables
npm run db:setup

# Seed menu items
npm run db:seed
```

### Start Server

```powershell
# Development mode (with auto-reload)
npm run dev

# Production build
npm run build
npm start
```

Server will start on `http://localhost:3001`

## 📡 API Endpoints

### Orders

```
POST   /api/orders                    Create new order
GET    /api/orders/pending            Get all pending orders
GET    /api/orders/:tokenNumber       Get order by token
PUT    /api/orders/:tokenNumber       Update order
POST   /api/orders/:tokenNumber/complete    Complete order
DELETE /api/orders/:tokenNumber       Cancel order
GET    /api/orders/date/:date         Get orders by date
```

### Menu

```
GET    /api/menu                      Get all menu items
GET    /api/menu/:category            Get items by category (main|rice|addon)
```

### Tokens

```
GET    /api/tokens/current            Get current token count
GET    /api/tokens/history            Get token generation history
POST   /api/tokens/reset              Reset token counter
```

### Health

```
GET    /api/health                    Server health check
```

## 🔌 Socket.IO Events

### Client -> Server

```javascript
// Identify frontend
socket.emit('identify', 'frontend-1');

// Request pending orders
socket.emit('request_pending_orders');
```

### Server -> Client

```javascript
// New order created
socket.on('order_created', (order) => { });

// Order updated
socket.on('order_updated', (order) => { });

// Order completed
socket.on('order_completed', (order) => { });

// Order cancelled
socket.on('order_cancelled', (order) => { });

// Pending orders changed
socket.on('pending_orders_updated', () => { });
```

## 📊 Database Schema

### tables

- **menu_items** - Restaurant menu items
- **orders** - Order records
- **order_items** - Individual items in orders (normalized)
- **token_log** - Token generation audit trail

### Indexes

- Orders by status, token, created_at
- Order items by order_id
- Token log by date

## 🔄 Token Generation Flow

```
Frontend 1, 2, 3... → API → Redis INCR (atomic) → T0001, T0002, T0003...
                        ↓
                   PostgreSQL
                   (audit log)
                        ↓
                   Socket.IO
                   (broadcast)
```

## 🚀 Deployment

### Option 1: Railway.app (Recommended)

```powershell
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis

# Deploy
railway up
```

### Option 2: Render.com

1. Push code to GitHub
2. Connect repository on Render
3. Add PostgreSQL and Redis addons
4. Deploy

### Option 3: Docker

```powershell
# Build image
docker build -t niyabalawa-backend .

# Run with docker-compose
docker-compose up
```

## 🧪 Testing

```powershell
# Test health endpoint
curl http://localhost:3001/api/health

# Test menu endpoint
curl http://localhost:3001/api/menu

# Test create order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderType": "dine-in",
    "items": [...],
    "total": 1200,
    "frontendId": "counter-1"
  }'
```

## 📝 Scripts

```powershell
npm run dev          # Start development server
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run db:setup     # Create database tables
npm run db:seed      # Seed initial data
```

## 🔐 Security Notes

- Set strong database passwords
- Use environment variables for secrets
- Enable CORS only for trusted origins
- Use HTTPS in production
- Implement authentication for admin endpoints

## 📞 Support

For issues or questions, contact the development team.

## 📄 License

MIT
