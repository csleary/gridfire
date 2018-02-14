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
  FETCH_INCOMING_TRANSACTIONS_UPDATING,
  FETCH_USER,
  FETCH_USER_RELEASE,
  FETCH_USER_RELEASES,
  FETCH_XEM_PRICE,
  MOVE_TRACK,
  PLAY_TRACK,
  PLAYER_HIDE,
  PLAYER_PAUSE,
  PLAYER_PLAY,
  PLAYER_STOP,
  PUBLISH_STATUS,
  PURCHASE_RELEASE,
  TOAST_MESSAGE,
  UPDATE_RELEASE
} from './types';

export const addNemAddress = values => async dispatch => {
  const res = await axios.post('/api/nem/address', values);
  dispatch({ type: ADD_NEM_ADDRESS, payload: res.data });
};

export const addRelease = () => async dispatch => {
  const res = await axios.post('/api/release');
  dispatch({ type: ADD_RELEASE, payload: res.data });
};

export const addTrack = releaseId => async dispatch => {
  const res = await axios.put(`/api/${releaseId}/add`);
  dispatch({ type: ADD_TRACK, payload: res.data });
};

export const deleteArtwork = releaseId => async dispatch => {
  const res = await axios.delete(`/api/artwork/${releaseId}`);
  dispatch({ type: DELETE_ARTWORK, payload: res.data });
};

export const deleteRelease = releaseId => async dispatch => {
  const res = await axios.delete(`/api/release/${releaseId}`);
  dispatch({ type: DELETE_RELEASE, payload: res.data });
};

export const deleteTrack = (releaseId, trackId) => async dispatch => {
  const res = await axios.delete(`/api/${releaseId}/${trackId}`);
  dispatch({ type: DELETE_TRACK, payload: res.data });
};

export const fetchArtworkUploadUrl = (releaseId, type) => async dispatch => {
  const res = await axios.get('/api/upload/artwork', {
    params: {
      releaseId,
      type
    }
  });
  dispatch({ type: FETCH_ARTWORK_UPLOAD_URL, payload: res.data });
};

export const fetchAudioUploadUrl = (
  releaseId,
  trackId,
  type
) => async dispatch => {
  const res = await axios.get('/api/upload/audio', {
    params: {
      releaseId,
      trackId,
      type
    }
  });
  dispatch({ type: FETCH_AUDIO_UPLOAD_URL, payload: res.data });
};

export const fetchCatalogue = () => async dispatch => {
  const res = await axios.get('/api/catalogue');
  dispatch({ type: FETCH_CATALOGUE, payload: res.data });
};

export const fetchRelease = releaseId => async dispatch => {
  const res = await axios.get(`/api/release/${releaseId}`);
  dispatch({
    type: FETCH_RELEASE,
    payload: res.data.release
  });
};

export const fetchIncomingTxs = (
  paymentParams,
  isUpdating
) => async dispatch => {
  if (isUpdating) {
    dispatch({ type: FETCH_INCOMING_TRANSACTIONS_UPDATING });
  } else {
    dispatch({ type: FETCH_INCOMING_TRANSACTIONS_LOADING });
  }
  const res = await axios.post('/api/nem/transactions', paymentParams);
  dispatch({
    type: FETCH_INCOMING_TRANSACTIONS,
    isLoading: false,
    isUpdating: false,
    payload: res.data,
    downloadToken: res.headers.authorization
  });
};

export const fetchUser = () => async dispatch => {
  dispatch({ type: FETCH_USER, isLoading: true });
  const res = await axios.get('/api/user');
  dispatch({
    type: FETCH_USER,
    isLoading: false,
    isLoggedIn: !!res.data,
    payload: res.data
  });
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

export const fetchXemPrice = () => async dispatch => {
  try {
    const res = await axios.get('/api/nem/price');
    dispatch({ type: FETCH_XEM_PRICE, payload: res.data });
  } catch (error) {
    throw new Error(
      `We could not fetch the current XEM price. (${error.message})`
    );
  }
};

export const login = (values, callback) => async dispatch => {
  try {
    const res = await axios.post('/auth/login', values);
    const { success, error } = res.data;
    if (success || error) {
      success && dispatch(fetchUser());
      dispatch({
        type: TOAST_MESSAGE,
        payload: {
          alertClass: success ? 'alert-success' : 'alert-danger',
          message: success || error
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

export const moveTrack = (
  releaseId,
  index,
  direction,
  callback
) => async dispatch => {
  const res = await axios.patch(`/api/${releaseId}/${index}/${direction}`);
  dispatch({ type: MOVE_TRACK, payload: res.data });
  callback();
};

export const passwordUpdate = values => async dispatch => {
  try {
    const res = await axios.post('/auth/update', values);
    const { success, error } = res.data;
    if (success || error) {
      dispatch({
        type: TOAST_MESSAGE,
        payload: {
          alertClass: success ? 'alert-success' : 'alert-danger',
          message: success || error
        }
      });
    }
  } catch (error) {
    dispatch({
      type: TOAST_MESSAGE,
      payload: {
        alertClass: 'alert-danger',
        message: `Sorry, the password update failed. (${error})`
      }
    });
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

export const publishStatus = releaseId => async dispatch => {
  const res = await axios.patch(`/api/release/${releaseId}`);
  dispatch({ type: PUBLISH_STATUS, payload: res.data });
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
    const { success, error } = res.data;
    if (success || error) {
      success && dispatch(fetchUser());
      dispatch({
        type: TOAST_MESSAGE,
        payload: {
          alertClass: success ? 'alert-success' : 'alert-danger',
          message: success || error
        }
      });
      callback();
    }
  } catch (error) {
    dispatch({
      type: TOAST_MESSAGE,
      payload: {
        alertClass: 'alert-danger',
        message: `We encountered an error, sorry. (${error})`
      }
    });
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
  const res = await axios.put('/api/release', values);
  callback();
  dispatch({ type: UPDATE_RELEASE, payload: res.data });
};
