import { createSlice } from "@reduxjs/toolkit";

const playerSlice = createSlice({
  name: "player",
  initialState: {
    artistName: "",
    isPlaying: false,
    isPaused: false,
    playList: [],
    releaseId: "",
    showPlayer: false,
    trackId: "",
    trackTitle: ""
  },
  reducers: {
    addToPlayList(state, action) {
      state.playList = [...state.playList, action.payload];
    },
    loadTrack(state, action) {
      const { artistName, releaseId, releaseTitle, trackId, trackTitle } = action.payload;
      state.showPlayer = true;
      state.artistName = artistName;
      state.releaseId = releaseId;
      state.releaseTitle = releaseTitle;
      state.trackId = trackId;
      state.trackTitle = trackTitle;
    },
    removeFromPlayList(state, action) {
      state.playList = state.playList.filter(({ releaseId }) => releaseId !== action.payload);
    },
    playerHide(state) {
      state.isPlaying = false; // Required to avoid showing pause icon when player is hidden.
      state.isPaused = false; // As above.
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
    }
  }
});

export const { loadTrack, playerHide, playerPause, playerPlay } = playerSlice.actions;
export default playerSlice.reducer;
