const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Per-user conversation history: userId -> Message[]
const memory = new Map();

const SYSTEM_PROMPT = `You are ${process.env.BOT_NAME || 'Aether'}, a friendly, witty, and helpful AI assistant living inside a Discord server.
You speak casually and warmly — like a knowledgeable friend, not a formal assistant.
Keep replies concise and conversational (2-4 sentences unless asked for more).
You can use Discord markdown (**bold**, *italic*, \`code\`, etc.).
Never break character. Never say you are an LLM or mention Groq/Llama.
If you don't know something, admit it honestly and offer to help differently.`;

async function chat(userId, userMessage) {
  const limit = parseInt(process.env.MEMORY_LIMIT || '12');

  if (!memory.has(userId)) memory.set(userId, []);
  const history = memory.get(userId);

  history.push({ role: 'user', content: userMessage });

  // Trim to limit (pairs, so keep even numbers)
  while (history.length > limit) history.splice(0, 2);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
  ];

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages,
    max_tokens: 512,
    temperature: 0.85,
  });

  const reply = response.choices[0].message.content.trim();
  history.push({ role: 'assistant', content: reply });

  return reply;
}

function clearMemory(userId) {
  memory.delete(userId);
}

module.exports = { chat, clearMemory };
