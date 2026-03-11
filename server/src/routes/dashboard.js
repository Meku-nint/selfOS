import express from "express";
import { prisma } from "../config/database.js";

const router = express.Router();
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

router.post("/coach", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "AI coach is not configured on the server." });
    }

    const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
    if (!query) {
      return res.status(400).json({ message: "Query is required." });
    }

    if (query.length > 1000) {
      return res.status(400).json({ message: "Query is too long. Please keep it under 1000 characters." });
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "You are SelfOS AI Coach. Give concise, practical and supportive advice for productivity, focus, journaling and routines. Keep responses under 8 bullet points unless asked for more detail."
          },
          {
            role: "user",
            content: query
          }
        ]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Groq API error:", response.status, errorBody);
      return res.status(502).json({ message: "AI coach is temporarily unavailable." });
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message?.content;

    if (!message || typeof message !== "string") {
      return res.status(502).json({ message: "AI coach returned an empty response." });
    }

    res.json({ response: message.trim() });
  } catch (error) {
    console.error("AI coach error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
