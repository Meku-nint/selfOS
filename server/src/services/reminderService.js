import cron from 'node-cron';
import { prisma } from '../config/database.js';

let io;

export function startReminderScheduler(socketIo) {
  io = socketIo;

  // Check for reminders every minute
  cron.schedule('* * * * *', async () => {
    await checkAndSendReminders();
  });

  // Clean up old sent reminders every hour
  cron.schedule('0 * * * *', async () => {
    await cleanupOldReminders();
  });

  // Update streaks at midnight
  cron.schedule('0 0 * * *', async () => {
    await updateDailyStreaks();
  });

  console.log('⏰ Reminder scheduler started');
}

async function checkAndSendReminders() {
  try {
    const now = new Date();
    
    // Find reminders that should be sent now (within the last minute)
    const reminders = await prisma.reminder.findMany({
      where: {
        scheduledAt: {
          lte: now,
          gte: new Date(now.getTime() - 60 * 1000) // Last minute
        },
        isSent: false
      },
      include: {
        user: {
          select: { id: true, firstName: true, email: true }
        },
        task: {
          select: { id: true, title: true, dueDate: true, status: true }
        }
      }
    });

    for (const reminder of reminders) {
      await sendReminder(reminder);
    }
  } catch (error) {
    console.error('Reminder check error:', error);
  }
}

async function sendReminder(reminder) {
  try {
    // Send real-time notification
    if (io) {
      io.sendNotificationToUser(reminder.userId, {
        type: 'reminder',
        title: reminder.title,
        message: reminder.message,
        data: {
          taskId: reminder.taskId,
          taskTitle: reminder.task.title,
          scheduledAt: reminder.scheduledAt
        }
      });
    }

    // Mark as sent
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { isSent: true }
    });

    console.log(`🔔 Reminder sent: ${reminder.title} to ${reminder.user.firstName}`);

    // If task is due soon, create follow-up reminder
    if (reminder.task.dueDate) {
      const dueDate = new Date(reminder.task.dueDate);
      const timeUntilDue = dueDate.getTime() - Date.now();
      
      // If task is due in less than 2 hours, create urgent reminder
      if (timeUntilDue > 0 && timeUntilDue <= 2 * 60 * 60 * 1000) {
        await createUrgentReminder(reminder);
      }
    }
  } catch (error) {
    console.error('Send reminder error:', error);
  }
}

async function createUrgentReminder(originalReminder) {
  try {
    const urgentTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    
    await prisma.reminder.create({
      data: {
        taskId: originalReminder.taskId,
        userId: originalReminder.userId,
        title: `URGENT: ${originalReminder.task.title}`,
        message: `Task is due soon! Complete it now.`,
        scheduledAt: urgentTime,
        type: 'NOTIFICATION'
      }
    });

    console.log(`⚠️ Urgent reminder created for task: ${originalReminder.task.title}`);
  } catch (error) {
    console.error('Create urgent reminder error:', error);
  }
}

async function cleanupOldReminders() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await prisma.reminder.deleteMany({
      where: {
        isSent: true,
        scheduledAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    if (deleted.count > 0) {
      console.log(`🧹 Cleaned up ${deleted.count} old reminders`);
    }
  } catch (error) {
    console.error('Cleanup reminders error:', error);
  }
}

async function updateDailyStreaks() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Find users who had activity yesterday
    const activeUsers = await prisma.userStreak.findMany({
      where: {
        streakDate: yesterday,
        tasksCompleted: { gt: 0 }
      },
      select: { userId: true }
    });

    // Create streak entries for today for active users
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const { userId } of activeUsers) {
      await prisma.userStreak.upsert({
        where: {
          userId_streakDate: {
            userId,
            streakDate: today
          }
        },
        update: {},
        create: {
          userId,
          streakDate: today,
          tasksCompleted: 0
        }
      });
    }

    // Mark inactive streaks
    await prisma.userStreak.updateMany({
      where: {
        streakDate: { lt: yesterday },
        isActive: true
      },
      data: { isActive: false }
    });

    console.log(`📊 Updated daily streaks for ${activeUsers.length} users`);
  } catch (error) {
    console.error('Update daily streaks error:', error);
  }
}

// Manual reminder creation for tasks
export async function createTaskReminder(taskId, userId, customTime = null) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true, dueDate: true }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Default reminder: 12 hours before due date, or 12 hours from now if no due date
    let scheduledAt;
    if (customTime) {
      scheduledAt = new Date(customTime);
    } else if (task.dueDate) {
      scheduledAt = new Date(new Date(task.dueDate).getTime() - 12 * 60 * 60 * 1000);
    } else {
      scheduledAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
    }

    const reminder = await prisma.reminder.create({
      data: {
        taskId,
        userId,
        title: `Task Reminder: ${task.title}`,
        message: `Don't forget about your task: ${task.title}`,
        scheduledAt,
        type: 'NOTIFICATION'
      }
    });

    console.log(`📅 Created reminder for task: ${task.title}`);
    return reminder;
  } catch (error) {
    console.error('Create task reminder error:', error);
    throw error;
  }
}
