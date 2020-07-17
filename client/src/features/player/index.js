import { createSlice } from '@reduxjs/toolkit';

const nemSlice = createSlice({
  name: 'player',
  initialState: {
    isPlaying: false,
    isPaused: false,
    releaseId: '',
    trackId: '',
    showPlayer: false
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
      state.isPlaying = false;
      state.showPlayer = true;
      state.artistName = action.payload.artistName;
      state.releaseId = action.payload.releaseId;
      state.trackId = action.payload.trackId;
      state.trackTitle = action.payload.trackTitle;
    }
  }
});

export const { playerHide, playerPause, playerPlay, playerStop, playTrack } = nemSlice.actions;
export default nemSlice.reducer;
