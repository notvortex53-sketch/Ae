const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlaylist, addSong, removeSong, clearPlaylist } = require('../music/playlist');
const { handlePlay } = require('../music/playHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Manage your personal playlist')
    .addSubcommand(sub =>
      sub.setName('add')
         .setDescription('Add a song to your playlist')
         .addStringOption(opt =>
           opt.setName('song').setDescription('Song name').setRequired(true)
         )
    )
    .addSubcommand(sub =>
      sub.setName('view')
         .setDescription('View your playlist')
    )
    .addSubcommand(sub =>
      sub.setName('remove')
         .setDescription('Remove a song by its number')
         .addIntegerOption(opt =>
           opt.setName('number').setDescription('Song number from /playlist view').setRequired(true).setMinValue(1)
         )
    )
    .addSubcommand(sub =>
      sub.setName('play')
         .setDescription('Queue all songs from your playlist')
    )
    .addSubcommand(sub =>
      sub.setName('clear')
         .setDescription('Clear your entire playlist')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === 'add') {
      const song = interaction.options.getString('song');
      const list = addSong(userId, song);
      await interaction.reply({
        content: `✅ Added **${song}** to your playlist! You now have **${list.length}** song${list.length > 1 ? 's' : ''}.`,
        ephemeral: true,
      });

    } else if (sub === 'view') {
      const list = getPlaylist(userId);
      if (!list.length) {
        return interaction.reply({ content: `Your playlist is empty! Use \`/playlist add\` or say \`Ae songlist <song>\` to add songs.`, ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setColor(0x7289da)
        .setTitle(`🎵 ${interaction.user.username}'s Playlist`)
        .setDescription(list.map((s, i) => `\`${i + 1}.\` ${s}`).join('\n'));
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (sub === 'remove') {
      const idx = interaction.options.getInteger('number') - 1;
      const removed = removeSong(userId, idx);
      if (!removed) {
        return interaction.reply({ content: `❌ No song at that number. Use \`/playlist view\` to check.`, ephemeral: true });
      }
      await interaction.reply({ content: `🗑️ Removed **${removed}** from your playlist.`, ephemeral: true });

    } else if (sub === 'play') {
      const list = getPlaylist(userId);
      if (!list.length) {
        return interaction.reply({ content: `Your playlist is empty!`, ephemeral: true });
      }
      await interaction.deferReply();
      const member = await interaction.guild.members.fetch(userId);
      // Queue first song normally (handles VC join + move)
      const firstReply = await handlePlay(list[0], member, interaction.channel);
      // Queue the rest silently
      const { getPlayer } = require('../music/player');
      const player = getPlayer(interaction.guild.id);
      for (let i = 1; i < list.length; i++) {
        await player.enqueue(list[i], userId);
      }
      await interaction.editReply(`${firstReply}\n📋 Queued **${list.length}** songs from your playlist.`);

    } else if (sub === 'clear') {
      clearPlaylist(userId);
      await interaction.reply({ content: `🗑️ Your playlist has been cleared.`, ephemeral: true });
    }
  },
};
