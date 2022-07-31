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
      axios.post(`/api/track/${this.#trackId}/0`);
      this.#startTime = Date.now();
    }
  }

  checkPlayTime() {
    if (
      this.#hasLoggedPlay === false &&
      this.#startTime != null &&
      this.#totalTimePlayed + Date.now() - this.#startTime > this.#minDuration
    ) {
      axios.post(`/api/track/${this.#trackId}/2`);
      this.#hasLoggedPlay = true;
    }
  }

  updatePlayTime() {
    this.#totalTimePlayed += Date.now() - this.#startTime;
    this.#startTime = null;
    axios.post(`/api/track/${this.#trackId}/1`);
  }
}

export default PlayLogger;
