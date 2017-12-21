import axios from 'axios';
import {
  ADD_NEM_ADDRESS,
  ADD_RELEASE,
  ADD_TRACK,
  DELETE_ARTWORK,
  DELETE_RELEASE,
  DELETE_TRACK,
  FETCH_ARTWORK_UPLOAD_URL,
  FETCH_AUDIO_UPLOAD_URL,
  FETCH_CATALOGUE,
  FETCH_RELEASE,
  FETCH_INCOMING_TRANSACTIONS,
  FETCH_INCOMING_TRANSACTIONS_LOADING,
  FETCH_USER,
  FETCH_USER_RELEASE,
  FETCH_USER_RELEASES,
  FETCH_XEM_PRICE,
  MOVE_TRACK,
  PLAY_TRACK,
  PLAYER_PAUSE,
  PLAYER_PLAY,
  PLAYER_HIDE,
  PUBLISH_STATUS,
  PURCHASE_RELEASE,
  TOAST_MESSAGE,
  // TRANSCODE_AUDIO_STARTED,
  // TRANSCODE_AUDIO_FINISHED,
  UPDATE_RELEASE
} from './types';

export const addNemAddress = values => async (dispatch) => {
  const res = await axios.post('/api/nem/address', values);
  dispatch({ type: ADD_NEM_ADDRESS, payload: res.data });
};

export const addRelease = () => async (dispatch) => {
  const res = await axios.post('/api/release');
  dispatch({ type: ADD_RELEASE, payload: res.data });
};

export const addTrack = releaseId => async (dispatch) => {
  const res = await axios.put(`/api/${releaseId}/add`);
  dispatch({ type: ADD_TRACK, payload: res.data });
};

export const deleteArtwork = id => async (dispatch) => {
  const res = await axios.delete(`/api/artwork/${id}`);
  dispatch({ type: DELETE_ARTWORK, payload: res.data });
};

export const deleteRelease = id => async (dispatch) => {
  const res = await axios.delete(`/api/release/${id}`);
  dispatch({ type: DELETE_RELEASE, payload: res.data });
};

export const deleteTrack = (releaseId, trackId) => async (dispatch) => {
  const res = await axios.delete(`/api/${releaseId}/${trackId}`);
  dispatch({ type: DELETE_TRACK, payload: res.data });
};

export const fetchArtworkUploadUrl = (id, type) => async (dispatch) => {
  const res = await axios.get('/api/upload/artwork', {
    params: {
      id,
      type
    }
  });
  dispatch({ type: FETCH_ARTWORK_UPLOAD_URL, payload: res.data });
};

export const fetchAudioUploadUrl = (id, index, type) => async (dispatch) => {
  const res = await axios.get('/api/upload/audio', {
    params: {
      id,
      index,
      type
    }
  });
  dispatch({ type: FETCH_AUDIO_UPLOAD_URL, payload: res.data });
};

export const fetchCatalogue = () => async (dispatch) => {
  const res = await axios.get('/api/catalogue');
  dispatch({ type: FETCH_CATALOGUE, payload: res.data });
};

export const fetchRelease = id => async (dispatch) => {
  const res = await axios.get(`/api/release/${id}`);
  dispatch({
    type: FETCH_RELEASE,
    payload: res.data.release
  });
};

export const fetchIncomingTxs = paymentParams => async (dispatch) => {
  dispatch({ type: FETCH_INCOMING_TRANSACTIONS_LOADING });
  const res = await axios.post('/api/nem/transactions', paymentParams);
  dispatch({
    type: FETCH_INCOMING_TRANSACTIONS,
    isLoading: false,
    payload: res.data,
    downloadToken: res.headers.authorization
  });
};

export const fetchUser = () => async (dispatch) => {
  dispatch({ type: FETCH_USER, isLoading: true });
  const res = await axios.get('/api/user');
  dispatch({
    type: FETCH_USER,
    isLoading: false,
    isLoggedIn: !!res.data,
    payload: res.data
  });
};

