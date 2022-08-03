import axios from "axios";

class PlayLogger {
  #hasLoggedPlay;
  #minDuration;
  #startTime;
  #totalTimePlayed;
  #trackId;

  constructor(trackId) {
    this.#hasLoggedPlay = false;
    this.#minDuration = 1000 * 30;
    this.#totalTimePlayed = 0;
    this.#trackId = trackId;
  }

  setStartTime() {
    if (!this.#startTime) {
      this.#startTime = Date.now();
      axios.post(`/api/track/${this.#trackId}/0`);
    }
  }

  checkPlayTime() {
    if (
      this.#hasLoggedPlay === false &&
      this.#startTime !== null &&
      this.#totalTimePlayed + Date.now() - this.#startTime > this.#minDuration
    ) {
      this.#hasLoggedPlay = true;
      axios.post(`/api/track/${this.#trackId}/2`);
    }
  }

  updatePlayTime() {
    this.#totalTimePlayed += Date.now() - this.#startTime;
    this.#startTime = null;
    axios.post(`/api/track/${this.#trackId}/1`);
  }
}

export default PlayLogger;
