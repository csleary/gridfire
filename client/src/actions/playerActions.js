import { PLAYER_HIDE, PLAYER_PAUSE, PLAYER_PLAY, PLAYER_STOP } from './types';

export const playerHide = () => dispatch => {
  dispatch({
    type: PLAYER_HIDE,
    payload: {
      isPlaying: false,
      isPaused: false,
      showPlayer: false
    }
  });
};

export const playerPause = () => dispatch => {
  dispatch({
    type: PLAYER_PAUSE
  });
};

export const playerPlay = () => dispatch => {
  dispatch({
    type: PLAYER_PLAY
  });
};

export const playerStop = () => dispatch => {
  dispatch({
    type: PLAYER_STOP
  });
};
