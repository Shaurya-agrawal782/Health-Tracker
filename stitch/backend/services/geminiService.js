const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Gemini AI Service for Health Analysis
 * Falls back gracefully to null when API key is missing or invalid.
 */
class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    this.modelName = getConfiguredModelName();
    this.validated = false;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey === 'your_gemini_api_key_here') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn("VitalIQ Health AI: GEMINI_API_KEY is missing. Gemini is disabled; using rule-based analysis and offline coach responses.");
      }
      this.genAI = null;
      this.disabled = true;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.disabled = false;
      console.log(`VitalIQ Health AI: Gemini service initialized with model ${this.modelName}.`);
    } catch (error) {
      console.warn("VitalIQ Health AI: Failed to initialize Gemini. Falling back to rule-based analysis and offline coach responses.", error.message);
      this.genAI = null;
      this.disabled = true;
    }
  }

  getModel() {
    if (this.disabled || !this.genAI) return null;
    return this.genAI.getGenerativeModel({ model: this.modelName });
  }

  handleGeminiError(error, operation) {
    const status = error?.status || error?.response?.status;
    const message = error?.message || 'Unknown Gemini error';

    if (status === 401 || status === 403) {
      console.warn(`VitalIQ Health AI: Gemini authentication failed during ${operation}. Disabling Gemini for this session.`);
      this.disabled = true;
      this.genAI = null;
      return;
    }

    console.warn(`VitalIQ Health AI: Gemini ${operation} failed with model ${this.modelName}. Falling back safely. ${message.slice(0, 160)}`);
  }

  /**
   * Analyze health data using Gemini LLM
   */
  async analyzeHealth(healthData, user) {
    if (this.disabled || !this.genAI) return null;

    try {
      const model = this.getModel();
      if (!model) return null;

      const prompt = `
        As a wellness risk-screening assistant, review the following daily lifestyle log for a user.
        Treat all results as AI-assisted wellness guidance, not medical diagnosis, diagnostic forecasting, or treatment advice.
        
        User Profile:
        - Age: ${formatPromptValue(healthData.age || user.age)}
        - Gender: ${formatPromptValue(healthData.gender || user.gender)}
        
        Daily Health Data:
        - BMI: ${formatPromptValue(healthData.bmi)}
        - Glucose: ${formatPromptValue(healthData.glucose)}
        - Blood Pressure: ${formatPromptValue(healthData.bloodPressure)}
        - Sleep Hours: ${formatPromptValue(healthData.sleepHours)}
        - Screen Hours: ${formatPromptValue(healthData.screenHours)}
        - Work Hours: ${formatPromptValue(healthData.workHours)}
        - Daily Activity Minutes: ${formatPromptValue(healthData.dailyActivityMinutes)}
        - Stress Level: ${formatPromptValue(healthData.stressLevel)}
        - Steps: ${formatPromptValue(healthData.steps)}
        - Water Intake: ${formatPromptValue(healthData.waterIntake)}
        - Smoking: ${formatPromptValue(booleanToYesNo(healthData.smoking))}
        - Alcohol: ${formatPromptValue(booleanToYesNo(healthData.alcohol))}
        - Family History: ${formatPromptValue(healthData.familyHistory)}
        - Symptoms: ${formatPromptValue(formatSymptoms(healthData.symptoms))}
        
        Please provide a lifestyle-based wellness risk estimate in JSON format:
        {
          "level": "Low" | "Medium" | "High",
          "score": 0-100,
          "explanation": "Brief summary of the primary lifestyle drivers for the wellness risk estimate",
          "insights": [
            "Specific, nuanced wellness insights based on lifestyle trend analysis"
          ],
          "recommendations": [
            "Actionable, personalized wellness recommendations"
          ],
          "micro_hacks": [
            "Quick, 5-minute wellness actions for today"
          ]
        }
        
        Safety rules:
        - Never say you diagnose, treat, cure, or forecast disease.
        - Explain results as wellness guidance and lifestyle-based risk estimation only.
        - Do not provide medication, dosage, supplement dosage, or treatment instructions.
        - Provide safe lifestyle suggestions only.
        - For serious symptoms or medical concerns, recommend consulting a qualified healthcare professional.
        - Include this disclaimer in the explanation when appropriate: "VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional."
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
      this.handleGeminiError(error, 'health analysis');
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
      const model = this.getModel();
      if (!model) {
        return generateOfflineCoachResponse(getLatestMessageContent(messages));
      }
      const chat = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 500,
        },
      });

      const systemPrompt = `
        You are "VitalIQ", a friendly AI-assisted wellness coach for the VitalIQ Health platform.
        Your goal is to help users understand lifestyle trends, wellness risk estimates, and safe habit options.
        
        Current User Context:
        ${JSON.stringify(context)}
        
        Rules:
        1. Be encouraging and empathetic.
        2. Explain results as wellness guidance, not a diagnosis or diagnostic forecast.
        3. Never claim to diagnose, treat, cure, or replace professional medical advice.
        4. Do not provide medication, dosage, supplement dosage, or treatment instructions.
        5. Provide safe lifestyle suggestions only.
        6. For serious symptoms, urgent issues, or medical concerns, recommend consulting a qualified healthcare professional.
        7. Include this disclaimer when discussing health concerns: "VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional."
        8. Use emojis occasionally to stay friendly.
      `;

      const userMessage = getLatestMessageContent(messages);
      const result = await chat.sendMessage(`${systemPrompt}\n\nUser Question: ${userMessage}`);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.handleGeminiError(error, 'coach chat');
      return generateOfflineCoachResponse(getLatestMessageContent(messages));
    }
  }
}

function getConfiguredModelName() {
  return (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim() || DEFAULT_GEMINI_MODEL;
}

function getLatestMessageContent(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return '';
  return messages[messages.length - 1]?.content || '';
}

function formatPromptValue(value) {
  if (value === undefined || value === null || value === '') return 'Not provided';
  return value;
}

function booleanToYesNo(value) {
  if (value === undefined || value === null || value === '') return null;
  return value ? 'Yes' : 'No';
}

function formatSymptoms(symptoms) {
  if (!Array.isArray(symptoms) || symptoms.length === 0) return null;
  return symptoms.join(', ');
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
      "*VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.*";
  }

  if (q.includes('stress') || q.includes('anxiety') || q.includes('worried')) {
    return "🧘 Managing stress is crucial for your overall health!\n\n" +
      "1. **Box breathing**: Inhale 4s → Hold 4s → Exhale 4s → Hold 4s\n" +
      "2. **Take a 10-minute walk** in nature\n" +
      "3. **Journal** 3 things you're grateful for tonight\n" +
      "4. **Limit social media** to 30 min/day\n\n" +
      "Your wellness score improves when stress goes down! 💪\n\n" +
      "*VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.*";
  }

  if (q.includes('diet') || q.includes('food') || q.includes('eat') || q.includes('weight')) {
    return "🥗 Nutrition can support everyday wellness. Here's what I recommend:\n\n" +
      "1. **Follow the plate method**: ½ veggies, ¼ protein, ¼ whole grains\n" +
      "2. **Drink water before meals** — helps portion control\n" +
      "3. **Eat slowly** — it takes 20 min for your brain to feel full\n" +
      "4. **Prep healthy snacks**: nuts, fruits, yogurt\n\n" +
      "Small changes beat extreme diets every time! 🎯\n\n" +
      "*VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.*";
  }

  if (q.includes('exercise') || q.includes('workout') || q.includes('gym') || q.includes('walk')) {
    return "🏃 Movement is a strong wellness habit. Here's your action plan:\n\n" +
      "1. **Start with 10 min walks** after meals — reduces blood sugar spikes by 12%\n" +
      "2. **Aim for 150 min/week** of moderate activity\n" +
      "3. **Include strength training** 2-3x per week\n" +
      "4. **Take stairs** over elevators whenever possible\n\n" +
      "Every step counts toward your wellness goals! 🏆\n\n" +
      "*VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.*";
  }

  return "👋 Hi! I'm your VitalIQ Health Coach. I'm here to help you with:\n\n" +
    "• 🌙 **Sleep** — Tips for better rest\n" +
    "• 🧘 **Stress** — Relaxation techniques\n" +
    "• 🥗 **Nutrition** — Healthy eating advice\n" +
    "• 🏃 **Exercise** — Activity recommendations\n" +
    "• 📊 **Your Data** — Understanding your health scores\n\n" +
    "Ask me anything about wellness trends and healthier habits. " +
    "VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.";
}

module.exports = new GeminiService();
