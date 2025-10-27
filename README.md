# Niyabalawa POS System

A complete Point of Sale (POS) system built with Electron, React, and Express. Both frontend and backend run in a single integrated Electron application.

## 🚀 Quick Start

### First Time Setup

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

### Run the Application

**Development Mode:**
```bash
npm run electron:dev
```

This single command starts:
- ✅ Backend server (Express + Socket.IO)
- ✅ Frontend (React + Vite)
- ✅ Electron window

### Build for Production

```bash
npm run build
```

Creates a standalone installer in the `release/` folder.

## 📖 Documentation

- **[PRODUCTION_BUILD.md](./PRODUCTION_BUILD.md)** - Production build guide & troubleshooting
- **[backend/README.md](./backend/README.md)** - Backend API documentation
- **[INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md)** - Integration status
- **[LAYOUT_DESIGN.md](./LAYOUT_DESIGN.md)** - UI/UX design documentation

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│       Electron Application          │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Frontend   │  │   Backend   │ │
│  │   (React)    │──│  (Express)  │ │
│  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────┘
```

## ✨ Features

- 🖥️ **Desktop Application** - Runs as standalone Electron app
- 🔄 **Real-time Updates** - WebSocket integration for live order updates
- 🖨️ **Printer Support** - Direct printer access for receipts and kitchen orders
- 📊 **Order Management** - Complete order tracking and history
- 🍽️ **Menu Management** - Easy product and category management
- 💰 **Token System** - Queue management with token generation
- 📈 **Admin Panel** - Sales analytics and system settings

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons
- Socket.IO Client

### Backend
- Node.js
- Express
- TypeScript
- Socket.IO
- PostgreSQL
- Redis (optional)

### Desktop
- Electron
- IPC for printer communication

## 📁 Project Structure

```
Niyabalawa/
├── electron/              # Electron main process
│   ├── main.ts           # Main process (starts backend + window)
│   └── preload.js        # Preload script for IPC
├── backend/              # Express backend
│   ├── src/
│   │   ├── server.ts     # Main server file
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── database/     # Database setup
│   └── dist/             # Compiled backend
├── src/                  # React frontend
│   ├── components/       # React components
│   ├── services/         # API client
│   └── hooks/            # Custom hooks
└── dist/                 # Built frontend
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run electron:dev       # Start integrated Electron app
npm run dev               # Start only frontend
npm run dev:backend       # Start only backend

# Building
npm run build             # Build complete app
npm run build:backend     # Build only backend
npm run build:electron    # Build Electron app

# Database
cd backend
npm run db:setup          # Setup database
npm run db:seed           # Seed sample data
```

## ⚙️ Configuration

### Backend Environment (.env)

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/niyabalawa
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 🐛 Troubleshooting

### Backend not starting
```bash
cd backend
npm install
```

### Port conflicts
- Backend: 3001
- Frontend dev: 5173

### Database issues
- Ensure PostgreSQL is running
- Check `.env` configuration
- Run `npm run db:setup` in backend folder

## 📦 Building for Production

The production build includes:
- Complete Electron runtime
- Compiled frontend assets
- Compiled backend server
- All dependencies

**Note:** External services still required:
- PostgreSQL database
- Redis cache (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For detailed integration documentation, see [ELECTRON_INTEGRATION.md](./ELECTRON_INTEGRATION.md)

---

**Made with ❤️ for Restaurant Management**
