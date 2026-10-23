const { SlashCommandBuilder } = require('discord.js');
const { getPlayer } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop music and disconnect Aether from the voice channel'),

  async execute(interaction) {
    const player = getPlayer(interaction.guild.id);
    player.stop();
    await interaction.reply(`⏹️ Stopped music and left the voice channel. See ya! 👋`);
  },
};
