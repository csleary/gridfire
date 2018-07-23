import axios from 'axios';
import {
  ADD_RELEASE,
  DELETE_RELEASE,
  FETCH_RELEASE,
  PUBLISH_STATUS,
  PURCHASE_RELEASE,
  TOAST_ERROR,
  UPDATE_RELEASE
} from './types';

export const addRelease = () => async dispatch => {
  try {
    const res = await axios.post('/api/release');
    dispatch({ type: ADD_RELEASE, payload: res.data });
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const deleteRelease = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.delete(`/api/release/${releaseId}`);
    dispatch({ type: DELETE_RELEASE, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const fetchRelease = releaseId => async dispatch => {
  try {
    const res = await axios.get(`/api/release/${releaseId}`);
    dispatch({ type: FETCH_RELEASE, payload: res.data.release });
    return res;
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const publishStatus = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.patch(`/api/release/${releaseId}`);
    dispatch({ type: PUBLISH_STATUS, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
    callback(e.response.data);
  }
};

export const purchaseRelease = releaseId => async dispatch => {
  try {
    const res = await axios.get(`/api/purchase/${releaseId}`);

    if (res.data.error) {
      dispatch({ type: TOAST_ERROR, payload: res.data });
    }

    dispatch({
      type: PURCHASE_RELEASE,
      payload: res.data
    });
    return res;
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
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
