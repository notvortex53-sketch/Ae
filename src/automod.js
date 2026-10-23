const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ── Built-in word list ────────────────────────────────────────────────────
// Common English profanity / slurs. Add more as needed.
const BUILTIN_BAD_WORDS = [
  'fuck', 'fucker', 'fucking', 'fuk', 'fvck',
  'shit', 'sh1t', 'sht',
  'bitch', 'b1tch', 'biatch',
  'asshole', 'ass hole', 'a$$hole',
  'bastard',
  'cunt',
  'dick', 'd1ck',
  'cock', 'c0ck',
  'pussy',
  'whore', 'wh0re',
  'slut',
  'nigger', 'nigga', 'n1gga',
  'faggot', 'fag',
  'retard', 'retarded',
  'rape', 'rapist',
];

// Custom words from .env (comma-separated, lowercase)
const CUSTOM_BANNED = (process.env.BANNED_WORDS || '')
  .split(',')
  .map(w => w.trim().toLowerCase())
  .filter(Boolean);

const ALL_BANNED = [...new Set([...BUILTIN_BAD_WORDS, ...CUSTOM_BANNED])];

// Leet-speak normaliser — turns 4→a, 3→e, 1→i/l, 0→o, 5→s, @→a
function normalise(str) {
  return str
    .toLowerCase()
    .replace(/4/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/0/g, 'o')
    .replace(/5/g, 's')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/[^a-z\s]/g, ''); // strip remaining non-alpha
}

/**
 * Returns the matched bad word if found, else null.
 */
function detectBadWord(content) {
  const normalised = normalise(content);
  for (const word of ALL_BANNED) {
    // Word boundary match (allow partial inside compound words)
    if (normalised.includes(normalise(word))) return word;
  }
  return null;
}

// ── Spam tracker ─────────────────────────────────────────────────────────
const spamMap = new Map(); // userId -> { count, resetAt }
const WINDOW_MS = 5000;

function isSpamming(userId) {
  const threshold = parseInt(process.env.SPAM_THRESHOLD || '5');
  const now = Date.now();

  if (!spamMap.has(userId)) {
    spamMap.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  const entry = spamMap.get(userId);
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + WINDOW_MS;
    return false;
  }
  entry.count++;
  return entry.count > threshold;
}

// ── Mod log channel config ────────────────────────────────────────────────
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const MODLOG_FILE = path.join(CONFIG_DIR, 'modlogChannels.json');

function _loadModlog() {
  try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    if (!fs.existsSync(MODLOG_FILE)) fs.writeFileSync(MODLOG_FILE, '{}', 'utf8');
    return JSON.parse(fs.readFileSync(MODLOG_FILE, 'utf8'));
  } catch { return {}; }
}

function setModlogChannel(guildId, channelId) {
  const data = _loadModlog();
  data[guildId] = channelId;
  fs.writeFileSync(MODLOG_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getModlogChannelId(guildId) {
  return _loadModlog()[guildId] || null;
}

// ── Send to mod log ───────────────────────────────────────────────────────
async function sendModLog(guild, embed) {
  const channelId = getModlogChannelId(guild.id);
  if (!channelId) return;
  try {
    const ch = await guild.channels.fetch(channelId);
    if (ch?.isTextBased()) await ch.send({ embeds: [embed] });
  } catch {}
}

function censorContent(content) {
  let out = content;
  for (const word of ALL_BANNED) {
    const re = new RegExp(word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi');
    out = out.replace(re, '*'.repeat(word.length));
  }
  return out.slice(0, 1000);
}

// ── Main automod handler ──────────────────────────────────────────────────
/**
 * Call this from messageCreate. Returns true if the message was actioned (caller should return).
 */
async function handleAutomod(message) {
  const { guild, author, channel, content } = message;

  // 1. Bad word detection
  const matched = detectBadWord(content);
  if (matched) {
    try { await message.delete(); } catch {}

    // Warn in channel (auto-deletes after 5s)
    const warn = await channel.send(
      `⚠️ <@${author.id}> That language isn't allowed here.`
    ).catch(() => null);
    if (warn) setTimeout(() => warn.delete().catch(() => {}), 5000);

    // Mod log embed
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🚫 Bad Word Detected')
      .setThumbnail(author.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User', value: `${author.tag} (<@${author.id}>)`, inline: true },
        { name: 'Channel', value: `<#${channel.id}>`, inline: true },
        { name: 'Matched Word', value: `||\`${matched}\`||`, inline: true },
        { name: 'Message (censored)', value: censorContent(content) || '*(empty)*' },
      )
      .setFooter({ text: `User ID: ${author.id}` })
      .setTimestamp();

    await sendModLog(guild, embed);
    return true;
  }

  // 2. Spam detection
  if (isSpamming(author.id)) {
    try {
      const member = await guild.members.fetch(author.id);
      if (member.moderatable) {
        await member.timeout(60_000, 'Spam — Aether automod');
        const warn = await channel.send(
          `🔇 <@${author.id}> Slow down! You've been muted for 60 seconds.`
        ).catch(() => null);
        if (warn) setTimeout(() => warn.delete().catch(() => {}), 8000);

        const embed = new EmbedBuilder()
          .setColor(0xf39c12)
          .setTitle('⚡ Spam Mute')
          .setThumbnail(author.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: 'User', value: `${author.tag} (<@${author.id}>)`, inline: true },
            { name: 'Channel', value: `<#${channel.id}>`, inline: true },
            { name: 'Duration', value: '60 seconds', inline: true },
            { name: 'Reason', value: `Exceeded spam threshold (${process.env.SPAM_THRESHOLD || 5} msgs / 5s)` },
          )
          .setFooter({ text: `User ID: ${author.id}` })
          .setTimestamp();

        await sendModLog(guild, embed);
      }
    } catch {}
    return true;
  }

  return false;
}

module.exports = { handleAutomod, setModlogChannel, getModlogChannelId, detectBadWord };
