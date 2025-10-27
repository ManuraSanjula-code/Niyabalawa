import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectRedis } from './database/redis';
import ordersRouter from './routes/orders';
import menuRouter from './routes/menu';
import tokensRouter from './routes/tokens';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup for real-time communication
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/orders', ordersRouter);
app.use('/api/menu', menuRouter);
app.use('/api/tokens', tokensRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Send current pending orders count on connection
  socket.on('request_pending_orders', async () => {
    try {
      // This will be handled by the orderService
      socket.emit('pending_orders_requested');
    } catch (error) {
      console.error('Error handling pending orders request:', error);
    }
  });

  // Handle frontend identification
  socket.on('identify', (frontendId: string) => {
    socket.data.frontendId = frontendId;
    console.log(`Frontend identified: ${frontendId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Try to connect to Redis (optional - will fallback to database)
    try {
      await connectRedis();
      console.log('✅ Redis connected');
    } catch (redisError) {
      console.warn('⚠️  Redis not available - Using database fallback for token counter');
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🍽️  NIYABALAWA RESTAURANT POS - BACKEND SERVER     ║
║                                                       ║
║   Status: Running                                     ║
║   Port: ${PORT}                                    ║
║   Environment: ${process.env.NODE_ENV || 'development'}                         ║
║                                                       ║
║   API: http://localhost:${PORT}/api                   ║
║   Health: http://localhost:${PORT}/api/health         ║
║                                                       ║
║   WebSocket: Enabled (Socket.IO)                      ║
║   Database: PostgreSQL (Token Counter & Data)         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});

startServer();

export { app, io };
