import express from "express";
import { prisma } from "../config/database.js";

const router = express.Router();

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function average(values) {
  if (!values.length) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    const todayTasks = await prisma.task.findMany({
      where: {
        userId,
        dueDate: {
          gte: todayStart,
          lt: tomorrowStart
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true
      },
      orderBy: { dueDate: "asc" }
    });

    const dailyQuote =
      (await prisma.quote.findFirst({
        where: { userId, isDaily: true },
        orderBy: { createdAt: "desc" }
      })) ||
      (await prisma.quote.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" }
      }));

    const resourceRows = await prisma.resource.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    const resources = {
      books: resourceRows.filter((item) => item.type === "BOOK"),
      speakers: resourceRows.filter((item) => item.type === "SPEAKER")
    };

    const heatmapStart = new Date(todayStart);
    heatmapStart.setDate(todayStart.getDate() - 363);

    const dailyMetrics = await prisma.dailyMetric.findMany({
      where: {
        userId,
        metricDate: {
          gte: heatmapStart,
          lt: tomorrowStart
        }
      },
      select: {
        metricDate: true,
        score: true
      },
      orderBy: { metricDate: "asc" }
    });

    const heatmap = dailyMetrics.map((metric) => ({
      date: dateKey(metric.metricDate),
      score: metric.score || 0
    }));

    const heatmapMap = new Map(heatmap.map((item) => [item.date, item.score]));

    const weeklyProductivity = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(todayStart);
      day.setDate(todayStart.getDate() - (6 - index));
      const label = day.toLocaleDateString("en-US", { weekday: "short" });
      return {
        label,
        value: Math.round((heatmapMap.get(dateKey(day)) || 0) * 100)
      };
    });

    const monthlyProductivity = Array.from({ length: 4 }, (_, index) => {
      const start = new Date(todayStart);
      start.setDate(todayStart.getDate() - (27 - index * 7));
      const scores = Array.from({ length: 7 }, (_, dayIndex) => {
        const day = new Date(start);
        day.setDate(start.getDate() + dayIndex);
        return heatmapMap.get(dateKey(day)) || 0;
      });

      return {
        label: `Week ${index + 1}`,
        value: Math.round(average(scores) * 100)
      };
    });

    const completedTasks = await prisma.task.count({
      where: { userId, status: "COMPLETED" }
    });

    const streakRows = await prisma.userStreak.findMany({
      where: { userId, tasksCompleted: { gt: 0 } },
      select: { streakDate: true },
      orderBy: { streakDate: "desc" }
    });

    let streakDays = 0;
    let lastDate = null;
    for (const row of streakRows) {
      const currentDate = startOfDay(row.streakDate);
      if (!lastDate) {
        streakDays += 1;
        lastDate = currentDate;
        continue;
      }

      const expected = new Date(lastDate);
      expected.setDate(expected.getDate() - 1);

      if (dateKey(currentDate) === dateKey(expected)) {
        streakDays += 1;
        lastDate = currentDate;
        continue;
      }

      break;
    }

    const averageScore = average(dailyMetrics.map((metric) => metric.score || 0));

    res.json({
      todayTasks,
      quote: dailyQuote,
      resources,
      heatmap,
      weeklyProductivity,
      monthlyProductivity,
      analytics: {
        tasksDone: completedTasks,
        streakDays,
        avgScore: Number(averageScore.toFixed(2))
      }
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
