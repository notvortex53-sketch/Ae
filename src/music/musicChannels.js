const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '..', '..', 'config');
const FILE = path.join(CONFIG_DIR, 'musicChannels.json');

function _load() {
  try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}', 'utf8');
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function _save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getMusicChannel(guildId) {
  return _load()[guildId] || null;
}

function setMusicChannel(guildId, channelId) {
  const data = _load();
  data[guildId] = channelId;
  _save(data);
}

module.exports = { getMusicChannel, setMusicChannel };
