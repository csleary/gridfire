import { toastError, toastInfo, toastSuccess } from "state/toast";
import { AppDispatch, GetState } from "index";
import axios, { AxiosProgressEvent } from "axios";
import { createSlice } from "@reduxjs/toolkit";

const calls = new Map();

interface TracksState {
  uploadCancelled: boolean;
  audioUploadProgress: { [key: string]: number };
  encodingProgressFLAC: { [key: string]: number };
  encodingCompleteFLAC: { [key: string]: boolean };
  pipelineErrors: { [key: string]: { [key: string]: string } };
  storingProgressFLAC: { [key: string]: number };
  transcodingStartedAAC: { [key: string]: boolean };
  transcodingCompleteAAC: { [key: string]: boolean };
  transcodingStartedMP3: { [key: string]: boolean };
  transcodingCompleteMP3: { [key: string]: boolean };
  trackIdsForDeletion: { [key: string]: boolean };
}

const initialState: TracksState = {
  uploadCancelled: false,
  audioUploadProgress: {},
  encodingProgressFLAC: {},
  encodingCompleteFLAC: {},
  pipelineErrors: {},
  storingProgressFLAC: {},
  transcodingStartedAAC: {},
  transcodingCompleteAAC: {},
  transcodingStartedMP3: {},
  transcodingCompleteMP3: {},
  trackIdsForDeletion: {}
};

const trackSlice = createSlice({
  name: "tracks",
  initialState,
  reducers: {
    cancelUpload(state, action) {
      const trackId = action.payload;
      const call = calls.get(trackId);

      if (call) {
        call.cancel();
        calls.delete(trackId);
      }

      state.audioUploadProgress = { ...state.audioUploadProgress, [trackId]: 0 };
    },
    setUploadProgress(state, action) {
      const { progress, trackId } = action.payload;
      state.audioUploadProgress = { ...state.audioUploadProgress, [trackId]: progress };
    },
    setEncodingProgressFLAC(state, action) {
      const { progress, trackId } = action.payload;
      state.encodingProgressFLAC = { ...state.encodingProgressFLAC, [trackId]: progress };
    },
    setPipelineError(state, action) {
      const { message, stage, trackId } = action.payload;

      state.pipelineErrors = {
        ...state.pipelineErrors,
        [trackId]: { ...state.pipelineErrors[trackId], [stage]: message || "" }
      };
    },
    setStoringProgressFLAC(state, action) {
      const { progress, trackId } = action.payload;
      state.storingProgressFLAC = { ...state.storingProgressFLAC, [trackId]: progress };
    },
    setTranscodingStartedAAC(state, action) {
      const { trackId } = action.payload;
      state.transcodingStartedAAC = { ...state.transcodingStartedAAC, [trackId]: true };
    },
    setTranscodingCompleteAAC(state, action) {
      const { trackId } = action.payload;
      state.transcodingCompleteAAC = { ...state.transcodingCompleteAAC, [trackId]: true };
    },
    setTranscodingStartedMP3(state, action) {
      const { trackId } = action.payload;
      state.transcodingStartedMP3 = { ...state.transcodingStartedMP3, [trackId]: true };
    },
    setTranscodingCompleteMP3(state, action) {
      const { trackId } = action.payload;
      state.transcodingCompleteMP3 = { ...state.transcodingCompleteMP3, [trackId]: true };
    },
    setTrackIdsForDeletion(state, action) {
      const { trackId, isDeleting } = action.payload;
      state.trackIdsForDeletion = { ...state.trackIdsForDeletion, [trackId]: isDeleting };
    }
  }
});

const deleteTrack = (trackId: string, trackTitle: string) => async (dispatch: AppDispatch, getState: GetState) => {
  try {
    if (getState().tracks.trackIdsForDeletion[trackId]) {
      await axios.delete(`/api/track/${trackId}`);
      const message = `${trackTitle ? `\u2018${trackTitle}\u2019` : "Track"} deleted.`;
      dispatch(toastSuccess({ message, title: "Done" }));
      dispatch(setTrackIdsForDeletion({ trackId, isDeleting: false }));
    } else {
      dispatch(setTrackIdsForDeletion({ trackId, isDeleting: true }));
    }
  } catch (error: any) {
    if (error.response?.status === 404) return;
    dispatch(toastError({ message: error.response?.data?.error, title: "Error" }));
  }
};

const getCancelToken = (uploadId: string) => () => {
  const call = axios.CancelToken.source();
  calls.set(uploadId, call);
  return call.token;
};

interface UploadAudioParams {
  releaseId: string;
  trackId: string;
  trackName: string;
  audioFile: File;
}

const uploadAudio =
  ({ releaseId, trackId, trackName, audioFile }: UploadAudioParams) =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setUploadProgress({ trackId, progress: 0 }));
      const formData = new FormData();
      formData.append("releaseId", releaseId);
      formData.append("trackId", trackId);
      formData.append("trackName", trackName);
      formData.append("trackAudioFile", audioFile, audioFile.name);
      const cancelToken = dispatch(getCancelToken(trackId));

      const config = {
        onUploadProgress: (event: AxiosProgressEvent) => {
          const progress = Math.floor((event.loaded / (event.total || 0)) * 100);
          dispatch(setUploadProgress({ trackId, progress }));
        },
        cancelToken
      };

      await axios.put("/api/track", formData, config);
    } catch (error) {
      if (axios.isCancel(error)) {
        return toastInfo({ message: "Upload cancelled.", title: "Cancelled" });
      }

      toastError({ message: "We encountered an error uploading this track." });
      dispatch(setUploadProgress({ trackId, progress: 0 }));
    }
  };

export const {
  cancelUpload,
  setEncodingProgressFLAC,
  setPipelineError,
  setStoringProgressFLAC,
  setTranscodingStartedAAC,
  setTranscodingCompleteAAC,
  setTranscodingStartedMP3,
  setTranscodingCompleteMP3,
  setTrackIdsForDeletion,
  setUploadProgress
} = trackSlice.actions;

export { deleteTrack, getCancelToken, uploadAudio };
export default trackSlice.reducer;
