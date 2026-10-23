const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('See what Aether can do'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle(`✨ Aether — Help`)
      .setDescription(`I'm your friendly AI + music bot!\nSay **"Ae"** or **"Aether"** anywhere to wake me, or @mention me.`)
      .addFields(
        {
          name: '💬 AI Chat (wake words)',
          value: '`Ae <anything>` — ask me anything, I\'ll reply with AI',
        },
        {
          name: '🎵 Music (wake words)',
          value: [
            '`Ae play <song>` — play a song',
            '`Ae skip` — skip current song',
            '`Ae stop` — stop & disconnect',
            '`Ae pause` / `Ae resume` — pause/resume',
            '`Ae queue` — show queue',
            '`Ae songlist <song>` — add to your playlist',
            '`Ae songlist` — view your playlist',
          ].join('\n'),
        },
        {
          name: '⚡ Slash Commands',
          value: [
            '`/ask` `/reset` `/ping` `/info` `/userinfo` `/help`',
            '`/play` `/skip` `/stop` `/pause` `/queue`',
            '`/playlist add|view|remove|play|clear`',
            '`/setmusicchannel` *(admin only)*',
          ].join('\n'),
        },
        {
          name: '🛡️ Automod',
          value: [
            'Auto-detects profanity + leet-speak (e.g. `f4ck`, `$hit`)',
            'Deletes the message + warns the user in-channel',
            'Logs every action to your mod log channel',
            '`/setmodlog #channel` *(admin)* — set the mod log',
            '`/setmusicchannel #vc` *(admin)* — set music VC',
            'Add custom words via `BANNED_WORDS` in your env',
          ].join('\n'),
        }
      )
      .setFooter({ text: 'Aether • Groq AI + Music' });

    await interaction.reply({ embeds: [embed] });
  },
};
