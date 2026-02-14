import express from 'express';
import { prisma } from '../config/database.js';

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            tasks: true,
            journalEntries: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, avatar } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (avatar) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user streaks
router.get('/streaks', async (req, res) => {
  try {
    const userId = req.user.id;

    const streaks = await prisma.userStreak.findMany({
      where: { userId },
      orderBy: { streakDate: 'desc' },
      take: 30
    });

    const currentStreak = await prisma.userStreak.findMany({
      where: { 
        userId,
        isActive: true,
        streakDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { streakDate: 'desc' }
    });

    res.json({
      streaks,
      currentStreak: currentStreak.length,
      longestStreak: Math.max(...streaks.map(s => s.tasksCompleted), 0)
    });
  } catch (error) {
    console.error('Get streaks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
