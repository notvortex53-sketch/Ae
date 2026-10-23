const { SlashCommandBuilder } = require('discord.js');
const { getPlayer } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),

  async execute(interaction) {
    const player = getPlayer(interaction.guild.id);
    if (!player.currentSong) {
      return interaction.reply({ content: `⏭️ Nothing is playing right now.`, ephemeral: true });
    }
    const skipped = player.currentSong.title;
    player.skip();
    await interaction.reply(`⏭️ Skipped **${skipped}**.`);
  },
};
