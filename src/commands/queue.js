const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current music queue'),

  async execute(interaction) {
    const player = getPlayer(interaction.guild.id);
    const current = player.currentSong;
    const queue = player.getQueue();

    if (!current && !queue.length) {
      return interaction.reply({ content: `📋 The queue is empty!`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setTitle(`🎵 Music Queue`);

    if (current) {
      embed.addFields({ name: '▶️ Now Playing', value: `**${current.title}** — <@${current.requestedBy}>` });
    }

    if (queue.length) {
      const upNext = queue
        .slice(0, 10)
        .map((s, i) => `\`${i + 1}.\` ${s.title} — <@${s.requestedBy}>`)
        .join('\n');
      embed.addFields({ name: `📋 Up Next (${queue.length} song${queue.length > 1 ? 's' : ''})`, value: upNext });
      if (queue.length > 10) {
        embed.setFooter({ text: `...and ${queue.length - 10} more` });
      }
    }

    await interaction.reply({ embeds: [embed] });
  },
};
