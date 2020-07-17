import { setTranscodingComplete, setUploadProgress } from 'features/tracks';
import { toastError, toastInfo, toastSuccess } from 'features/toast';
import { batch } from 'react-redux';
import io from 'socket.io-client';
import { setArtworkUploading } from 'features/artwork';
import { updateActiveRelease } from 'features/releases';

const socket = io();

const socketMiddleware = ({ dispatch, getState }) => {
  socket.on('connect', () => {
    console.log('[Socket.io] Connected.');
    const userId = getState().user.userId;
    if (userId) socket.emit('subscribe', { userId });
  });

  socket.on('error', error => dispatch(toastError(error.toString())));

  socket.on('artworkUploaded', () => {
    batch(() => {
      dispatch(setArtworkUploading(false));
      dispatch(toastSuccess('Artwork uploaded.'));
    });
  });

  socket.on('EncodingCompleteFlac', ({ trackId, trackName }) => {
    batch(() => {
      dispatch(setUploadProgress({ trackId, percent: 0 }));
      dispatch(toastSuccess(`Upload complete for ${trackName}!`));
    });
  });

  socket.on('EncodingCompleteAac', ({ trackId, trackName }) => {
    batch(() => {
      dispatch(toastSuccess(`Transcoding ${trackName} to aac complete.`));
      dispatch(setTranscodingComplete(trackId));
    });
  });

  socket.on('updateActiveRelease', ({ release }) => {
    dispatch(updateActiveRelease(release));
  });

  socket.on('workerMessage', ({ message }) => {
    dispatch(toastInfo(message));
  });

  return next => action => {
    if (action.type === 'user/updateUser') {
      socket.emit('subscribeUser', { userId: action.payload._id });
    }

    return next(action);
  };
};

export default socketMiddleware;
