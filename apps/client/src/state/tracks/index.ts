import { createSlice, nanoid } from "@reduxjs/toolkit";
import axios, { AxiosProgressEvent } from "axios";

import { selectTrackById, trackRemove } from "@/state/editor";
import { toastError, toastInfo, toastSuccess } from "@/state/toast";
import { addActiveProcess, removeActiveProcess } from "@/state/user";
import { AppDispatch, GetState } from "@/types";

const controllers = new Map<string, AbortController>();

interface TracksState {
  audioUploadProgress: Record<string, number>;
  encodingCompleteFLAC: Record<string, boolean>;
  encodingProgressFLAC: Record<string, number>;
  pipelineErrors: Record<string, Record<string, string>>;
  storingProgressFLAC: Record<string, number>;
  trackIdsForDeletion: Record<string, boolean>;
  transcodingCompleteAAC: Record<string, boolean>;
  transcodingCompleteMP3: Record<string, boolean>;
  transcodingStartedAAC: Record<string, boolean>;
  transcodingStartedMP3: Record<string, boolean>;
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
  transcodingStartedMP3: {}
};

const trackSlice = createSlice({
  initialState,
  name: "tracks",
  reducers: {
    setEncodingProgressFLAC(state, action) {
      const { progress, trackId } = action.payload;
      state.encodingProgressFLAC[trackId] = progress;
    },
    setPipelineError(state, action) {
      const { message, stage, trackId } = action.payload;
      if (!state.pipelineErrors[trackId]) state.pipelineErrors[trackId] = {};
      state.pipelineErrors[trackId][stage] = message || "";
    },
    setStoringProgressFLAC(state, action) {
      const { progress, trackId } = action.payload;
      state.storingProgressFLAC[trackId] = progress;
    },
    setTrackDefaults(state, action) {
      const { trackId } = action.payload;
      state.audioUploadProgress[trackId] = 0;
      state.encodingCompleteFLAC[trackId] = false;
      state.encodingProgressFLAC[trackId] = 0;
      state.pipelineErrors[trackId] = {};
      state.storingProgressFLAC[trackId] = 0;
      state.trackIdsForDeletion[trackId] = false;
      state.transcodingCompleteAAC[trackId] = false;
      state.transcodingCompleteMP3[trackId] = false;
      state.transcodingStartedAAC[trackId] = false;
      state.transcodingStartedMP3[trackId] = false;
    },
    setTrackIdsForDeletion(state, action) {
      const { isDeleting, trackId } = action.payload;
      state.trackIdsForDeletion[trackId] = isDeleting;
    },
    setTranscodingCompleteAAC(state, action) {
      const { isComplete, trackId } = action.payload;
      state.transcodingCompleteAAC[trackId] = isComplete ?? true;
    },
    setTranscodingCompleteMP3(state, action) {
      const { isComplete, trackId } = action.payload;
      state.transcodingCompleteMP3[trackId] = isComplete ?? true;
    },
    setTranscodingStartedAAC(state, action) {
      const { isStarted, trackId } = action.payload;
      state.transcodingStartedAAC[trackId] = isStarted ?? true;
    },
    setTranscodingStartedMP3(state, action) {
      const { isStarted, trackId } = action.payload;
      state.transcodingStartedMP3[trackId] = isStarted ?? true;
    },
    setUploadProgress(state, action) {
      const { progress, trackId } = action.payload;
      state.audioUploadProgress[trackId] = progress;
    }
  }
});

const deleteTrack = (trackId: string) => async (dispatch: AppDispatch, getState: GetState) => {
  try {
    if (getState().tracks.trackIdsForDeletion[trackId]) {
      dispatch(trackRemove(trackId));
      await axios.delete(`/api/track/${trackId}`);
      const trackTitle = selectTrackById(getState(), trackId)?.trackTitle || "";
      const message = `${trackTitle ? `'${trackTitle}'` : "Track"} deleted.`;
      dispatch(toastSuccess({ message, title: "Done" }));
      dispatch(setTrackIdsForDeletion({ isDeleting: false, trackId }));
    } else {
      dispatch(setTrackIdsForDeletion({ isDeleting: true, trackId }));
    }
  } catch (error: any) {
    if (error.response?.status === 404) return;
    dispatch(toastError({ message: error.response?.data?.error, title: "Error" }));
  }
};

const cancelUpload = (trackId: string) => (dispatch: AppDispatch) => {
  const controller = controllers.get(trackId);

  if (controller) {
    controller.abort();
    controllers.delete(trackId);
    dispatch(setTrackDefaults({ trackId }));
    dispatch(toastInfo({ message: "Upload cancelled.", title: "Cancelled" }));
  }
};

const getAbortController = (trackId: string) => {
  let controller = controllers.get(trackId);

  if (!controller) {
    controller = new AbortController();
    controllers.set(trackId, controller);
  }

  return controller;
};

interface UploadAudioParams {
  audioFile: File;
  releaseId: string;
  trackId: string;
  trackTitle: string;
}

const reEncodeTrack = (trackId: string) => async (dispatch: AppDispatch, getState: GetState) => {
  const track = selectTrackById(getState(), trackId);
  if (!track) return;
  const { status, trackTitle } = track;
  if (status !== "stored") return;

  try {
    dispatch(setTranscodingStartedAAC({ isStarted: false, trackId }));
    dispatch(setTranscodingStartedMP3({ isStarted: false, trackId }));
    dispatch(setTranscodingCompleteAAC({ isComplete: false, trackId }));
    dispatch(setTranscodingCompleteMP3({ isComplete: false, trackId }));
    await axios.patch(`/api/track/${trackId}`);
    dispatch(toastSuccess({ message: `Re-encoding '${trackTitle}'…`, title: "Re-encoding" }));
  } catch (error) {
    dispatch(toastError({ message: `We were unable to re-enqueue '${trackTitle}' for encoding.`, title: "Error" }));
  }
};

const uploadAudio =
  ({ audioFile, releaseId, trackId, trackTitle }: UploadAudioParams) =>
  async (dispatch: AppDispatch) => {
    const processId = nanoid();

    dispatch(
      addActiveProcess({
        description: `Uploading audio for '${trackTitle}'…`,
        id: processId,
        type: "upload"
      })
    );

    try {
      dispatch(setTrackDefaults({ trackId }));
      const formData = new FormData();
      formData.append("releaseId", releaseId);
      formData.append("trackId", trackId);
      formData.append("trackTitle", trackTitle);
      formData.append("trackAudioFile", audioFile, audioFile.name);
      const controller = getAbortController(trackId);

      const config = {
        onUploadProgress: (event: AxiosProgressEvent) => {
          const progress = Math.floor((event.loaded / (event.total || 0)) * 100);
          dispatch(setUploadProgress({ progress, trackId }));
        },
        signal: controller.signal
      };

      await axios.put("/api/track", formData, config);
    } catch (error: any) {
      if (axios.isCancel(error)) {
        return;
      }

      dispatch(toastError({ message: `Upload failed! ${error.message}`, title: "Error" }));
    } finally {
      controllers.delete(trackId);
      dispatch(removeActiveProcess(processId));
    }
  };

export const {
  setEncodingProgressFLAC,
  setPipelineError,
  setStoringProgressFLAC,
  setTrackDefaults,
  setTrackIdsForDeletion,
  setTranscodingCompleteAAC,
  setTranscodingCompleteMP3,
  setTranscodingStartedAAC,
  setTranscodingStartedMP3,
  setUploadProgress
} = trackSlice.actions;

export type { TracksState };
export { cancelUpload, deleteTrack, reEncodeTrack, uploadAudio };
export default trackSlice.reducer;
