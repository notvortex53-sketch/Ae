module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.user.setActivity(`Say "Ae" or "Aether" to chat!`, { type: 3 }); // WATCHING
  },
};
