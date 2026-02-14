import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const connectedUsers = new Map();

export function setupSocketHandlers(io) {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, firstName: true, lastName: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔗 User connected: ${socket.user.firstName} (${socket.user.id})`);
    
    // Store user connection
    connectedUsers.set(socket.user.id, socket);

    // Join user to their personal room
    socket.join(`user:${socket.user.id}`);

    // Handle task events
    socket.on('task:created', async (data) => {
      try {
        // Broadcast to user's other devices
        socket.to(`user:${socket.user.id}`).emit('task:created', data);
        
        // Send notification if task is urgent
        if (data.priority === 'URGENT') {
          socket.emit('notification', {
            type: 'urgent_task',
            title: 'Urgent Task Created',
            message: `Task "${data.title}" has been marked as urgent`,
            data
          });
        }
      } catch (error) {
        console.error('Socket task:created error:', error);
      }
    });

    socket.on('task:updated', async (data) => {
      try {
        // Broadcast to user's other devices
        socket.to(`user:${socket.user.id}`).emit('task:updated', data);

        // Special handling for task completion
        if (data.status === 'COMPLETED') {
          // Update streak
          await updateUserStreak(socket.user.id);
          
          socket.emit('notification', {
            type: 'task_completed',
            title: 'Task Completed! 🎉',
            message: `Great job! You completed "${data.title}"`,
            data
          });

          // Check for streak milestone
          const streak = await getCurrentStreak(socket.user.id);
          if (streak > 0 && streak % 7 === 0) {
            socket.emit('notification', {
              type: 'streak_milestone',
              title: 'Amazing Streak! 🔥',
              message: `You've maintained a ${streak}-day streak!`,
              data: { streak }
            });
          }
        }
      } catch (error) {
        console.error('Socket task:updated error:', error);
      }
    });

    socket.on('task:deleted', async (data) => {
      try {
        socket.to(`user:${socket.user.id}`).emit('task:deleted', data);
      } catch (error) {
        console.error('Socket task:deleted error:', error);
      }
    });

    // Handle reminder events
    socket.on('reminder:created', async (data) => {
      try {
        socket.to(`user:${socket.user.id}`).emit('reminder:created', data);
      } catch (error) {
        console.error('Socket reminder:created error:', error);
      }
    });

    // Handle journal events
    socket.on('journal:created', async (data) => {
      try {
        socket.to(`user:${socket.user.id}`).emit('journal:created', data);
        
        // Send encouragement for low mood entries
        if (data.mood && data.mood <= 2) {
          socket.emit('notification', {
            type: 'mood_support',
            title: 'Feeling Better Soon 💙',
            message: 'Journaling helps. Tomorrow is a new day!',
            data
          });
        }
      } catch (error) {
        console.error('Socket journal:created error:', error);
      }
    });

    // Handle real-time typing indicator
    socket.on('typing:start', (data) => {
      socket.to(`user:${socket.user.id}`).emit('typing:indicator', {
        isTyping: true,
        ...data
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`user:${socket.user.id}`).emit('typing:indicator', {
        isTyping: false,
        ...data
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.firstName} (${socket.user.id})`);
      connectedUsers.delete(socket.user.id);
    });

    // Send welcome notification
    socket.emit('notification', {
      type: 'connection',
      title: 'Welcome Back! 👋',
      message: 'You\'re now connected to SelfOS real-time updates'
    });
  });

  // Global notification function
  io.sendNotificationToUser = (userId, notification) => {
    const userSocket = connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit('notification', notification);
    }
  };

  return io;
}

async function updateUserStreak(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingStreak = await prisma.userStreak.findUnique({
      where: {
        userId_streakDate: {
          userId,
          streakDate: today
        }
      }
    });

    if (existingStreak) {
      await prisma.userStreak.update({
        where: { id: existingStreak.id },
        data: { tasksCompleted: { increment: 1 } }
      });
    } else {
      await prisma.userStreak.create({
        data: {
          userId,
          streakDate: today,
          tasksCompleted: 1
        }
      });
    }
  } catch (error) {
    console.error('Update streak error:', error);
  }
}

async function getCurrentStreak(userId) {
  try {
    const streaks = await prisma.userStreak.findMany({
      where: {
        userId,
        isActive: true,
        tasksCompleted: { gt: 0 }
      },
      orderBy: { streakDate: 'desc' },
      take: 30
    });

    return streaks.length;
  } catch (error) {
    console.error('Get current streak error:', error);
    return 0;
  }
}

export { connectedUsers };
