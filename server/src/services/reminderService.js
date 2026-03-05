import cron from 'node-cron';
import { Resend } from 'resend';
import { prisma } from '../config/database.js';

let io;
let resendClient;

function getResendClient() {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  resendClient = new Resend(apiKey);
  return resendClient;
}

function getSmartSchedule() {
  return {
    morningCron: process.env.SMART_REMINDER_MORNING_CRON || '0 8 * * *',
    nightCron: process.env.SMART_REMINDER_NIGHT_CRON || '0 21 * * *',
    timezone: process.env.SMART_REMINDER_TIMEZONE || 'UTC',
  };
}

function shouldSendRealtime(type) {
  return type === 'NOTIFICATION' || type === 'BOTH';
}

function shouldSendEmail(type) {
  return type === 'EMAIL' || type === 'BOTH';
}

export function startReminderScheduler(socketIo) {
  io = socketIo;
  const { morningCron, nightCron, timezone } = getSmartSchedule();

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

  // Smart morning briefing (default 08:00)
  cron.schedule(
    morningCron,
    async () => {
      await sendSmartDigest('MORNING');
    },
    { timezone }
  );

  // Smart night reflection (default 21:00)
  cron.schedule(
    nightCron,
    async () => {
      await sendSmartDigest('NIGHT');
    },
    { timezone }
  );

  console.log(`Reminder scheduler started (morning: ${morningCron}, night: ${nightCron}, tz: ${timezone})`);
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
    // Real-time notification path
    if (io && shouldSendRealtime(reminder.type)) {
      io.sendNotificationToUser(reminder.userId, {
        type: 'reminder',
        title: reminder.title,
        message: reminder.message,
        data: {
          taskId: reminder.taskId,
          taskTitle: reminder.task?.title || null,
          scheduledAt: reminder.scheduledAt
        }
      });
    }

    // Email delivery path (Resend)
    if (shouldSendEmail(reminder.type)) {
      await sendReminderEmail(reminder);
    }

    // Mark as sent
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { isSent: true }
    });

    console.log(`🔔 Reminder sent: ${reminder.title} to ${reminder.user.firstName}`);

    // If task is due soon, create follow-up reminder
    if (reminder.task?.dueDate) {
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
    if (!originalReminder.task) return;

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

    console.log(`Urgent reminder created for task: ${originalReminder.task.title}`);
  } catch (error) {
    console.error('Create urgent reminder error:', error);
  }
}

async function sendReminderEmail(reminder) {
  try {
    const client = getResendClient();
    const from = process.env.RESEND_FROM_EMAIL;

    if (!client || !from) {
      console.warn('Email skipped: configure RESEND_API_KEY and RESEND_FROM_EMAIL');
      return;
    }

    if (!reminder.user?.email) {
      console.warn(`Email skipped: user email missing for reminder ${reminder.id}`);
      return;
    }

    const taskTitle = reminder.task?.title || 'your task';
    const dueDateText = reminder.task?.dueDate
      ? new Date(reminder.task.dueDate).toLocaleString()
      : 'No due date';

    const { data, error } = await client.emails.send({
      from,
      to: reminder.user.email,
      subject: `[SelfOS] ${reminder.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
          <h2 style="margin:0 0 12px;color:#7f1d1d">SelfOS Reminder</h2>
          <p style="margin:0 0 8px"><strong>${reminder.title}</strong></p>
          <p style="margin:0 0 12px">${reminder.message}</p>
          <p style="margin:0"><strong>Task:</strong> ${taskTitle}</p>
          <p style="margin:6px 0 0"><strong>Due:</strong> ${dueDateText}</p>
        </div>
      `,
      text: `${reminder.title}\n\n${reminder.message}\nTask: ${taskTitle}\nDue: ${dueDateText}`,
    });

    if (error) {
      console.error('Reminder email Resend API error:', error);
      return;
    }

    if (!data?.id) {
      console.error('Reminder email failed: no Resend message id returned');
    }
  } catch (error) {
    console.error('Reminder email error:', error);
  }
}

