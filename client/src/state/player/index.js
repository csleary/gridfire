import { createSlice } from "@reduxjs/toolkit";

const playerSlice = createSlice({
  name: "player",
  initialState: {
    artistName: "",
    isPlaying: false,
    isPaused: false,
    releaseId: "",
    showPlayer: false,
    trackId: "",
    trackTitle: ""
  },
  reducers: {
    playerHide(state) {
      state.isPlaying = false;
      state.isPaused = false;
      state.showPlayer = false;
    },

    playerPause(state) {
      state.isPlaying = false;
      state.isPaused = true;
    },

    playerPlay(state) {
      state.isPlaying = true;
      state.isPaused = false;
      state.showPlayer = true;
    },

    playerStop(state) {
      state.isPlaying = false;
      state.isPaused = false;
    },

    playTrack(state, action) {
      const { artistName, releaseId, releaseTitle, trackId, trackTitle } = action.payload;
      state.isPlaying = false;
      state.showPlayer = true;
      state.artistName = artistName;
      state.releaseId = releaseId;
      state.releaseTitle = releaseTitle;
      state.trackId = trackId;
      state.trackTitle = trackTitle;
    }
  }
});

export const { playerHide, playerPause, playerPlay, playerStop, playTrack } = playerSlice.actions;
export default playerSlice.reducer;
