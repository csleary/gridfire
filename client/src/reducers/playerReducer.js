import {
  PLAY_TRACK,
  PLAYER_PAUSE,
  PLAYER_PLAY,
  PLAYER_HIDE
} from '../actions/types';

const initialState = {
  audio: '',
  isPlaying: false,
  showPlayer: false
};

export default (state = initialState, action) => {
  switch (action.type) {
    case PLAY_TRACK:
      return {
        ...state,
        isPlaying: true,
        showPlayer: true,
        audio: action.payload.audio,
        artistName: action.payload.artistName,
        albumId: action.payload.albumId,
        trackTitle: action.payload.trackTitle
      };
    case PLAYER_PLAY:
      return {
        ...state,
        ...action.payload
      };
    case PLAYER_PAUSE:
      return {
        ...state,
        ...action.payload
      };
    case PLAYER_HIDE:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
};
