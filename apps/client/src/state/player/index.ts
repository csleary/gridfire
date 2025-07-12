import { ReleaseTrack } from "@gridfire/shared/types";
import { createSlice } from "@reduxjs/toolkit";

interface PlayerState {
  artistName: string;
  isInitialised: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  playList: PlaylistTrack[];
  releaseId: string;
  releaseTitle: string;
  showPlayer: boolean;
  trackId: string;
  trackTitle: string;
}

interface PlaylistTrack extends ReleaseTrack {
  releaseId: string;
}

const initialState: PlayerState = {
  artistName: "",
  isInitialised: false,
  isPaused: false,
  isPlaying: false,
  playList: [],
  releaseId: "",
  releaseTitle: "",
  showPlayer: false,
  trackId: "",
  trackTitle: ""
};

const playerSlice = createSlice({
  initialState,
  name: "player",
  reducers: {
    addToPlayList(state, action) {
      state.playList.push(action.payload);
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
    removeFromPlayList(state, action) {
      state.playList = state.playList.filter(({ releaseId }) => releaseId !== action.payload);
    },
    setIsInitialised(state, action) {
      state.isInitialised = action.payload;
    }
  }
});

export type { PlayerState };
export const { loadTrack, playerHide, playerPause, playerPlay, playerStop, setIsInitialised } = playerSlice.actions;
export default playerSlice.reducer;
