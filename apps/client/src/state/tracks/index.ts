import { AppDispatch, GetState } from "@/main";
import { selectTrackById, trackRemove } from "@/state/editor";
import { toastError, toastInfo, toastSuccess } from "@/state/toast";
import { addActiveProcess, removeActiveProcess } from "@/state/user";
import { EntityId, createSlice, nanoid } from "@reduxjs/toolkit";
import axios, { AxiosProgressEvent } from "axios";

const controllers = new Map<EntityId, AbortController>();

interface TracksState {
  audioUploadProgress: Record<EntityId, number>;
  encodingCompleteFLAC: Record<EntityId, boolean>;
  encodingProgressFLAC: Record<EntityId, number>;
  pipelineErrors: Record<EntityId, Record<EntityId, string>>;
  storingProgressFLAC: Record<EntityId, number>;
  trackIdsForDeletion: Record<EntityId, boolean>;
  transcodingCompleteAAC: Record<EntityId, boolean>;
  transcodingCompleteMP3: Record<EntityId, boolean>;
  transcodingStartedAAC: Record<EntityId, boolean>;
  transcodingStartedMP3: Record<EntityId, boolean>;
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
  name: "tracks",
  initialState,
  reducers: {
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
      const { trackId, isDeleting } = action.payload;
      state.trackIdsForDeletion[trackId] = isDeleting;
    },
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
    setTranscodingCompleteAAC(state, action) {
      const { trackId, isComplete } = action.payload;
      state.transcodingCompleteAAC[trackId] = isComplete ?? true;
    },
    setTranscodingCompleteMP3(state, action) {
      const { trackId, isComplete } = action.payload;
      state.transcodingCompleteMP3[trackId] = isComplete ?? true;
    },
    setTranscodingStartedAAC(state, action) {
      const { trackId, isStarted } = action.payload;
      state.transcodingStartedAAC[trackId] = isStarted ?? true;
    },
    setTranscodingStartedMP3(state, action) {
      const { trackId, isStarted } = action.payload;
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
      dispatch(setTrackIdsForDeletion({ trackId, isDeleting: false }));
    } else {
      dispatch(setTrackIdsForDeletion({ trackId, isDeleting: true }));
    }
  } catch (error: any) {
    if (error.response?.status === 404) return;
    dispatch(toastError({ message: error.response?.data?.error, title: "Error" }));
  }
};

const cancelUpload = (trackId: EntityId) => (dispatch: AppDispatch) => {
  const controller = controllers.get(trackId);

  if (controller) {
    controller.abort();
    controllers.delete(trackId);
    dispatch(setTrackDefaults({ trackId }));
    dispatch(toastInfo({ message: "Upload cancelled.", title: "Cancelled" }));
  }
};

const getAbortController = (trackId: EntityId) => {
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
    dispatch(setTranscodingStartedAAC({ trackId, isStarted: false }));
    dispatch(setTranscodingStartedMP3({ trackId, isStarted: false }));
    dispatch(setTranscodingCompleteAAC({ trackId, isComplete: false }));
    dispatch(setTranscodingCompleteMP3({ trackId, isComplete: false }));
    await axios.patch(`/api/track/${trackId}`);
    dispatch(toastSuccess({ message: `Re-encoding '${trackTitle}'…`, title: "Re-encoding" }));
  } catch (error) {
    dispatch(toastError({ message: `We were unable to re-enqueue '${trackTitle}' for encoding.`, title: "Error" }));
  }
};

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
          dispatch(setUploadProgress({ trackId, progress }));
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

export { cancelUpload, deleteTrack, reEncodeTrack, uploadAudio };
export default trackSlice.reducer;
