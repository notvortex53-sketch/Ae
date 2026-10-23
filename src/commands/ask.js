const { SlashCommandBuilder } = require('discord.js');
const { chat } = require('../groq');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Aether anything')
    .addStringOption(opt =>
      opt.setName('question')
         .setDescription('What do you want to ask?')
         .setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    await interaction.deferReply();

    try {
      const reply = await chat(interaction.user.id, question);
      await interaction.editReply(reply);
    } catch (err) {
      console.error(err);
      await interaction.editReply(`Something went wrong. Try again later!`);
    }
  },
};
