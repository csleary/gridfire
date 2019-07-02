import axios from 'axios';
import {
  FETCH_USER,
  FETCH_USER_CREDIT,
  FETCH_USER_RELEASE,
  FETCH_USER_RELEASES,
  LOG_OUT,
  TOAST_ERROR,
  TOAST_SUCCESS
} from './types';

export const fetchUser = () => async dispatch => {
  try {
    const res = await axios.get('/api/user');
    dispatch({
      type: FETCH_USER,
      isLoading: false,
      payload: res.data
    });
    return res;
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
  }
};

export const fetchUserCredit = () => async dispatch => {
  try {
    const res = await axios.get('/api/nem/credit');
    dispatch({ type: FETCH_USER_CREDIT, payload: res.data.credit });
    return res;
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
  }
};

export const fetchUserRelease = releaseId => async dispatch => {
  const res = await axios.get(`/api/user/release/${releaseId}`);
  dispatch({ type: FETCH_USER_RELEASE, payload: res.data });
};

export const fetchUserReleases = () => async dispatch => {
  const res = await axios.get('/api/user/releases');
  dispatch({ type: FETCH_USER_RELEASES, payload: res.data });
  return res;
};

export const logOut = callback => async dispatch => {
  try {
    const res = await axios.get('/api/auth/logout');
    dispatch({ type: LOG_OUT });
    callback(res);
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
  }
};

export const passwordUpdate = values => async dispatch => {
  try {
    const res = await axios.post('/api/auth/update', values);
    dispatch({ type: TOAST_SUCCESS, text: res.data.success });
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
  }
};
