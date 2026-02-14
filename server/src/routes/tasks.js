import express from 'express';
import { prisma } from '../config/database.js';

const router = express.Router();

// Get all tasks for user
router.get('/', async (req, res) => {
  try {
    const { status, priority, categoryId, search } = req.query;
    const userId = req.user.id;

    const where = {
      userId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        category: true,
        reminders: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, dueDate, categoryId } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        categoryId,
        userId
      },
      include: {
        category: true,
        reminders: true
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, dueDate, categoryId } = req.body;
    const userId = req.user.id;

    const task = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updateData = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(priority && { priority }),
      ...(status && { status }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(categoryId !== undefined && { categoryId }),
      ...(status === 'COMPLETED' && { completedAt: new Date() })
    };

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        reminders: true
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findFirst({
      where: { id, userId }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get task statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await prisma.task.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true }
    });

    const priorityStats = await prisma.task.groupBy({
      by: ['priority'],
      where: { userId, status: 'PENDING' },
      _count: { priority: true }
    });

    res.json({
      byStatus: stats.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
      byPriority: priorityStats.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
