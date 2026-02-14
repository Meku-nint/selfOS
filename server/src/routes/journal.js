import express from 'express';
import { prisma } from '../config/database.js';

const router = express.Router();

// Get all journal entries for user
router.get('/', async (req, res) => {
  try {
    const { mood, tags, limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    const where = {
      userId,
      ...(mood && { mood: parseInt(mood) }),
      ...(tags && { tags: { hasSome: Array.isArray(tags) ? tags : [tags] } })
    };

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json(entries);
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create journal entry
router.post('/', async (req, res) => {
  try {
    const { title, content, mood, tags } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        title,
        content,
        mood: mood ? parseInt(mood) : null,
        tags: tags || [],
        userId
      }
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update journal entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, mood, tags } = req.body;
    const userId = req.user.id;

    const entry = await prisma.journalEntry.findFirst({
      where: { id, userId }
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content) updateData.content = content;
    if (mood !== undefined) updateData.mood = parseInt(mood);
    if (tags !== undefined) updateData.tags = tags;

    const updatedEntry = await prisma.journalEntry.update({
      where: { id },
      data: updateData
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete journal entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const entry = await prisma.journalEntry.findFirst({
      where: { id, userId }
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    await prisma.journalEntry.delete({
      where: { id }
    });

    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get journal analytics
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      select: {
        mood: true,
        createdAt: true,
        tags: true
      }
    });

    const moodStats = entries.reduce((acc, entry) => {
      if (entry.mood) {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      }
      return acc;
    }, {});

    const tagStats = entries.reduce((acc, entry) => {
      entry.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {});

    const avgMood = entries
      .filter(e => e.mood)
      .reduce((sum, e) => sum + e.mood, 0) / entries.filter(e => e.mood).length || 0;

    res.json({
      totalEntries: entries.length,
      averageMood: avgMood.toFixed(2),
      moodDistribution: moodStats,
      topTags: Object.entries(tagStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }))
    });
  } catch (error) {
    console.error('Get journal analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
