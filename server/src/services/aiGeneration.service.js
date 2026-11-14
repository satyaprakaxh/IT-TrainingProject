const { InferenceClient } = require("@huggingface/inference");
const prisma = require('../config/db');

const client = new InferenceClient(process.env.HF_TOKEN);

const AI_MODEL = 'meta-llama/Llama-3.2-3B:featherless-ai';

/**
 * Throws an object with { statusCode, message } for the controller to map to HTTP.
 */
function error(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Calls the Hugging Face Inference API with the given prompt.
 * Returns the raw text response from the model.
 * Throws on failure so callers can fall back or handle errors.
 */
async function generateAIResponse(prompt, maxTokens = 1000) {
  if (!process.env.HF_TOKEN) {
    throw error(500, 'AI provider not configured: HF_TOKEN is missing');
  }

  try {
    const completion = await client.chatCompletion({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert AI Learning Architect. You generate personalized courses and learning paths for students based on their skill gaps. Always respond with valid JSON only unless instructed otherwise.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    });

    const reply = completion.choices?.[0]?.message?.content;
    if (!reply || !reply.trim()) {
      throw error(500, 'AI returned an empty response');
    }

    return reply.trim();
  } catch (err) {
    console.error('AI generation error:', err.message);
    throw error(500, `AI generation failed: ${err.message}`);
  }
}

/**
 * Extracts a JSON object from a text block that may contain markdown fences
 * or surrounding prose. Returns the parsed object or null if invalid.
 */
function extractJson(text) {
  if (!text) return null;

  // Remove markdown code fences
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/gi, '')
    .replace(/```/g, '')
    .trim();

  // Try to find the first { ... } block
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;

  const jsonStr = cleaned.substring(start, end + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    // Attempt to fix common issues: trailing commas, unquoted keys
    const fixed = jsonStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*\]/g, ']');
    try {
      return JSON.parse(fixed);
    } catch (err2) {
      return null;
    }
  }
}

module.exports = {
  generateAIResponse,
  extractJson,
  AI_MODEL,
  error
};
