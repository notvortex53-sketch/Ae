const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setModlogChannel } = require('../automod');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmodlog')
    .setDescription('Set the channel where Aether sends automod reports (admin only)')
    .addChannelOption(opt =>
      opt.setName('channel')
         .setDescription('The text channel to use as mod log')
         .addChannelTypes(ChannelType.GuildText)
         .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    setModlogChannel(interaction.guild.id, channel.id);
    await interaction.reply({
      content: `✅ Mod log set to <#${channel.id}>. All automod actions will be reported there.`,
      ephemeral: true,
    });
  },
};
