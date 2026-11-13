
const { GoogleGenAI } = require("@google/genai");

const chatWithAI = async (req, res) => {
  try {
    const { question } = req.body;

    // Check question
    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid question.",
      });
    }

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is missing from the backend.",
      });
    }

    // Initialize Gemini
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Generate AI response
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: question.trim(),
    });

    return res.status(200).json({
      success: true,
      reply: response.text,
    });

  } catch (error) {
    console.error("AI Chat Error:", error);

    return res.status(500).json({
      success: false,
      message: "AI could not generate a response. Please try again.",
    });
  }
};

module.exports = { chatWithAI };
