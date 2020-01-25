import {
  ADD_TRACK,
  DELETE_TRACK_COMPLETE,
  DELETE_TRACK_START,
  MOVE_TRACK,
  PLAY_TRACK,
  TRANSCODING_COMPLETE,
  TRANSCODING_START,
  TRANSCODING_STOP,
  UPLOAD_AUDIO_PROGRESS
} from './types';
import axios from 'axios';
import { toastError } from './index';

export const addTrack = (releaseId, callback) => async dispatch => {
  try {
    const res = await axios.put(`/api/${releaseId}/add`);
    dispatch({ type: ADD_TRACK, payload: res.data });
    callback(res.data);
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};

export const deleteTrack = (releaseId, trackId, callback) => async dispatch => {
  try {
    dispatch({ type: DELETE_TRACK_START, trackId });
    const res = await axios.delete(`/api/${releaseId}/${trackId}`);
    dispatch({ type: DELETE_TRACK_COMPLETE, payload: res.data, trackId });
    callback(res.data);
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
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
    callback(res.data);
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
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
    toastError(e)(dispatch);
  }
};

export const transcodeAudio = (
  releaseId,
  trackId,
  trackName
) => async dispatch => {
  try {
    dispatch({
      type: TRANSCODING_START,
      payload: { releaseId, trackId, trackName, action: TRANSCODING_COMPLETE }
    });
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
    dispatch({ type: TRANSCODING_STOP, trackId });
  }
};

export const uploadAudio = ({
  releaseId,
  trackId,
  trackName,
  audioFile,
  type
}) => async dispatch => {
  try {
    const data = new FormData();
    data.append('releaseId', releaseId);
    data.append('trackId', trackId);
    data.append('trackName', trackName);
    data.append('audio', audioFile);
    data.append('type', type);

    const config = {
      onUploadProgress: event => {
        const percent = Math.floor((event.loaded / event.total) * 100);
        dispatch({ type: UPLOAD_AUDIO_PROGRESS, trackId, percent });
      }
    };

    const res = await axios.post('/api/upload/audio', data, config);

    return res;
  } catch (e) {
    toastError(e.response.data.error);

    dispatch({
      type: UPLOAD_AUDIO_PROGRESS,
      trackId,
      percent: 0
    });
  }
};

export const uploadAudioProgress = (trackId, percent) => dispatch => {
  dispatch({ type: UPLOAD_AUDIO_PROGRESS, trackId, percent });
};
