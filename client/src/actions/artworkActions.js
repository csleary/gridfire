import axios from 'axios';
import {
  DELETE_ARTWORK,
  TOAST_MESSAGE,
  TOAST_ERROR,
  UPLOAD_ARTWORK,
  UPLOAD_ARTWORK_PROGRESS
} from './types';

export const deleteArtwork = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.delete(`/api/artwork/${releaseId}`);
    dispatch({ type: DELETE_ARTWORK, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
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
      dispatch({ type: UPLOAD_ARTWORK, payload: true });
      dispatch({
        type: UPLOAD_ARTWORK_PROGRESS,
        payload: Math.floor(progress)
      });
    }
  };

  try {
    const imgUpload = axios.post('/api/upload/artwork', data, config);
    imgUpload.then(() => {
      dispatch({ type: UPLOAD_ARTWORK, payload: false });
      dispatch({
        type: TOAST_MESSAGE,
        payload: {
          alertClass: 'alert-success',
          message: 'Artwork uploaded.'
        }
      });
    });
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};
