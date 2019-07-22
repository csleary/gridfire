import {
  PLAYER_HIDE,
  PLAYER_PAUSE,
  PLAYER_PLAY,
  PLAYER_STOP,
  PLAY_TRACK
} from '../actions/types';

const initialState = {
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
      isPlaying: false,
      showPlayer: true,
      artistName: action.artistName,
      releaseId: action.releaseId,
      trackId: action.trackId,
      trackTitle: action.trackTitle
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
