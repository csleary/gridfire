import axios from 'axios';
import {
  ADD_RELEASE,
  ADD_TRACK,
  ADD_TRACK_LOADING,
  DELETE_ARTWORK,
  DELETE_RELEASE,
  DELETE_TRACK,
  DELETE_TRACK_LOADING,
  FETCH_ARTIST_CATALOGUE,
  FETCH_AUDIO_UPLOAD_URL,
  FETCH_CATALOGUE,
  FETCH_COLLECTION,
  FETCH_RELEASE,
  FETCH_SALES,
  FETCH_USER,
  FETCH_USER_RELEASE,
  FETCH_USER_RELEASES,
  MOVE_TRACK,
  PLAY_TRACK,
  PUBLISH_STATUS,
  PURCHASE_RELEASE,
  TOAST_MESSAGE,
  TOAST_ERROR,
  UPDATE_RELEASE,
  UPLOAD_ARTWORK,
  UPLOAD_ARTWORK_PROGRESS
} from './types';

export { default as sendEmail } from './emailActions';
export * from './playerActions';
export * from './nemActions';

export const addRelease = () => async dispatch => {
  try {
    const res = await axios.post('/api/release');
    dispatch({ type: ADD_RELEASE, payload: res.data });
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const addTrack = (releaseId, callback) => async dispatch => {
  try {
    dispatch({ type: ADD_TRACK_LOADING, isAddingTrack: true });
    const res = await axios.put(`/api/${releaseId}/add`);
    dispatch({ type: ADD_TRACK, isAddingTrack: false, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: ADD_TRACK_LOADING, isAddingTrack: false });
    dispatch({
      type: TOAST_ERROR,
      isAddingTrack: false,
      payload: e.response.data
    });
  }
};

export const deleteArtwork = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.delete(`/api/artwork/${releaseId}`);
    dispatch({ type: DELETE_ARTWORK, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
    callback(e.response.data.error);
  }
};

export const deleteRelease = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.delete(`/api/release/${releaseId}`);
    dispatch({ type: DELETE_RELEASE, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
    callback(e.response.data.error);
  }
};

export const deleteTrack = (releaseId, trackId, callback) => async dispatch => {
  try {
    dispatch({ type: DELETE_TRACK_LOADING, isDeletingTrack: true });
    const res = await axios.delete(`/api/${releaseId}/${trackId}`);
    dispatch({ type: DELETE_TRACK, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: DELETE_TRACK_LOADING, isDeletingTrack: false });
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
    await axios.post('/api/upload/artwork', data, config);
    dispatch({ type: UPLOAD_ARTWORK, payload: false });
    dispatch({
      type: TOAST_MESSAGE,
      payload: {
        alertClass: 'alert-success',
        message: 'Artwork uploaded.'
      }
    });
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const fetchArtistCatalogue = (userId, artistName) => async dispatch => {
  const res = await axios.get(`/api/catalogue/${userId}/${artistName}`);
  dispatch({
    type: FETCH_ARTIST_CATALOGUE,
    payload: { artistName: res.data.artistName, releases: res.data.releases }
  });
  return res;
};

export const fetchAudioUploadUrl = (
  releaseId,
  trackId,
  type
) => async dispatch => {
  try {
    const res = await axios.get('/api/upload/audio', {
      params: { releaseId, trackId, type }
    });
    dispatch({ type: FETCH_AUDIO_UPLOAD_URL, payload: res.data });
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

export const fetchRelease = releaseId => async dispatch => {
  try {
    const res = await axios.get(`/api/release/${releaseId}`);
    dispatch({ type: FETCH_RELEASE, payload: res.data.release });
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const fetchSales = () => async dispatch => {
  const res = await axios.get('/api/sales');
  dispatch({ type: FETCH_SALES, payload: res.data });
};

export const fetchUser = () => async dispatch => {
  try {
    dispatch({ type: FETCH_USER, isLoading: true });
    const res = await axios.get('/api/user');
    dispatch({
      type: FETCH_USER,
      isLoading: false,
      isLoggedIn: !!res.data,
      payload: res.data
    });
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const fetchUserRelease = releaseId => async dispatch => {
  const res = await axios.get(`/api/user/release/${releaseId}`);
  dispatch({ type: FETCH_USER_RELEASE, payload: res.data });
};

export const fetchUserReleases = () => async dispatch => {
  dispatch({ type: FETCH_USER_RELEASES, isLoading: true });
  const res = await axios.get('/api/user/releases');
  dispatch({ type: FETCH_USER_RELEASES, isLoading: false, payload: res.data });
};

export const login = (values, callback) => async dispatch => {
  try {
    const res = await axios.post('/auth/login', values);
    dispatch(fetchUser());
    dispatch({
      type: TOAST_MESSAGE,
      payload: {
        alertClass: 'alert-success',
        message: res.data.success
      }
    });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const moveTrack = (
  releaseId,
  fromIndex,
  toIndex,
  callback
) => async dispatch => {
  try {
    const res = await axios.patch(`/api/${releaseId}/${fromIndex}/${toIndex}`);
    dispatch({ type: MOVE_TRACK, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
    callback(e.response.data.error);
  }
};

export const passwordUpdate = values => async dispatch => {
  try {
    const res = await axios.post('/auth/update', values);
    dispatch({
      type: TOAST_MESSAGE,
      payload: {
        alertClass: 'alert-success',
        message: res.data.success
      }
    });
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const playTrack = (
  albumId,
  trackId,
  artistName,
  trackTitle
) => async dispatch => {
  const res = await axios.get('/api/play-track', {
    params: {
      albumId,
      trackId
    }
  });
  dispatch({
    type: PLAY_TRACK,
    payload: {
      audio: res.data,
      artistName,
      albumId,
      trackTitle
    }
  });
};

export const publishStatus = releaseId => async dispatch => {
  try {
    const res = await axios.patch(`/api/release/${releaseId}`);
    dispatch({ type: PUBLISH_STATUS, payload: res.data });
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const purchaseRelease = releaseId => async dispatch => {
  const res = await axios.get(`/api/purchase/${releaseId}`);
  dispatch({
    type: PURCHASE_RELEASE,
    payload: res.data
  });
};

export const register = (values, callback) => async dispatch => {
  try {
    const res = await axios.post('/auth/register', values);
    dispatch(fetchUser());
    dispatch({
      type: TOAST_MESSAGE,
      payload: {
        alertClass: 'alert-success',
        message: res.data.success
      }
    });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const toastMessage = toast => dispatch => {
  dispatch({ type: TOAST_MESSAGE, payload: toast });
};

export const transcodeAudio = (releaseId, trackId) => async () => {
  await axios.get('/api/transcode/audio', {
    params: {
      releaseId,
      trackId
    }
  });
};

export const updateRelease = (values, callback) => async dispatch => {
  try {
    const res = await axios.put('/api/release', values);
    dispatch({ type: UPDATE_RELEASE, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};
