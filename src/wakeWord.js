// Wake-word regex: matches "ae " or "aether" at start or anywhere (case insensitive)
const WAKE_WORD_RE = /\b(ae\s|aether)\b/i;

function hasWakeWord(content) {
  return WAKE_WORD_RE.test(content);
}

// Strip the wake word from the front so Groq only gets the real query
function stripWakeWord(content) {
  return content.replace(/^\s*(ae\s+|aether\s*)/i, '').trim();
}

module.exports = { hasWakeWord, stripWakeWord };
