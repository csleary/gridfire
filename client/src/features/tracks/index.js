import { toastError, toastInfo, toastSuccess } from 'features/toast';
import axios from 'axios';
import { createSlice } from '@reduxjs/toolkit';
import { setActiveRelease } from 'features/releases';
const calls = new Map();

const trackSlice = createSlice({
  name: 'tracks',
  initialState: {
    audioUploadProgress: {},
    encodingProgressFLAC: {},
    uploadCancelled: false,
    storingProgressFLAC: {},
    trackIdsForDeletion: {},
    transcodingProgressAAC: {}
  },
  reducers: {
    cancelUpload(state, action) {
      const trackId = action.payload;
      const call = calls.get(trackId);

      if (call) {
        call.cancel();
        calls.delete(trackId);
      }

      state.uploadProgress = { ...state.audioUploadProgress, [trackId]: 0 };
    },

    setEncodingComplete(state, action) {
      const { trackId } = action.payload;
      const { [trackId]: encoded, ...encoding } = state.encodingProgressFLAC; // eslint-disable-line
      state.encodingProgressFLAC = { ...encoding };
      const { [trackId]: stored, ...storing } = state.storingProgressFLAC; // eslint-disable-line
      state.storingProgressFLAC = { ...storing };
    },

    setEncodingProgressFLAC(state, action) {
      const { message, trackId } = action.payload;
      state.encodingProgressFLAC = {
        ...state.encodingProgressFLAC,
        [trackId]: { message }
      };
    },

    setStoringProgressFLAC(state, action) {
      const { message, trackId } = action.payload;
      state.storingProgressFLAC = {
        ...state.storingProgressFLAC,
        [trackId]: { message }
      };
    },

    setTrackIdsForDeletion(state, action) {
      const { trackId, isDeleting } = action.payload;
      state.trackIdsForDeletion = { ...state.trackIdsForDeletion, [trackId]: isDeleting };
    },

    setTranscodingComplete(state, action) {
      const { trackId } = action.payload;
      const { [trackId]: track, ...rest } = state.transcodingProgressAAC; // eslint-disable-line
      state.transcodingProgressAAC = { ...rest };
    },

    setTranscodingProgressAAC(state, action) {
      const { message, trackId } = action.payload;
      state.transcodingProgressAAC = {
        ...state.transcodingProgressAAC,
        [trackId]: { message }
      };
    },

    setUploadProgress(state, action) {
      const { trackId, percent } = action.payload;
      state.audioUploadProgress = { ...state.audioUploadProgress, [trackId]: percent };
    }
  }
});

const addTrack = (releaseId, newTrack) => async dispatch => {
  try {
    const res = await axios.put(`/api/track/${releaseId}/add`, { newTrack });
    dispatch(setActiveRelease(res.data));
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

const deleteTrack = (releaseId, trackId, trackTitle) => async (dispatch, getState) => {
  try {
    if (getState().tracks.trackIdsForDeletion[trackId]) {
      const res = await axios.delete(`/api/track/${releaseId}/${trackId}`);
      dispatch(setActiveRelease(res.data));
      dispatch(toastSuccess(`${trackTitle ? `\u2018${trackTitle}\u2019` : 'Track'} deleted.`));
      dispatch(setTrackIdsForDeletion({ trackId, isDeleting: false }));
    } else {
      dispatch(setTrackIdsForDeletion({ trackId, isDeleting: true }));
    }
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

const getCancelToken = uploadId => () => {
  const call = axios.CancelToken.source();
  calls.set(uploadId, call);
  return call.token;
};

const moveTrack = (releaseId, fromIndex, toIndex) => async dispatch => {
  try {
    const res = await axios.patch(`/api/track/${releaseId}/${fromIndex}/${toIndex}`);
    dispatch(setActiveRelease(res.data));
  } catch (error) {
    dispatch(toastError(error.response.data.error));
    return { error: error.response.data.error };
  }
};

const uploadAudio =
  ({ releaseId, trackId, trackName, audioFile, type }) =>
  async dispatch => {
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('releaseId', releaseId);
      formData.append('trackId', trackId);
      formData.append('trackName', trackName);
      formData.append('file', audioFile, audioFile.name);
      const cancelToken = dispatch(getCancelToken(trackId));

      const config = {
        onUploadProgress: event => {
          const percent = Math.floor((event.loaded / event.total) * 100);
          dispatch(setUploadProgress({ trackId, percent }));
        },
        cancelToken
      };

      await axios.post('/api/track/upload', formData, config);
    } catch (error) {
      if (axios.isCancel(error)) {
        return toastInfo('Upload cancelled.');
      }

      toastError(error.response.data.error);
      dispatch(setUploadProgress({ trackId, percent: 0 }));
    }
  };

export const {
  cancelUpload,
  setDeletingComplete,
  setDeletingStart,
  setEncodingComplete,
  setEncodingProgressFLAC,
  setStoringProgressFLAC,
  setTrackIdsForDeletion,
  setTranscodingComplete,
  setTranscodingProgressAAC,
  setUploadProgress
} = trackSlice.actions;

export { addTrack, deleteTrack, getCancelToken, moveTrack, uploadAudio };
export default trackSlice.reducer;
