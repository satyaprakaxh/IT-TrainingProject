const { OpenAI } = require("openai");

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN
});

const chatWithAI = async (req, res) => {
  try {
    const { question } = req.body;

    // Check question
    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid question."
      });
    }

    // Check API key
    if (!process.env.HF_TOKEN) {
      return res.status(500).json({
        success: false,
        message: "Hugging Face API key is missing from the backend."
      });
    }

    // Generate AI response via Hugging Face router (Llama-3.2)
    const chatCompletion = await client.chat.completions.create({
      model: "meta-llama/Llama-3.2-3B-Instruct:featherless-ai",
      messages: [{ role: "user", content: question.trim() }]
    });

    const reply = chatCompletion.choices[0].message.content;

    return res.status(200).json({
      success: true,
      reply
    });

  } catch (error) {
    console.error("AI Chat Error:", error);

    return res.status(500).json({
      success: false,
      message: "AI could not generate a response. Please try again."
    });
  }
};

module.exports = { chatWithAI };
