import {
  TRANSCODING_COMPLETE,
  TRANSCODING_START,
  UPLOAD_ARTWORK,
  UPLOAD_AUDIO_PROGRESS
} from '../actions/types';
import {
  toastError,
  toastInfo,
  toastSuccess,
  transcodeAudio
} from '../actions/index';
import io from 'socket.io-client';
const socket = io();

socket.on('connect', () => {
  // console.log('[Socket] Connected.');
});

const socketMiddleware = store => {
  const { dispatch, getState } = store;

  socket.on('error', message => toastError(message)(dispatch));

  socket.on('encodeFLAC', data => {
    const { releaseId, trackId, trackName } = data;
    dispatch({ type: UPLOAD_AUDIO_PROGRESS, trackId, percent: 0 });
    toastSuccess(`Upload complete for ${trackName}!`)(dispatch);
    transcodeAudio(releaseId, trackId, trackName)(dispatch);
  });

  socket.on('transcodeAAC', data => {
    const { trackId, trackName } = data;
    toastSuccess(`Transcoding ${trackName} to aac complete.`)(dispatch);
    dispatch({
      type: TRANSCODING_COMPLETE,
      trackId
    });
  });

  socket.on('uploadArtwork', data => {
    const state = getState();
    const userId = state.user._id;
    if (data.userId === userId) {
      dispatch({
        type: UPLOAD_ARTWORK,
        payload: false
      });
      toastSuccess('Artwork uploaded.')(dispatch);
    }
  });

  socket.on('workerMessage', data => {
    const state = getState();
    const userId = state.user._id;
    if (data.clientId || (data.userId && data.userId === userId)) {
      toastInfo(data.message)(dispatch);
    }
  });

  return next => action => {
    if (action.type === TRANSCODING_START) {
      socket.emit('transcode', action.payload);
    }

    return next(action);
  };
};

export default socketMiddleware;
