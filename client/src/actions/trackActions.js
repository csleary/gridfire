import axios from 'axios';
import {
  ADD_TRACK,
  DELETE_TRACK,
  MOVE_TRACK,
  PLAY_TRACK,
  TOAST_ERROR
} from './types';

export const addTrack = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.put(`/api/${releaseId}/add`);
    dispatch({ type: ADD_TRACK, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const deleteTrack = (releaseId, trackId, callback) => async dispatch => {
  try {
    const res = await axios.delete(`/api/${releaseId}/${trackId}`);
    dispatch({ type: DELETE_TRACK, payload: res.data });
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

export const playTrack = (
  releaseId,
  trackId,
  artistName,
  trackTitle
) => async dispatch => {
  try {
    const res = await axios.get('/api/play-track', {
      params: { releaseId, trackId }
    });

    dispatch({
      type: PLAY_TRACK,
      payload: {
        audio: res.data,
        artistName,
        releaseId,
        trackTitle
      }
    });
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};

export const transcodeAudio = (releaseId, trackId) => async () => {
  await axios.get('/api/transcode/audio', {
    params: {
      releaseId,
      trackId
    }
  });
};
