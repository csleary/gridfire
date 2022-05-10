import { toastError, toastInfo, toastSuccess } from "state/toast";
import axios from "axios";
import { createSlice } from "@reduxjs/toolkit";
import { setActiveRelease } from "state/releases";
const calls = new Map();

const trackSlice = createSlice({
  name: "tracks",
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

const deleteTrack = (releaseId, trackId, trackTitle) => async (dispatch, getState) => {
  try {
    if (getState().tracks.trackIdsForDeletion[trackId]) {
      await axios.delete(`/api/track/${releaseId}/${trackId}`);
      const message = `${trackTitle ? `\u2018${trackTitle}\u2019` : "Track"} deleted.`;
      dispatch(toastSuccess({ message, title: "Done" }));
      dispatch(setTrackIdsForDeletion({ trackId, isDeleting: false }));
    } else {
      dispatch(setTrackIdsForDeletion({ trackId, isDeleting: true }));
    }
  } catch (error) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const getCancelToken = uploadId => () => {
  const call = axios.CancelToken.source();
  calls.set(uploadId, call);
  return call.token;
};

const uploadAudio =
  ({ releaseId, trackId, trackName, audioFile, mimeType }) =>
  async dispatch => {
    try {
      const formData = new FormData();
      formData.append("trackId", trackId);
      formData.append("trackName", trackName);
      formData.append("trackAudioFile", audioFile, audioFile.name);
      const cancelToken = dispatch(getCancelToken(trackId));

      const config = {
        onUploadProgress: event => {
          const percent = Math.floor((event.loaded / event.total) * 100);
          dispatch(setUploadProgress({ trackId, percent }));
        },
        cancelToken
      };

      await axios.post(`/api/track/${releaseId}/upload`, formData, config);
    } catch (error) {
      if (axios.isCancel(error)) {
        return toastInfo({ message: "Upload cancelled.", title: "Cancelled" });
      }

      toastError({ message: error.response.data.error });
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

export { deleteTrack, getCancelToken, uploadAudio };
export default trackSlice.reducer;
