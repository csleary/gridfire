import { setFormatExists, updateActiveRelease } from 'features/releases';
import { setTranscodingComplete, setUploadProgress } from 'features/tracks';
import { toastError, toastInfo, toastSuccess, toastWarning } from 'features/toast';
import { batch } from 'react-redux';
import io from 'socket.io-client';
import { setArtworkUploading } from 'features/artwork';

let socket;
if (process.env.REACT_APP_NODE_ENV === 'development') {
  socket = io('http://localhost:8083', { path: '/socket.io' });
} else {
  socket = io();
}

const socketMiddleware = ({ dispatch, getState }) => {
  socket.on('connect', () => {
    console.log('[Socket.io] Connected.');
    const userId = getState().user.userId;
    if (userId) socket.emit('subscribeUser', { userId });
  });

  socket.on('connect_error', error => console.error(error.message));
  socket.on('connect_timeout', () => console.error('[Socket.io] Connection attempt timed out.'));
  socket.on('reconnect_attempt', () => console.error('[Socket.io] Attempting to reconnect…'));
  socket.on('reconnect', retries => console.error(`[Socket.io] Reconnected. Attempt ${retries}.`));
  socket.on('reconnect_error', error => console.error(`[Socket.io] Could not reconnect: ${error.message}.`));
  socket.on('reconnect_failed', () => console.error('[Socket.io] Could not reconnect.'));
  socket.on('disconnect', () => console.log('[Socket.io] Server disconnected!'));
  socket.on('error', error => dispatch(toastError(error.message)));

  socket.on('artworkUploaded', () => {
    batch(() => {
      dispatch(setArtworkUploading(false));
      dispatch(toastSuccess('Artwork uploaded.'));
    });
  });

  socket.on('EncodingCompleteFLAC', ({ trackId, trackName }) => {
    batch(() => {
      dispatch(setUploadProgress({ trackId, percent: 0 }));
      dispatch(toastSuccess(`Upload complete for ${trackName}!`));
    });
  });

  socket.on('EncodingCompleteAAC', ({ trackId, trackName }) => {
    batch(() => {
      dispatch(toastSuccess(`Transcoding ${trackName} to aac complete.`));
      dispatch(setTranscodingComplete(trackId));
    });
  });

  socket.on('EncodingCompleteMP3', ({ releaseId, format, exists }) => {
    batch(() => {
      dispatch(setFormatExists({ releaseId, format, exists }));
    });
  });

  socket.on('notify', ({ type, message }) => {
    switch (type) {
      case 'error':
        return dispatch(toastError(message));
      case 'info':
        return dispatch(toastInfo(message));
      case 'success':
        return dispatch(toastSuccess(message));
      case 'warning':
        return dispatch(toastWarning(message));
      default:
        return dispatch(toastInfo(message));
    }
  });

  socket.on('updateActiveRelease', ({ release }) => {
    dispatch(updateActiveRelease(release));
  });

  socket.on('workerMessage', ({ message }) => {
    dispatch(toastInfo(message));
  });

  return next => action => {
    if (action.type === 'user/updateUser') {
      const { _id: userId } = action.payload;
      if (userId) socket.emit('subscribeUser', { userId });
    }

    return next(action);
  };
};

export default socketMiddleware;
