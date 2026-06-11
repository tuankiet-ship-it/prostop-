import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client helper
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI replies will be limited.");
      throw new Error("GEMINI_API_KEY is not configured. Please add this in Settings > Secrets in the AI Studio UI.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. AI Coach endpoint (secured server-side Gemini API call)
app.post("/api/coach", async (req, res) => {
  try {
    const { message, chatHistory, userProfile } = req.body;

    const ai = getGeminiClient();

    // Construct a rich prompt describing the user's habits.
    const userContext = userProfile ? `
User Metrics:
- Level: ${userProfile.level || 'Bronze'}
- Experience Points (XP): ${userProfile.xp || 0} XP
- Streak: ${userProfile.streak || 0} days
- Daily Social Media Limit: ${userProfile.dailyLimitMinutes || 60} minutes
- Today's Usage so far: ${userProfile.currentUsageMinutes || 0} minutes
- Total Time Saved from scrolling: ${userProfile.timeSavedMinutes || 0} minutes
- Healthy Actions completed: ${userProfile.skillsLearnedCount || 0} tasks
` : "No profile metrics available yet.";

    const systemInstruction = `You are "Coach Stop", the supportive, motivational, energetic AI Coach of ProStop (Stop Scrolling, Start Growing).
ProStop's target audience is students & young professionals (ages 10-30) trying to cut back on addictive social media feeds (TikTok, Instagram, etc.) and replace it with rewarding learning tasks (English vocabulary, workouts, coding, data analysis, speaking, solving quizzes).

Your persona rules:
1. Be ultra-encouraging, highly energetic, friendly, and practical (kind of like a encouraging, cool mentor).
2. Review the user's current metrics and give highly personalized advice reflecting their streak, level, or usage.
3. Suggest concrete actions (e.g., "Why not take a 3-minute quiz?", "Let's learn 5 English words right now instead of looking at Instagram!").
4. Keep answers short, punchy, well-formatted in Markdown with bold points, and easily readable in a mobile-app chat window.
5. Do NOT use dry or boring corporate talk. Avoid mentioning database names or code paths. Keep it highly motivational!
6. Speak in Vietnamese (since the user requested Vietnamese: "đồng bộ dữ liệu theo thời gian thực") but feel free to blend motivational English phrases if natural.
`;

    // Construct contents
    const contents: any[] = [];
    
    // Parse chat history if exists to build conversation context
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((msg: any) => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: `[Đây là trạng thái của tôi hiện tại: ${userContext}]\n\nTin nhắn của tôi: ${message}` }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
      }
    });

    const replyText = response.text || "Tôi chưa nhận được phản hồi phù hợp, hãy thử lại nhé!";
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Gemini Coach Error:", error);
    res.status(500).json({ 
      error: "Không thể kết nối với AI Coach lúc này.", 
      details: error.message 
    });
  }
});

// Configure Vite middleware in development or serve static assets in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    console.log(`Development environment: ${process.env.NODE_ENV !== "production" ? "Vite Middleware Enabled" : "Production static build"}`);
  });
}

startServer();
