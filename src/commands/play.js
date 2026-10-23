const { SlashCommandBuilder } = require('discord.js');
const { handlePlay } = require('../music/playHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song in the music voice channel')
    .addStringOption(opt =>
      opt.setName('song')
         .setDescription('Song name or YouTube URL')
         .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString('song');
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const reply = await handlePlay(query, member, interaction.channel);
    await interaction.editReply(reply);
  },
};
