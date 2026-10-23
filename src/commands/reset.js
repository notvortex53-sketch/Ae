const { SlashCommandBuilder } = require('discord.js');
const { clearMemory } = require('../groq');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Clear your conversation memory with Aether'),

  async execute(interaction) {
    clearMemory(interaction.user.id);
    await interaction.reply({
      content: `🧹 Done! I've wiped our conversation history. Fresh start!`,
      ephemeral: true,
    });
  },
};
