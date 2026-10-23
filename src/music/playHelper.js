const { getMusicChannel } = require('./musicChannels');
const { getPlayer } = require('./player');

/**
 * Shared logic for both wake-word and /play slash command.
 * @param {string} query         - Song name or URL
 * @param {GuildMember} member   - The Discord member requesting the song
 * @param {TextChannel} textChannel - Where to send status messages
 * @returns {Promise<string>}    - Reply message
 */
async function handlePlay(query, member, textChannel) {
  const guildId = member.guild.id;

  // 1. Check if a music VC is assigned
  const assignedChannelId = getMusicChannel(guildId);
  if (!assignedChannelId) {
    return `❌ No music channel set for this server. Ask an admin to run \`/setmusicchannel\` first.`;
  }

  const musicVC = member.guild.channels.cache.get(assignedChannelId);
  if (!musicVC) {
    return `❌ The assigned music channel no longer exists. Ask an admin to run \`/setmusicchannel\` again.`;
  }

  // 2. User must be in SOME voice channel first (Discord won't let the bot move them otherwise)
  if (!member.voice.channelId) {
    return `🎙️ Join any voice channel first and I'll move you to **${musicVC.name}** to start playing!`;
  }

  // 3. Move user to the music VC if they're somewhere else
  if (member.voice.channelId !== assignedChannelId) {
    try {
      await member.voice.setChannel(musicVC);
    } catch {
      return `⚠️ I need the **Move Members** permission to move you to **${musicVC.name}**. Please join it manually and try again.`;
    }
  }

  // 4. Connect bot and enqueue
  const player = getPlayer(guildId);
  player.textChannel = textChannel;
  await player.connect(musicVC);

  const song = await player.enqueue(query, member.id);
  if (!song) {
    return `🔍 Couldn't find anything for **${query}**. Try a different search!`;
  }

  const queuePos = player.getQueue().length;
  if (queuePos === 0) {
    // Song is already playing (was dequeued inside enqueue → _playNext)
    return `▶️ Playing **${song.title}** in **${musicVC.name}**!`;
  }
  return `📋 Added to queue (#${queuePos + 1}): **${song.title}**`;
}

module.exports = { handlePlay };
