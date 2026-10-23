const { hasWakeWord, stripWakeWord } = require('../wakeWord');
const { chat } = require('../groq');
const { handleAutomod } = require('../automod');
const { handlePlay } = require('../music/playHelper');
const { getPlayer } = require('../music/player');
const { addSong, getPlaylist } = require('../music/playlist');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');

// Music wake-word patterns
const MUSIC_PATTERNS = [
  { re: /^play\s+(.+)/i,   action: 'play'    },
  { re: /^skip$/i,         action: 'skip'    },
  { re: /^stop$/i,         action: 'stop'    },
  { re: /^pause$/i,        action: 'pause'   },
  { re: /^resume$/i,       action: 'resume'  },
  { re: /^queue$/i,        action: 'queue'   },
  { re: /^songlist\s+(.+)/i, action: 'songlist-add' },
  { re: /^songlist$/i,     action: 'songlist-view'  },
];

async function handleMusicAction(action, match, message) {
  const player = getPlayer(message.guild.id);
  const userId = message.author.id;

  switch (action) {
    case 'play': {
      const query = match[1].trim();
      const member = await message.guild.members.fetch(userId);
      const reply = await handlePlay(query, member, message.channel);
      return message.reply(reply);
    }

    case 'skip': {
      if (!player.currentSong) return message.reply(`⏭️ Nothing is playing right now.`);
      const title = player.currentSong.title;
      player.skip();
      return message.reply(`⏭️ Skipped **${title}**.`);
    }

    case 'stop': {
      player.stop();
      return message.reply(`⏹️ Stopped music and left the voice channel!`);
    }

    case 'pause': {
      const st = player.getStatus();
      if (st === AudioPlayerStatus.Playing) {
        player.pause();
        return message.reply(`⏸️ Paused. Say \`Ae resume\` to continue.`);
      } else if (st === AudioPlayerStatus.Paused) {
        player.resume();
        return message.reply(`▶️ Resumed!`);
      }
      return message.reply(`Nothing is playing right now.`);
    }

    case 'resume': {
      player.resume();
      return message.reply(`▶️ Resumed!`);
    }

    case 'queue': {
      const current = player.currentSong;
      const queue = player.getQueue();
      if (!current && !queue.length) return message.reply(`📋 The queue is empty!`);

      const embed = new EmbedBuilder().setColor(0x1db954).setTitle(`🎵 Music Queue`);
      if (current) embed.addFields({ name: '▶️ Now Playing', value: `**${current.title}**` });
      if (queue.length) {
        embed.addFields({
          name: `📋 Up Next`,
          value: queue.slice(0, 8).map((s, i) => `\`${i + 1}.\` ${s.title}`).join('\n'),
        });
      }
      return message.reply({ embeds: [embed] });
    }

    case 'songlist-add': {
      const song = match[1].trim();
      const list = addSong(userId, song);
      return message.reply(`✅ Added **${song}** to your playlist! You now have **${list.length}** song${list.length > 1 ? 's' : ''}.`);
    }

    case 'songlist-view': {
      const list = getPlaylist(userId);
      if (!list.length) return message.reply(`Your playlist is empty! Try: \`Ae songlist <song name>\``);
      const embed = new EmbedBuilder()
        .setColor(0x7289da)
        .setTitle(`🎵 ${message.author.username}'s Playlist`)
        .setDescription(list.map((s, i) => `\`${i + 1}.\` ${s}`).join('\n'));
      return message.reply({ embeds: [embed] });
    }
  }
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const content = message.content;
    const userId = message.author.id;

    // ── Automod (bad words + spam → logs to mod log channel) ─────────────
    const actioned = await handleAutomod(message);
    if (actioned) return;

    // ── Wake word / mention check ─────────────────────────────────────────
    const isMentioned = message.mentions.has(client.user);
    const triggered = isMentioned || hasWakeWord(content);
    if (!triggered) return;

    // Strip wake word / mention to get the clean query
    let query = content
      .replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
      .trim();
    query = stripWakeWord(query);

    if (!query) return message.reply(`Hey! 👋 What can I do for you?`);

    // ── Music wake-word router (checked before sending to Groq) ──────────
    for (const { re, action } of MUSIC_PATTERNS) {
      const m = query.match(re);
      if (m) {
        await message.channel.sendTyping();
        return handleMusicAction(action, m, message);
      }
    }

    // ── Fall through to Groq AI chat ─────────────────────────────────────
    await message.channel.sendTyping();
    try {
      const { chat } = require('../groq');
      const reply = await chat(userId, query);
      if (reply.length > 1900) {
        const chunks = reply.match(/.{1,1900}/gs) || [reply];
        for (const chunk of chunks) await message.reply(chunk);
      } else {
        await message.reply(reply);
      }
    } catch (err) {
      console.error('[Groq Error]', err);
      await message.reply(`Hmm, I hit a snag. Try again in a sec! 🧠`);
    }
  },
};
