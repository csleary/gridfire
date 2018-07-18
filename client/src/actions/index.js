import axios from 'axios';
import {
  FETCH_ARTIST_CATALOGUE,
  FETCH_CATALOGUE,
  FETCH_COLLECTION,
  FETCH_SALES,
  TOAST_MESSAGE,
  TOAST_ERROR
} from './types';

export { default as sendEmail } from './emailActions';
export * from './artworkActions';
export * from './playerActions';
export * from './nemActions';
export * from './releaseActions';
export * from './trackActions';
export * from './userActions';

export const fetchArtistCatalogue = artist => async dispatch => {
  const res = await axios.get(`/api/catalogue/${artist}`);
  dispatch({
    type: FETCH_ARTIST_CATALOGUE,
    payload: res.data
  });
  return res;
};

export const fetchAudioUploadUrl = (
  releaseId,
  trackId,
  type
) => async dispatch => {
  try {
    return await axios.get('/api/upload/audio', {
      params: { releaseId, trackId, type }
    });
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const fetchCatalogue = () => async dispatch => {
  const res = await axios.get('/api/catalogue');
  dispatch({ type: FETCH_CATALOGUE, payload: res.data });
  return res;
};

export const fetchCollection = () => async dispatch => {
  try {
    const res = await axios.get('/api/collection/');
    dispatch({ type: FETCH_COLLECTION, payload: res.data });
    return res;
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const fetchDownloadToken = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.post('/api/download', { releaseId });
    callback(res.headers.authorization);
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const fetchSales = () => async dispatch => {
  const res = await axios.get('/api/sales');
  dispatch({ type: FETCH_SALES, payload: res.data });
};

export const toastMessage = toast => dispatch => {
  dispatch({ type: TOAST_MESSAGE, payload: toast });
};
