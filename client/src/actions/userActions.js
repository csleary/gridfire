import {
  ADD_NEM_ADDRESS,
  FETCH_USER,
  FETCH_USER_CREDIT,
  FETCH_USER_RELEASE,
  FETCH_USER_RELEASES,
  LOG_OUT
} from './types';
import { toastError, toastSuccess } from './index';
import axios from 'axios';

export const addNemAddress = values => async dispatch => {
  try {
    const res = await axios.post('/api/nem/address', values);
    dispatch({ type: ADD_NEM_ADDRESS, payload: res.data });
    return res.data;
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
    return e.response.data;
  }
};

export const fetchUser = () => async dispatch => {
  try {
    const res = await axios.get('/api/user');
    dispatch({ type: FETCH_USER, payload: res.data });
    return res;
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};

export const fetchUserCredit = () => async dispatch => {
  try {
    const res = await axios.get('/api/nem/credit');
    dispatch({ type: FETCH_USER_CREDIT, payload: res.data.credit });
    return res;
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
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
    toastError(e.response.data.error)(dispatch);
  }
};

export const passwordUpdate = values => async dispatch => {
  try {
    const res = await axios.post('/api/auth/update', values);
    toastSuccess(res.data.success)(dispatch);
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};
