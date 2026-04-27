const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Gemini AI Service for Health Analysis
 * Falls back gracefully to null when API key is missing or invalid.
 */
class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.log("ℹ️  VitalIQ: No Gemini API key — using intelligent rule-based analysis.");
      this.genAI = null;
      this.disabled = true;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.disabled = false;
      this.validated = false; // will validate on first call
      console.log("🚀 VitalIQ AI: Gemini Service Initialized.");
    }
  }

  /**
   * Analyze health data using Gemini LLM
   */
  async analyzeHealth(healthData, user) {
    if (this.disabled || !this.genAI) return null;

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        As a professional health analysis AI, analyze the following daily health log for a user:
        
        User Profile:
        - Age: ${user.age}
        - Gender: ${user.gender}
        - Weight: ${user.weight}kg
        - Height: ${user.height}cm
        
        Daily Health Data:
        - Sleep: ${healthData.sleepHours} hours
        - Stress Level: ${healthData.stressLevel}/10
        - Exercise: ${healthData.exerciseMinutes} minutes
        - Steps: ${healthData.steps}
        - Water Intake: ${healthData.waterIntake}L
        - Smoking: ${healthData.smoking ? 'Yes' : 'No'}
        - Alcohol: ${healthData.alcohol ? 'Yes' : 'No'}
        - Diet: ${healthData.dietType}
        
        Please provide a comprehensive health risk analysis in JSON format:
        {
          "level": "Low" | "Medium" | "High",
          "score": 0-100,
          "confidence": 0.0-1.0,
          "explanation": "Brief summary of the primary health drivers",
          "insights": [
            "Specific, nuanced health insights based on the data correlation"
          ],
          "recommendations": [
            "Actionable, personalized lifestyle advice"
          ],
          "micro_hacks": [
            "Quick, 5-minute health improvements for today"
          ]
        }
        
        Ensure the JSON is valid and the tone is professional yet encouraging.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response (handling potential markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        this.validated = true;
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error("Failed to parse AI response");
    } catch (error) {
      // If the API key is invalid, disable permanently to avoid spam
      if (error.status === 400 || error.status === 403) {
        console.log("⚠️  Gemini API key is invalid. Disabling AI — using rule-based analysis for this session.");
        this.disabled = true;
        this.genAI = null;
      } else {
        console.log("⚠️  Gemini temporary error:", error.message?.slice(0, 80));
      }
      return null;
    }
  }

  /**
   * Chat with the Health Coach
   */
  async chatWithCoach(messages, context) {
    if (this.disabled || !this.genAI) {
      return generateOfflineCoachResponse(messages[messages.length - 1]?.content || '');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const chat = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 500,
        },
      });

      const systemPrompt = `
        You are "VitalIQ", a friendly and intelligent AI Health Coach for the VitalIQ Health platform.
        Your goal is to help users understand their health data and provide motivation.
        
        Current User Context:
        ${JSON.stringify(context)}
        
        Rules:
        1. Be encouraging and empathetic.
        2. Keep advice actionable and evidence-based.
        3. ALWAYS include a medical disclaimer for specific health concerns.
        4. Use emojis occasionally to stay friendly.
        5. If you don't know something or it's a serious medical issue, advise seeing a doctor.
      `;

      const userMessage = messages[messages.length - 1].content;
      const result = await chat.sendMessage(`${systemPrompt}\n\nUser Question: ${userMessage}`);
      const response = await result.response;
      return response.text();
    } catch (error) {
      if (error.status === 400 || error.status === 403) {
        this.disabled = true;
        this.genAI = null;
      }
      return generateOfflineCoachResponse(messages[messages.length - 1]?.content || '');
    }
  }
}

/**
 * Offline coach responses — smart enough to feel like AI
 */
function generateOfflineCoachResponse(question) {
  const q = question.toLowerCase();

  if (q.includes('sleep') || q.includes('tired') || q.includes('insomnia')) {
    return "🌙 Sleep is the foundation of good health! Here are my tips:\n\n" +
      "1. **Set a consistent bedtime** — even on weekends\n" +
      "2. **No screens 1 hour before bed** — blue light disrupts melatonin\n" +
      "3. **Keep your room cool** (18-20°C) and dark\n" +
      "4. **Try the 4-7-8 breathing technique** before sleep\n\n" +
      "💡 Aim for 7-9 hours. Quality matters as much as quantity!\n\n" +
      "⚕️ *If sleep problems persist for more than 2 weeks, please consult a doctor.*";
  }

  if (q.includes('stress') || q.includes('anxiety') || q.includes('worried')) {
    return "🧘 Managing stress is crucial for your overall health!\n\n" +
      "1. **Box breathing**: Inhale 4s → Hold 4s → Exhale 4s → Hold 4s\n" +
      "2. **Take a 10-minute walk** in nature\n" +
      "3. **Journal** 3 things you're grateful for tonight\n" +
      "4. **Limit social media** to 30 min/day\n\n" +
      "Your VitalIQ score improves when stress goes down! 💪\n\n" +
      "⚕️ *If anxiety is affecting your daily life, please reach out to a mental health professional.*";
  }

  if (q.includes('diet') || q.includes('food') || q.includes('eat') || q.includes('weight')) {
    return "🥗 Nutrition is medicine! Here's what I recommend:\n\n" +
      "1. **Follow the plate method**: ½ veggies, ¼ protein, ¼ whole grains\n" +
      "2. **Drink water before meals** — helps portion control\n" +
      "3. **Eat slowly** — it takes 20 min for your brain to feel full\n" +
      "4. **Prep healthy snacks**: nuts, fruits, yogurt\n\n" +
      "Small changes beat extreme diets every time! 🎯\n\n" +
      "⚕️ *For personalized nutrition advice, consult a registered dietitian.*";
  }

  if (q.includes('exercise') || q.includes('workout') || q.includes('gym') || q.includes('walk')) {
    return "🏃 Movement is the best medicine! Here's your action plan:\n\n" +
      "1. **Start with 10 min walks** after meals — reduces blood sugar spikes by 12%\n" +
      "2. **Aim for 150 min/week** of moderate activity\n" +
      "3. **Include strength training** 2-3x per week\n" +
      "4. **Take stairs** over elevators whenever possible\n\n" +
      "Every step counts toward your VitalIQ goals! 🏆\n\n" +
      "⚕️ *If you have any medical conditions, consult your doctor before starting a new exercise program.*";
  }

  return "👋 Hi! I'm your VitalIQ Health Coach. I'm here to help you with:\n\n" +
    "• 🌙 **Sleep** — Tips for better rest\n" +
    "• 🧘 **Stress** — Relaxation techniques\n" +
    "• 🥗 **Nutrition** — Healthy eating advice\n" +
    "• 🏃 **Exercise** — Activity recommendations\n" +
    "• 📊 **Your Data** — Understanding your health scores\n\n" +
    "Ask me anything about your health! Remember, I provide guidance — " +
    "for medical concerns, always consult a healthcare professional. 💚";
}

module.exports = new GeminiService();