export const fetchUserRelease = id => async (dispatch) => {
  const res = await axios.get(`/api/user/release/${id}`);
  dispatch({ type: FETCH_USER_RELEASE, payload: res.data });
};

export const fetchUserReleases = () => async (dispatch) => {
  dispatch({ type: FETCH_USER_RELEASES, isLoading: true });
  const res = await axios.get('/api/user/releases');
  dispatch({ type: FETCH_USER_RELEASES, isLoading: false, payload: res.data });
};

export const fetchXemPrice = () => async (dispatch) => {
  const res = await axios.get('/api/nem/price');
  dispatch({ type: FETCH_XEM_PRICE, payload: res.data.xemPriceUsd });
};

export const login = (values, callback) => async (dispatch) => {
  try {
    const res = await axios.post('/auth/login', values);
    if (res.status === 200) {
      dispatch(fetchUser());
      dispatch({
        type: TOAST_MESSAGE,
        payload: {
          alertClass: 'alert-success',
          message: 'Successfully logged in.'
        }
      });
      callback();
    }
  } catch (error) {
    dispatch({
      type: TOAST_MESSAGE,
      payload: {
        alertClass: 'alert-danger',
        message: `Username either not found, or password incorrect. (${error})`
      }
    });
  }
};

export const register = (values, callback) => async (dispatch) => {
  try {
    const res = await axios.post('/auth/register', values);
    if (res.status === 200) {
      dispatch(fetchUser());
      dispatch({
        type: TOAST_MESSAGE,
        payload: {
          alertClass: 'alert-success',
          message: 'Thanks for registering. You are now logged in.'
        }
      });
      callback();
    }
  } catch (error) {
    dispatch({
      type: TOAST_MESSAGE,
      payload: {
        alertClass: 'alert-danger',
        message: `That email address might already be taken. Please try again with another. (${error})`
      }
    });
  }
};

export const moveTrack = (releaseId, index, direction) => async (dispatch) => {
  const res = await axios.patch(`/api/${releaseId}/${index}/${direction}`);
  dispatch({ type: MOVE_TRACK, payload: res.data });
};

export const playTrack = (
  albumId,
  trackId,
  artistName,
  trackTitle
) => async (dispatch) => {
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

export const playerPause = () => (dispatch) => {
  dispatch({
    type: PLAYER_PAUSE,
    payload: {
      isPlaying: false
    }
  });
};

export const playerPlay = () => (dispatch) => {
  dispatch({
    type: PLAYER_PLAY,
    payload: {
      isPlaying: true,
      showPlayer: true
    }
  });
};

export const playerHide = () => (dispatch) => {
  dispatch({
    type: PLAYER_HIDE,
    payload: {
      isPlaying: false,
      showPlayer: false
    }
  });
};

export const publishStatus = id => async (dispatch) => {
  const res = await axios.patch(`/api/release/${id}`);
  dispatch({ type: PUBLISH_STATUS, payload: res.data });
};

export const purchaseRelease = id => async (dispatch) => {
  const res = await axios.get(`/api/purchase/${id}`);
  dispatch({
    type: PURCHASE_RELEASE,
    payload: res.data.release,
    paymentAddress: res.data.paymentInfo.paymentAddress,
    paymentHash: res.data.paymentInfo.paymentHash
  });
};

export const toastMessage = toast => (dispatch) => {
  dispatch({ type: TOAST_MESSAGE, payload: toast });
};

export const transcodeAudio = (id, index) => async () => {
  // dispatch({ type: TRANSCODE_AUDIO_STARTED });
  const res = await axios.get('/api/transcode/audio', {
    params: {
      id,
      index
    }
  });
  // if (res.status === 200) dispatch({ type: TRANSCODE_AUDIO_FINISHED });
};

export const updateRelease = (values, callback) => async (dispatch) => {
  const res = await axios.put('/api/release', values);
  callback();
  dispatch({ type: UPDATE_RELEASE, payload: res.data });
};
