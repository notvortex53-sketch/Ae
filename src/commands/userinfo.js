const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show info about a user')
    .addUserOption(opt =>
      opt.setName('user')
         .setDescription('User to look up (defaults to you)')
         .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    const roles = member
      ? member.roles.cache
          .filter(r => r.id !== interaction.guild.id)
          .map(r => r.toString())
          .join(', ') || 'None'
      : 'N/A';

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || 0x7289da)
      .setTitle(target.tag)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🆔 ID', value: target.id, inline: true },
        { name: '📅 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`, inline: true },
        member
          ? { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true }
          : { name: '📥 Joined Server', value: 'N/A', inline: true },
        { name: '🤖 Bot?', value: target.bot ? 'Yes' : 'No', inline: true },
        { name: '🎭 Roles', value: roles.length > 1024 ? roles.slice(0, 1020) + '…' : roles },
      )
      .setFooter({ text: 'Aether userinfo' });

    await interaction.reply({ embeds: [embed] });
  },
};
