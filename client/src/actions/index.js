import {
  FETCH_ARTIST_CATALOGUE,
  FETCH_CATALOGUE,
  FETCH_COLLECTION,
  FETCH_SALES,
  TOAST_ERROR,
  TOAST_HIDE,
  TOAST_INFO,
  TOAST_SUCCESS,
  TOAST_WARNING
} from './types';
import axios from 'axios';
import uuidv4 from 'uuid/v4';

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
    toastError(e.response.data.error)(dispatch);
  }
};

export const fetchCatalogue = (
  catalogueLimit,
  catalogueSkip
) => async dispatch => {
  const res = await axios.get('/api/catalogue/', {
    params: { catalogueLimit, catalogueSkip }
  });

  if (res.data.length < catalogueLimit) {
    dispatch({
      type: FETCH_CATALOGUE,
      payload: res.data,
      catalogueLimit,
      catalogueSkip,
      reachedEndOfCat: true
    });
  } else {
    dispatch({
      type: FETCH_CATALOGUE,
      payload: res.data,
      catalogueLimit,
      catalogueSkip: catalogueSkip + catalogueLimit,
      reachedEndOfCat: false
    });
  }
  return res.data;
};

export const fetchCollection = () => async dispatch => {
  try {
    const res = await axios.get('/api/collection/');
    dispatch({ type: FETCH_COLLECTION, payload: res.data });
    return res;
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};

export const checkFormatMp3 = (token, callback) => async dispatch => {
  try {
    const res = await axios.get(`/api/download/${token}/check`);
    callback(res);
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};

export const fetchDownloadToken = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.post('/api/download', { releaseId });
    callback(res.headers.authorization);
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};

export const fetchSales = () => async dispatch => {
  const res = await axios.get('/api/sales');
  dispatch({ type: FETCH_SALES, payload: res.data });
  return res.data;
};

export const toastInfo = message => dispatch => {
  const key = uuidv4();
  dispatch({ type: TOAST_INFO, key, message });
  setTimeout(() => dispatch({ type: TOAST_HIDE, key }), 5000);
};

export const toastError = message => dispatch => {
  const key = uuidv4();
  dispatch({ type: TOAST_ERROR, key, message });
  setTimeout(() => dispatch({ type: TOAST_HIDE, key }), 5000);
};

export const toastSuccess = message => dispatch => {
  const key = uuidv4();
  dispatch({ type: TOAST_SUCCESS, key, message });
  setTimeout(() => dispatch({ type: TOAST_HIDE, key }), 5000);
};

export const toastWarning = message => dispatch => {
  const key = uuidv4();
  dispatch({ type: TOAST_WARNING, key, message });
  setTimeout(() => dispatch({ type: TOAST_HIDE, key }), 5000);
};
