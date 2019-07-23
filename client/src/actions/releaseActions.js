import {
  ADD_RELEASE,
  DELETE_RELEASE,
  FETCH_RELEASE,
  PUBLISH_STATUS,
  PURCHASE_RELEASE,
  SEARCH_RELEASES,
  SEARCH_RELEASES_CLEAR,
  SEARCH_RELEASES_LOADING,
  UPDATE_RELEASE
} from './types';
import axios from 'axios';
import { toastError } from './index';

export const addRelease = () => async dispatch => {
  try {
    const res = await axios.post('/api/release');

    if (res.data.warning) {
      return res.data;
    }
    dispatch({ type: ADD_RELEASE, payload: res.data });
    return res;
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};

export const deleteRelease = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.delete(`/api/release/${releaseId}`);
    dispatch({ type: DELETE_RELEASE, payload: res.data });
    callback();
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};

export const fetchRelease = releaseId => async dispatch => {
  try {
    const res = await axios.get(`/api/release/${releaseId}`);
    dispatch({ type: FETCH_RELEASE, payload: res.data.release });
    return res;
  } catch (e) {
    toastError('Release currently unavailable. Heading home…')(dispatch);
    return e.response.data;
  }
};

export const publishStatus = releaseId => async dispatch => {
  try {
    const res = await axios.patch(`/api/release/${releaseId}`);
    dispatch({ type: PUBLISH_STATUS, payload: res.data });
    return res;
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};

export const purchaseRelease = releaseId => async dispatch => {
  try {
    const res = await axios.get(`/api/purchase/${releaseId}`);

    if (res.data.error) {
      toastError(res.data.error)(dispatch);
    }

    dispatch({
      type: PURCHASE_RELEASE,
      payload: res.data
    });
    return res;
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};

export const searchReleases = searchQuery => async dispatch => {
  dispatch({ type: SEARCH_RELEASES_LOADING, isSearching: true, searchQuery });
  const res = await axios.get('/api/search', {
    params: {
      searchQuery
    }
  });
  dispatch({ type: SEARCH_RELEASES, payload: res.data, searchQuery });
  dispatch({ type: SEARCH_RELEASES_LOADING, isSearching: false });
  return res;
};

export const clearResults = () => async dispatch => {
  dispatch({ type: SEARCH_RELEASES_CLEAR });
};

export const updateRelease = values => async dispatch => {
  try {
    const res = await axios.put('/api/release', values);
    dispatch({ type: UPDATE_RELEASE, payload: res.data });
    return res;
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};
