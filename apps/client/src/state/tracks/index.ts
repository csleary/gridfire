import { AppDispatch, GetState } from "index";
import { EntityId, createSlice, nanoid } from "@reduxjs/toolkit";
import { addActiveProcess, removeActiveProcess } from "state/user";
import axios, { AxiosProgressEvent } from "axios";
import { toastError, toastInfo, toastSuccess } from "state/toast";
import { selectTrackById, trackRemove } from "state/editor";

const calls = new Map();

interface TracksState {
  audioUploadProgress: { [key: string]: number };
  encodingCompleteFLAC: { [key: string]: boolean };
  encodingProgressFLAC: { [key: string]: number };
  pipelineErrors: { [key: string]: { [key: string]: string } };
  storingProgressFLAC: { [key: string]: number };
  trackIdsForDeletion: { [key: string]: boolean };
  transcodingCompleteAAC: { [key: string]: boolean };
  transcodingCompleteMP3: { [key: string]: boolean };
  transcodingStartedAAC: { [key: string]: boolean };
  transcodingStartedMP3: { [key: string]: boolean };
  uploadCancelled: boolean;
}

const initialState: TracksState = {
  audioUploadProgress: {},
  encodingCompleteFLAC: {},
  encodingProgressFLAC: {},
  pipelineErrors: {},
  storingProgressFLAC: {},
  trackIdsForDeletion: {},
  transcodingCompleteAAC: {},
  transcodingCompleteMP3: {},
  transcodingStartedAAC: {},
  transcodingStartedMP3: {},
  uploadCancelled: false
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

const deleteTrack = (trackId: EntityId) => async (dispatch: AppDispatch, getState: GetState) => {
  try {
    if (getState().tracks.trackIdsForDeletion[trackId]) {
      dispatch(trackRemove(trackId));
      await axios.delete(`/api/track/${trackId}`);
      const trackTitle = selectTrackById(getState(), trackId)?.trackTitle || "";
      const message = `${trackTitle ? `'${trackTitle}'` : "Track"} deleted.`;
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

const getCancelToken = (uploadId: EntityId) => () => {
  const call = axios.CancelToken.source();
  calls.set(uploadId, call);
  return call.token;
};

interface UploadAudioParams {
  audioFile: File;
  releaseId: string;
  trackId: EntityId;
  trackTitle: string;
}

const uploadAudio =
  ({ releaseId, trackId, trackTitle, audioFile }: UploadAudioParams) =>
  async (dispatch: AppDispatch) => {
    const processId = nanoid();

    dispatch(
      addActiveProcess({
        id: processId,
        description: `Uploading audio for '${trackTitle}'…`,
        type: "upload"
      })
    );

    try {
      dispatch(setUploadProgress({ trackId, progress: 0 }));
      const formData = new FormData();
      formData.append("releaseId", releaseId);
      formData.append("trackId", trackId as string);
      formData.append("trackTitle", trackTitle);
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
    } finally {
      dispatch(removeActiveProcess(processId));
    }
  };

export const {
  cancelUpload,
  setEncodingProgressFLAC,
  setPipelineError,
  setStoringProgressFLAC,
  setTrackIdsForDeletion,
  setTranscodingCompleteAAC,
  setTranscodingCompleteMP3,
  setTranscodingStartedAAC,
  setTranscodingStartedMP3,
  setUploadProgress
} = trackSlice.actions;

export { deleteTrack, getCancelToken, uploadAudio };
export default trackSlice.reducer;
