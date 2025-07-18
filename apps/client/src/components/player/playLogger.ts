import axios from "axios";

class PlayLogger {
  #hasLoggedPlay;
  #minDuration;
  #startTime;
  #totalTimePlayed;
  #trackId;

  constructor(trackId: string = "") {
    this.#hasLoggedPlay = false;
    this.#minDuration = 1000 * 30;
    this.#startTime = 0;
    this.#totalTimePlayed = 0;
    this.#trackId = trackId;
  }

  checkPlayTime() {
    if (
      this.#hasLoggedPlay === false &&
      this.#startTime !== 0 &&
      this.#totalTimePlayed + Date.now() - this.#startTime > this.#minDuration
    ) {
      this.#hasLoggedPlay = true;
      axios.post(`/api/track/${this.#trackId}/2`);
    }
  }

  setStartTime() {
    if (this.#trackId && this.#startTime === 0) {
      this.#startTime = Date.now();
      axios.post(`/api/track/${this.#trackId}/0`);
    }
  }

  updatePlayTime() {
    if (!this.#trackId) return;
    this.#totalTimePlayed += Date.now() - this.#startTime;
    this.#startTime = 0;
    axios.post(`/api/track/${this.#trackId}/1`);
  }
}

export default PlayLogger;
