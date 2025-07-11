import { AppDispatch, GetState, RootState } from "@/main";
import { checkRelease, checkTrackList } from "@/pages/editRelease/validation";
import { toastError, toastSuccess } from "@/state/toast";
import { EditorRelease, Release, ReleaseErrors, ReleaseTrack, TrackErrors } from "@/types";
import { createObjectId, formatPrice } from "@/utils";
import { EntityState, createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { DateTime } from "luxon";

interface EditorState {
  artworkUploading: boolean;
  artworkUploadProgress: number;
  isLoading: boolean;
  isSubmitting: boolean;
  release: EditorRelease;
  releaseErrors: ReleaseErrors;
  trackErrors: TrackErrors;
  trackList: EntityState<ReleaseTrack, string>;
}

const defaultErrorState: ReleaseErrors = {
  artistName: "",
  price: "",
  releaseDate: "",
  releaseTitle: ""
};

const tracksAdapter = createEntityAdapter({
  selectId: (track: ReleaseTrack) => track._id
});

const defaultReleaseState: EditorRelease = {
  _id: "",
  artist: "",
  artistName: "",
  artwork: { status: "" },
  catNumber: "",
  credits: "",
  info: "",
  price: "10.00",
  published: false,
  pubName: "",
  pubYear: "",
  recName: "",
  recordLabel: "",
  recYear: "",
  releaseDate: DateTime.local().toISODate(),
  releaseTitle: "",
  tags: []
};

const initialState: EditorState = {
  artworkUploading: false,
  artworkUploadProgress: 0,
  isLoading: false,
  isSubmitting: false,
  release: defaultReleaseState,
  releaseErrors: defaultErrorState,
  trackErrors: {},
  trackList: tracksAdapter.getInitialState()
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    createRelease(state) {
      state.artworkUploading = false;
      state.artworkUploadProgress = 0;
      state.isLoading = false;
      state.isSubmitting = false;
      state.release = {
        ...defaultReleaseState,
        _id: createObjectId(),
        releaseDate: DateTime.local().toISODate()
      };
      state.releaseErrors = { ...defaultErrorState };
      state.trackErrors = {};
      state.trackList = tracksAdapter.getInitialState();
    },
    removeTag(state, action) {
      state.release.tags = state.release.tags.filter((t: string) => t !== action.payload);
    },
    removeTags(state) {
      state.release.tags = [];
    },
    setFormattedPrice(state) {
      state.release.price = formatPrice(state.release.price);
    },
    setArtworkUploading(state, action) {
      state.artworkUploading = action.payload;
    },
    setArtworkUploadProgress(state, action) {
      state.artworkUploadProgress = action.payload;
    },
    setErrors(state, action) {
      state.releaseErrors = action.payload;
    },
    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },
    setIsSubmitting(state, action) {
      state.isSubmitting = action.payload;
    },
    setRelease(state, action) {
      state.release = action.payload;
    },
    setTrackList(state, action) {
      const { trackList } = action.payload;
      tracksAdapter.setAll(state.trackList, trackList);
    },
    setTrackErrors(state, action) {
      state.trackErrors = action.payload;
    },
    trackAdd(state) {
      const newTrack: ReleaseTrack = {
        _id: createObjectId(),
        duration: 0,
        isBonus: false,
        isEditionOnly: false,
        price: "1.50",
        status: "pending",
        trackTitle: ""
      };

      tracksAdapter.addOne(state.trackList, newTrack);
    },
    trackMove(state, action) {
      const { idFrom, idTo } = action.payload;
      const trackIds = [...tracksAdapter.getSelectors().selectIds(state.trackList)];
      const indexFrom = trackIds.findIndex(id => id === idFrom);
      const indexTo = trackIds.findIndex(id => id === idTo);
      const tracks = [...tracksAdapter.getSelectors().selectAll(state.trackList)];
      const nextTrackList = [...tracks];
      nextTrackList.splice(indexTo, 0, ...nextTrackList.splice(indexFrom, 1));
      tracksAdapter.setAll(state.trackList, nextTrackList);
    },
    trackNudge(state, action) {
      const { trackId, direction } = action.payload;
      const { selectAll, selectIds, selectTotal } = tracksAdapter.getSelectors();
      const trackIds = [...selectIds(state.trackList)];
      const indexFrom = trackIds.findIndex(id => id === trackId);
      const indexTo = direction === "up" ? indexFrom - 1 : indexFrom + 1;
      if (indexTo < 0 || indexTo >= selectTotal(state.trackList)) return;
      const tracks = [...selectAll(state.trackList)];
      const nextTrackList = [...tracks];
      nextTrackList.splice(indexTo, 0, ...nextTrackList.splice(indexFrom, 1));
      tracksAdapter.setAll(state.trackList, nextTrackList);
    },
    trackRemove(state, action) {
      const trackId = action.payload;
      tracksAdapter.removeOne(state.trackList, action.payload);

      if (state.trackErrors[`${trackId}.trackTitle`]) {
        delete state.trackErrors[`${trackId}.trackTitle`];
      }
    },
    trackSetError(state, action) {
      const { trackId, name, value } = action.payload;
      state.trackErrors[`${trackId}.${name}`] = value;
    },
    trackUpdate(state, action) {
      const { id, changes } = action.payload;

      if (state.trackErrors[`${id}.trackTitle`]) {
        delete state.trackErrors[`${id}.trackTitle`];
      }

      tracksAdapter.updateOne(state.trackList, { id, changes });
    },
    updateTrackStatus(state, action) {
      tracksAdapter.updateOne(state.trackList, action.payload);
    },
    updateRelease(state, action) {
      const { name, type, value, checked } = action.payload;

      if (state.releaseErrors[name]) {
        state.releaseErrors[name] = "";
      }

      if (name === "releaseDate" && value) {
        const [dateValue] = new Date(value).toISOString().split("T");
        state.release.releaseDate = dateValue;
      } else if (name === "artist") {
        state.release.artistName = "";
        state.release.artist = value;
        state.releaseErrors[name] = "";
        state.releaseErrors.artistName = "";
      } else if (name === "artistName") {
        state.release.artist = "";
        state.release.artistName = value;
        state.releaseErrors[name] = "";
        state.releaseErrors.artist = "";
      } else if (name === "tags") {
        const tag = value
          .replace(/[^0-9a-z\s]/gi, "")
          .trim()
          .toLowerCase();

        if (!tag) return;
        state.release.tags = [...new Set([...state.release.tags, tag])];
      } else {
        state.release[name] = type === "checkbox" ? checked : value;
      }
    }
  }
});

