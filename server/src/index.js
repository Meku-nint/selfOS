import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import reminderRoutes from './routes/reminders.js';
import journalRoutes from './routes/journal.js';
import dashboardRoutes from './routes/dashboard.js';
import { initializeDatabase } from './config/database.js';
import { authenticateToken } from './middleware/auth.js';
import { setupSocketHandlers } from './services/socketService.js';
import { startReminderScheduler } from './services/reminderService.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/auth', authRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/reminders', authenticateToken, reminderRoutes);
app.use('/api/journal', authenticateToken, journalRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io setup
setupSocketHandlers(io);

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    startReminderScheduler(io);
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
