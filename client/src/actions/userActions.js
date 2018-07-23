import axios from 'axios';
import {
  FETCH_USER,
  FETCH_USER_RELEASE,
  FETCH_USER_RELEASES,
  TOAST_MESSAGE,
  TOAST_ERROR
} from './types';

export const fetchUser = () => async dispatch => {
  try {
    dispatch({ type: FETCH_USER, isLoading: true });
    const res = await axios.get('/api/user');
    dispatch({
      type: FETCH_USER,
      isLoading: false,
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
