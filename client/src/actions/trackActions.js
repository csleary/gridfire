import axios from 'axios';
import {
  ADD_TRACK,
  DELETE_TRACK_START,
  DELETE_TRACK_COMPLETE,
  MOVE_TRACK,
  PLAY_TRACK,
  TOAST_ERROR,
  TOAST_SUCCESS,
  TRANSCODING_START,
  TRANSCODING_COMPLETE,
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
    dispatch({ type: DELETE_TRACK_START, trackId });
    const res = await axios.delete(`/api/${releaseId}/${trackId}`);
    dispatch({ type: DELETE_TRACK_COMPLETE, payload: res.data, trackId });
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
    dispatch({
      type: PLAY_TRACK,
      artistName,
      releaseId,
      trackId,
      trackTitle
    });
  } catch (e) {
    console.log(e);
    dispatch({ type: TOAST_ERROR, text: e });
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
      type: TRANSCODING_COMPLETE,
      trackId,
      payload: res.data.updatedRelease
    });
    return res;
  } catch (e) {
    dispatch({
      type: TOAST_ERROR,
      text: `Transcoding error: ${e.response.data.error}`
    });
    dispatch({ type: TRANSCODING_COMPLETE, trackId });
  }
};

export const uploadAudio = (
  releaseId,
  trackId,
  audioData,
  type
) => async dispatch => {
  try {
    const data = new FormData();
    data.append('releaseId', releaseId);
    data.append('trackId', trackId);
    data.append('audio', audioData);
    data.append('type', type);

    const config = {
      onUploadProgress: event => {
        const percent = Math.floor((event.loaded / event.total) * 100);
        dispatch({ type: UPLOAD_AUDIO_PROGRESS, trackId, percent });
      }
    };

    const res = await axios.post('/api/upload/audio', data, config);
    dispatch({ type: UPLOAD_AUDIO_PROGRESS, trackId, percent: 0 });
    return res;
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
    dispatch({ type: UPLOAD_AUDIO_PROGRESS, trackId, percent: 0 });
  }
};

export const uploadAudioProgress = (trackId, percent) => dispatch => {
  dispatch({ type: UPLOAD_AUDIO_PROGRESS, trackId, percent });
};
