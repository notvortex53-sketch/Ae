const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setMusicChannel } = require('../music/musicChannels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmusicchannel')
    .setDescription('Assign a voice channel for Aether to play music in (admin only)')
    .addChannelOption(opt =>
      opt.setName('channel')
         .setDescription('The voice channel to use for music')
         .addChannelTypes(ChannelType.GuildVoice)
         .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    setMusicChannel(interaction.guild.id, channel.id);
    await interaction.reply({
      content: `✅ Music channel set to **${channel.name}**! Users will be moved there when music plays.`,
      ephemeral: true,
    });
  },
};
