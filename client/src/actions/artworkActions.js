import {
  DELETE_ARTWORK,
  UPLOAD_ARTWORK,
  UPLOAD_ARTWORK_PROGRESS
} from './types';
import axios from 'axios';
import { toastError } from './index';

export const deleteArtwork = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.delete(`/api/artwork/${releaseId}`);
    dispatch({ type: DELETE_ARTWORK, payload: res.data });
    callback();
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};

export const uploadArtwork = (releaseId, imgData, type) => async dispatch => {
  const data = new FormData();
  data.append('releaseId', releaseId);
  data.append('artwork', imgData);
  data.append('type', type);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: event => {
      const progress = (event.loaded / event.total) * 100;
      dispatch({
        type: UPLOAD_ARTWORK_PROGRESS,
        payload: Math.floor(progress)
      });
    }
  };

  try {
    dispatch({ type: UPLOAD_ARTWORK, payload: true });
    axios.post('/api/upload/artwork', data, config);
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};
