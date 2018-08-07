import axios from 'axios';
import {
  ADD_TRACK,
  DELETE_TRACK,
  MOVE_TRACK,
  PLAY_TRACK,
  TOAST_ERROR,
  TOAST_SUCCESS,
  TRANSCODING_START,
  TRANSCODING_STOP,
  UPLOAD_AUDIO_PROGRESS
} from './types';

export const addTrack = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.put(`/api/${releaseId}/add`);
    dispatch({ type: ADD_TRACK, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
  }
};

export const deleteTrack = (releaseId, trackId, callback) => async dispatch => {
  try {
    const res = await axios.delete(`/api/${releaseId}/${trackId}`);
    dispatch({ type: DELETE_TRACK, payload: res.data });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
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
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
    return { error: e.response.data.error };
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
        trackId,
        trackTitle
      }
    });
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
  }
};

export const transcodeAudio = (
  releaseId,
  trackId,
  trackName
) => async dispatch => {
  try {
    dispatch({ type: TRANSCODING_START, trackId });
    const res = await axios.get('/api/transcode/audio', {
      params: {
        releaseId,
        trackId,
        trackName
      }
    });
    dispatch({ type: TOAST_SUCCESS, text: res.data.success });
    dispatch({
      type: TRANSCODING_STOP,
      trackId,
      payload: res.data.updatedRelease
    });
    return res;
  } catch (e) {
    dispatch({
      type: TOAST_ERROR,
      text: `Transcoding error: ${e.response.data.error}`
    });
    dispatch({ type: TRANSCODING_STOP, trackId });
  }
};

export const uploadAudioProgress = (trackId, percent) => dispatch => {
  dispatch({
    type: UPLOAD_AUDIO_PROGRESS,
    trackId,
    percent
  });
};
