const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');
const playdl = require('play-dl');

// One MusicPlayer per guild
const players = new Map();

class MusicPlayer {
  constructor(guildId) {
    this.guildId = guildId;
    this.queue = [];          // { title, url, requestedBy }
    this.currentSong = null;
    this.connection = null;
    this.audioPlayer = createAudioPlayer();
    this.textChannel = null;  // channel to send now-playing messages

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.currentSong = null;
      this._playNext();
    });

    this.audioPlayer.on('error', err => {
      console.error(`[Player:${guildId}] Audio error:`, err.message);
      this.currentSong = null;
      this._playNext();
    });
  }

  async connect(voiceChannel) {
    if (this.connection) {
      // Already connected — move to the right channel if needed
      if (this.connection.joinConfig.channelId !== voiceChannel.id) {
        this.connection.destroy();
        this.connection = null;
      } else {
        return; // already in the right channel
      }
    }

    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    this.connection.subscribe(this.audioPlayer);

    // Handle unexpected disconnects
    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.connection.destroy();
        this.connection = null;
        players.delete(this.guildId);
      }
    });
  }

  async enqueue(query, requestedBy) {
    // Try as URL first, otherwise search YouTube
    let songInfo;
    try {
      const urlType = await playdl.validate(query);
      if (urlType && urlType !== 'search') {
        const info = await playdl.video_info(query);
        songInfo = { title: info.video_details.title, url: info.video_details.url };
      } else {
        const results = await playdl.search(query, { limit: 1 });
        if (!results.length) return null;
        songInfo = { title: results[0].title, url: results[0].url };
      }
    } catch {
      const results = await playdl.search(query, { limit: 1 });
      if (!results.length) return null;
      songInfo = { title: results[0].title, url: results[0].url };
    }

    const song = { ...songInfo, requestedBy };
    this.queue.push(song);

    if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      await this._playNext();
    }

    return song;
  }

  async _playNext() {
    if (!this.queue.length || !this.connection) return;

    this.currentSong = this.queue.shift();

    try {
      const stream = await playdl.stream(this.currentSong.url, { quality: 2 });
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });
      this.audioPlayer.play(resource);

      if (this.textChannel) {
        this.textChannel.send(
          `🎵 Now playing: **${this.currentSong.title}** (requested by <@${this.currentSong.requestedBy}>)`
        ).catch(() => {});
      }
    } catch (err) {
      console.error(`[Player] Stream error for "${this.currentSong.title}":`, err.message);
      if (this.textChannel) {
        this.textChannel.send(`⚠️ Couldn't stream **${this.currentSong.title}**. Skipping...`).catch(() => {});
      }
      await this._playNext();
    }
  }

  skip() {
    this.audioPlayer.stop(true); // triggers Idle → _playNext
  }

  stop() {
    this.queue = [];
    this.currentSong = null;
    this.audioPlayer.stop(true);
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
    players.delete(this.guildId);
  }

  pause() {
    return this.audioPlayer.pause();
  }

  resume() {
    return this.audioPlayer.unpause();
  }

  getStatus() {
    return this.audioPlayer.state.status;
  }

  getQueue() {
    return this.queue;
  }
}

function getPlayer(guildId) {
  if (!players.has(guildId)) {
    players.set(guildId, new MusicPlayer(guildId));
  }
  return players.get(guildId);
}

module.exports = { getPlayer };