async function sendSmartDigest(period) {
  try {
    const users = await prisma.user.findMany({
      where: { isVerified: true },
      select: {
        id: true,
        firstName: true,
        email: true,
      },
    });

    for (const user of users) {
      const digest = await buildSmartMessageForUser(user.id, period);
      await deliverSmartMessage(user, period, digest);
    }

    console.log(`Smart ${period.toLowerCase()} digest sent to ${users.length} users`);
  } catch (error) {
    console.error(`Smart ${period.toLowerCase()} digest error:`, error);
  }
}

async function buildSmartMessageForUser(userId, period) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const pendingCount = await prisma.task.count({
    where: {
      userId,
      status: { not: 'COMPLETED' },
    },
  });

  const dueTodayCount = await prisma.task.count({
    where: {
      userId,
      dueDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
      status: { not: 'COMPLETED' },
    },
  });

  const overdueCount = await prisma.task.count({
    where: {
      userId,
      dueDate: { lt: now },
      status: { not: 'COMPLETED' },
    },
  });

  const completedTodayCount = await prisma.task.count({
    where: {
      userId,
      completedAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
      status: 'COMPLETED',
    },
  });

  const streak = await prisma.userStreak.count({
    where: {
      userId,
      isActive: true,
      tasksCompleted: { gt: 0 },
    },
  });

  if (period === 'MORNING') {
    const title = 'Morning focus plan';
    const message =
      dueTodayCount > 0
        ? `Good morning. You have ${dueTodayCount} task(s) due today and ${pendingCount} pending overall. Start with one high-impact task.`
        : `Good morning. You have ${pendingCount} pending task(s). Pick your top priority and make early progress.`;

    return {
      title,
      message: overdueCount > 0 ? `${message} You also have ${overdueCount} overdue task(s).` : message,
      meta: { pendingCount, dueTodayCount, overdueCount, completedTodayCount, streak },
    };
  }

  const title = 'Night reflection';
  const message =
    completedTodayCount > 0
      ? `Nice work today. You completed ${completedTodayCount} task(s). ${pendingCount} task(s) remain for tomorrow.`
      : `Your day is wrapping up. You still have ${pendingCount} pending task(s). Plan one clear first task for tomorrow morning.`;

  const streakLine = streak > 0 ? ` Current streak: ${streak} day(s). Keep it going.` : ' Start your streak tomorrow with one completed task.';

  return {
    title,
    message: `${message}${streakLine}`,
    meta: { pendingCount, dueTodayCount, overdueCount, completedTodayCount, streak },
  };
}

async function deliverSmartMessage(user, period, digest) {
  // Realtime push via socket (if user is connected)
  if (io) {
    io.sendNotificationToUser(user.id, {
      type: period === 'MORNING' ? 'smart_morning' : 'smart_night',
      title: digest.title,
      message: digest.message,
      data: digest.meta,
    });
  }

  // Email via Resend
  const client = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL;
  if (!client || !from || !user.email) return;

  const { data, error } = await client.emails.send({
    from,
    to: user.email,
    subject: `[SelfOS] ${digest.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
        <h2 style="margin:0 0 12px;color:#7f1d1d">${digest.title}</h2>
        <p style="margin:0 0 10px">Hi ${user.firstName || 'there'},</p>
        <p style="margin:0 0 12px">${digest.message}</p>
        <p style="margin:0">Pending: ${digest.meta.pendingCount}</p>
        <p style="margin:0">Due today: ${digest.meta.dueTodayCount}</p>
        <p style="margin:0">Overdue: ${digest.meta.overdueCount}</p>
        <p style="margin:0">Completed today: ${digest.meta.completedTodayCount}</p>
      </div>
    `,
    text: `${digest.title}\n\nHi ${user.firstName || 'there'},\n${digest.message}\nPending: ${digest.meta.pendingCount}\nDue today: ${digest.meta.dueTodayCount}\nOverdue: ${digest.meta.overdueCount}\nCompleted today: ${digest.meta.completedTodayCount}`,
  });

  if (error) {
    console.error('Smart digest Resend API error:', error);
    return;
  }

  if (!data?.id) {
    console.error('Smart digest email failed: no Resend message id returned');
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
