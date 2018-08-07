import {
  PLAY_TRACK,
  PLAYER_HIDE,
  PLAYER_PAUSE,
  PLAYER_PLAY,
  PLAYER_STOP
} from '../actions/types';

const initialState = {
  audio: '',
  isPlaying: false,
  isPaused: false,
  releaseId: '',
  trackId: '',
  showPlayer: false
};

export default (state = initialState, action) => {
  const { type } = action;
  switch (type) {
    case PLAY_TRACK:
      return {
        ...state,
        isPlaying: true,
        showPlayer: true,
        audio: action.payload.audio,
        artistName: action.payload.artistName,
        releaseId: action.payload.releaseId,
        trackId: action.payload.trackId,
        trackTitle: action.payload.trackTitle
      };
    case PLAYER_HIDE:
      return {
        ...state,
        isPlaying: false,
        isPaused: false,
        showPlayer: false
      };
    case PLAYER_PLAY:
      return {
        ...state,
        isPlaying: true,
        isPaused: false,
        showPlayer: true
      };
    case PLAYER_PAUSE:
      return {
        ...state,
        isPlaying: false,
        isPaused: true
      };
    case PLAYER_STOP:
      return {
        ...state,
        isPlaying: false,
        isPaused: false
      };
    default:
      return state;
  }
};