const fetchReleaseForEditing = (releaseId: string) => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get(`/api/release/${releaseId}`);
    const release = res.data as Release;
    const { trackList, ...rest } = release;
    const releaseDate = DateTime.fromISO(release.releaseDate).toISODate() || "";
    dispatch(setRelease({ ...rest, releaseDate }));
    dispatch(setTrackList({ trackList }));
  } catch (error: any) {
    dispatch(toastError({ message: "Release currently unavailable.", title: "Error" }));
    throw error;
  }
};

const saveRelease = () => async (dispatch: AppDispatch, getState: GetState) => {
  const state = getState();
  const { release } = state.editor;
  const trackList = selectTracks(state);
  const releaseErrors = checkRelease(release);
  const trackErrors = checkTrackList(trackList);
  dispatch(setErrors(releaseErrors));
  dispatch(setTrackErrors(trackErrors));
  const hasErrors = Object.values({ ...releaseErrors, ...trackErrors }).some(Boolean);
  if (hasErrors) return hasErrors;
  const { _id: releaseId, releaseTitle } = release;

  try {
    dispatch(setIsSubmitting(true));
    await axios.post(`/api/release/${releaseId}`, { ...release, trackList });
    const message = `${releaseTitle ? `'${releaseTitle}'` : "Release"} has been updated.`;
    dispatch(toastSuccess({ message, title: "Saved" }));
  } catch (error: any) {
    dispatch(toastError({ message: error.response?.data?.error || error.message, title: "Error" }));
  } finally {
    dispatch(setIsSubmitting(false));
  }
};

export const {
  createRelease,
  removeTag,
  removeTags,
  trackAdd,
  trackMove,
  trackRemove,
  trackSetError,
  trackUpdate,
  setArtworkUploading,
  setArtworkUploadProgress,
  setErrors,
  setFormattedPrice,
  setIsLoading,
  setIsSubmitting,
  trackNudge,
  setRelease,
  setTrackErrors,
  setTrackList,
  updateRelease,
  updateTrackStatus
} = editorSlice.actions;

const {
  selectAll: selectTracks,
  selectIds: selectTrackIds,
  selectById: selectTrackById,
  selectTotal: selectTrackListSize
} = tracksAdapter.getSelectors((state: RootState) => state.editor.trackList);

export {
  defaultReleaseState,
  fetchReleaseForEditing,
  saveRelease,
  selectTrackById,
  selectTrackIds,
  selectTrackListSize,
  selectTracks
};
export default editorSlice.reducer;
