import { ReleaseTrack } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

interface PlaylistTrack extends ReleaseTrack {
  releaseId: string;
}

interface PlayerState {
  artistName: string;
  isPlaying: boolean;
  isPaused: boolean;
  playList: PlaylistTrack[];
  releaseId: string;
  releaseTitle: string;
  showPlayer: boolean;
  trackId: string;
  trackTitle: string;
}

const initialState: PlayerState = {
  artistName: "",
  isPlaying: false,
  isPaused: false,
  playList: [],
  releaseId: "",
  releaseTitle: "",
  showPlayer: false,
  trackId: "",
  trackTitle: ""
};

const playerSlice = createSlice({
  name: "player",
  initialState,
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
    }
  }
});

export const { loadTrack, playerHide, playerPause, playerPlay, playerStop } = playerSlice.actions;
export default playerSlice.reducer;
