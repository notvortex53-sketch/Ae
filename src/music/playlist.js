const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DATA_DIR, 'playlists.json');

function _load() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}', 'utf8');
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function _save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getPlaylist(userId) {
  return _load()[userId] || [];
}

function addSong(userId, song) {
  const data = _load();
  if (!data[userId]) data[userId] = [];
  data[userId].push(song);
  _save(data);
  return data[userId];
}

function removeSong(userId, index) {
  const data = _load();
  if (!data[userId] || index < 0 || index >= data[userId].length) return null;
  const removed = data[userId].splice(index, 1)[0];
  _save(data);
  return removed;
}

function clearPlaylist(userId) {
  const data = _load();
  data[userId] = [];
  _save(data);
}

module.exports = { getPlaylist, addSong, removeSong, clearPlaylist };
