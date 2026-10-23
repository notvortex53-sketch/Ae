const { SlashCommandBuilder } = require('discord.js');
const { getPlayer } = require('../music/player');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause or resume the current song'),

  async execute(interaction) {
    const player = getPlayer(interaction.guild.id);
    const status = player.getStatus();

    if (status === AudioPlayerStatus.Playing) {
      player.pause();
      await interaction.reply(`⏸️ Paused. Say \`/pause\` again or \`Ae resume\` to continue.`);
    } else if (status === AudioPlayerStatus.Paused) {
      player.resume();
      await interaction.reply(`▶️ Resumed!`);
    } else {
      await interaction.reply({ content: `Nothing is playing right now.`, ephemeral: true });
    }
  },
};
