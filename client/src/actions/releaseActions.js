import axios from 'axios';
import {
  ADD_RELEASE,
  DELETE_RELEASE,
  FETCH_RELEASE,
  PUBLISH_STATUS,
  PURCHASE_RELEASE,
  SEARCH_RELEASES,
  SEARCH_RELEASES_LOADING,
  TOAST_ERROR,
  UPDATE_RELEASE
} from './types';

export const addRelease = () => async dispatch => {
  try {
    const res = await axios.post('/api/release');
    dispatch({ type: ADD_RELEASE, payload: res.data });
    return res;
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
  }
};

export const deleteRelease = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.delete(`/api/release/${releaseId}`);
    dispatch({ type: DELETE_RELEASE, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
  }
};

export const fetchRelease = releaseId => async dispatch => {
  try {
    const res = await axios.get(`/api/release/${releaseId}`);
    dispatch({ type: FETCH_RELEASE, payload: res.data.release });
    return res;
  } catch (e) {
    dispatch({
      type: TOAST_ERROR,
      text: 'Release currently unavailable. Heading home…'
    });
    return e.response.data;
  }
};

export const publishStatus = releaseId => async dispatch => {
  try {
    const res = await axios.patch(`/api/release/${releaseId}`);
    dispatch({ type: PUBLISH_STATUS, payload: res.data });
    return res;
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
  }
};

export const purchaseRelease = releaseId => async dispatch => {
  try {
    const res = await axios.get(`/api/purchase/${releaseId}`);

    if (res.data.error) {
      dispatch({ type: TOAST_ERROR, text: res.data.error });
    }

    dispatch({
      type: PURCHASE_RELEASE,
      payload: res.data
    });
    return res;
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
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

export const updateRelease = values => async dispatch => {
  try {
    const res = await axios.put('/api/release', values);
    dispatch({ type: UPDATE_RELEASE, payload: res.data });
    return res;
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
  }
};
