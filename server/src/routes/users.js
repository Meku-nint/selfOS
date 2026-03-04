import express from 'express';
import bcrypt from 'bcryptjs';
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

// Update email and/or password with current password verification
router.put('/account', async (req, res) => {
  try {
    const { currentPassword, newPassword, newEmail } = req.body;
    const userId = req.user.id;

    const normalizedEmail = typeof newEmail === 'string' ? newEmail.trim().toLowerCase() : '';
    const normalizedPassword = typeof newPassword === 'string' ? newPassword : '';

    if (!normalizedEmail && !normalizedPassword) {
      return res.status(400).json({ message: 'Provide a new email or a new password' });
    }

    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ message: 'Current password is required for verification' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        message: 'Password verification is unavailable for this account. Please use your original login provider.'
      });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const updateData = {};

    if (normalizedEmail) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }

      if (normalizedEmail !== user.email.toLowerCase()) {
        const existingEmailUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true }
        });

        if (existingEmailUser && existingEmailUser.id !== userId) {
          return res.status(400).json({ message: 'That email is already in use' });
        }

        updateData.email = normalizedEmail;
      }
    }

    if (normalizedPassword) {
      if (normalizedPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }

      const sameAsCurrent = await bcrypt.compare(normalizedPassword, user.passwordHash);
      if (sameAsCurrent) {
        return res.status(400).json({ message: 'New password must be different from your current password' });
      }

      updateData.passwordHash = await bcrypt.hash(normalizedPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No changes detected' });
    }

    const updatedUser = await prisma.user.update({
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

    res.json({
      message: 'Account updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update account error:', error);
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
