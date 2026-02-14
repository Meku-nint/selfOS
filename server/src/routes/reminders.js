import express from 'express';
import { prisma } from '../config/database.js';

const router = express.Router();

// Get all reminders for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const reminders = await prisma.reminder.findMany({
      where: { userId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            dueDate: true
          }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create reminder
router.post('/', async (req, res) => {
  try {
    const { taskId, title, message, scheduledAt, type } = req.body;
    const userId = req.user.id;

    if (!taskId || !title || !scheduledAt) {
      return res.status(400).json({ message: 'Task ID, title, and scheduled time are required' });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const reminder = await prisma.reminder.create({
      data: {
        taskId,
        userId,
        title,
        message: message || `Reminder for task: ${task.title}`,
        scheduledAt: new Date(scheduledAt),
        type: type || 'NOTIFICATION'
      },
      include: {
        task: true
      }
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update reminder
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, scheduledAt, type, isSent } = req.body;
    const userId = req.user.id;

    const reminder = await prisma.reminder.findFirst({
      where: { id, userId }
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
    if (type) updateData.type = type;
    if (isSent !== undefined) updateData.isSent = isSent;

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: updateData,
      include: {
        task: true
      }
    });

    res.json(updatedReminder);
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete reminder
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reminder = await prisma.reminder.findFirst({
      where: { id, userId }
    });

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    await prisma.reminder.delete({
      where: { id }
    });

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
