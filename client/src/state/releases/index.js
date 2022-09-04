import { toastError, toastSuccess } from "state/toast";
import axios from "axios";
import { createObjectId } from "utils";
import { createSlice } from "@reduxjs/toolkit";

const defaultReleaseState = {
  _id: "",
  artist: "",
  artistName: "",
  artwork: { cid: "", status: "" },
  catNumber: "",
  credits: "",
  info: "",
  price: 0,
  pubName: "",
  pubYear: null,
  recName: "",
  recYear: null,
  recordLabel: "",
  releaseDate: "",
  releaseTitle: "",
  tags: [],
  trackList: []
};

const releaseSlice = createSlice({
  name: "releases",
  initialState: {
    activeRelease: defaultReleaseState,
    artist: {},
    artworkUploading: false,
    artworkUploadProgress: 0,
    isLoading: false,
    catalogue: [],
    catalogueLimit: 12,
    catalogueSkip: 0,
    collection: {},
    reachedEndOfCat: false,
    releaseIdsForDeletion: {},
    userFavourites: [],
    userReleases: [],
    userWishList: []
  },
  reducers: {
    addTrack(state, action) {
      const { trackList } = state.activeRelease;
      state.activeRelease.trackList = [...trackList, action.payload];
    },
    createRelease(state) {
      state.activeRelease = {
        ...defaultReleaseState,
        _id: createObjectId(),
        releaseDate: new Date(Date.now()).toISOString()
      };
    },
    removeRelease(state, action) {
      if (state.userReleases) state.userReleases = state.userReleases.filter(release => release._id !== action.payload);
    },
    setArtistCatalogue(state, action) {
      state.artist = action.payload;
      state.isLoading = false;
    },
    setArtworkUploading(state, action) {
      state.artworkUploading = action.payload;
    },
    setArtworkUploadProgress(state, action) {
      state.artworkUploadProgress = action.payload;
    },
    setCatalogue(state, action) {
      const { catalogue, isPaging } = action.payload;
      const reachedEndOfCat = catalogue.length < state.catalogueLimit ? true : false;
      state.catalogue = isPaging ? [...state.catalogue, ...catalogue] : catalogue;
      state.catalogueSkip = isPaging ? state.catalogueSkip + state.catalogueLimit : 0;
      state.reachedEndOfCat = reachedEndOfCat;
    },
    setCollection(state, action) {
      state.collection = action.payload;
    },
    setActiveRelease(state, action) {
      state.activeRelease = action.payload;
    },
    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },
    setReleaseIdsForDeletion(state, action) {
      const { releaseId, isDeleting } = action.payload;
      state.releaseIdsForDeletion = { ...state.releaseIdsForDeletion, [releaseId]: isDeleting };
    },
    setUserFavourites(state, action) {
      state.userFavourites = action.payload;
    },
    setUserReleases(state, action) {
      state.userReleases = action.payload;
    },
    setUserWishList(state, action) {
      state.userWishList = action.payload;
    },
    updateTrackStatus(state, action) {
      const { releaseId, trackId, status } = action.payload;
      const currentId = state.activeRelease?._id;

      if (!currentId || currentId === releaseId) {
        state.activeRelease.trackList = state.activeRelease.trackList.map(prevTrack =>
          prevTrack._id === trackId ? { ...prevTrack, status } : prevTrack
        );
      }
    },
    updateUserReleases(state, action) {
      state.isLoading = false;
      state.userReleases = state.userReleases.map(release => {
        if (release._id === action.payload._id) return action.payload;
        return release;
      });
    }
  }
});

const deleteRelease =
  (releaseId, releaseTitle = "release") =>
  async (dispatch, getState) => {
    try {
      if (getState().releases.releaseIdsForDeletion[releaseId]) {
        dispatch(removeRelease(releaseId));
        await axios.delete(`/api/release/${releaseId}`);
        dispatch(toastSuccess({ message: `Successfully deleted ${releaseTitle}.`, title: "Deleted" }));
        dispatch(setReleaseIdsForDeletion({ releaseId, isDeleting: false }));
      } else {
        dispatch(setReleaseIdsForDeletion({ releaseId, isDeleting: true }));
      }
    } catch (error) {
      dispatch(toastError({ message: error.response.data.error, title: "Error" }));
    }
  };

const fetchArtistCatalogue =
  (artistId = null, artistSlug = null) =>
  async dispatch => {
    dispatch(setIsLoading(true));
    const res = await axios.get(`/api/catalogue/${artistSlug || artistId}`);
    dispatch(setArtistCatalogue(res.data));
  };

const fetchCatalogue =
  ({ catalogueLimit, catalogueSkip, sortBy, sortOrder, isPaging = false }) =>
  async dispatch => {
    try {
      const res = await axios.get("/api/catalogue", {
        params: {
          catalogueLimit,
          catalogueSkip: isPaging ? catalogueSkip + catalogueLimit : 0,
          sortBy,
          sortOrder
        }
      });
      dispatch(setCatalogue({ catalogue: res.data, isPaging }));
    } catch (error) {
      dispatch(setIsLoading(false));
      dispatch(toastError({ message: error.response?.data?.error, title: "Error" }));
    }
  };

const fetchCollection = () => async dispatch => {
  try {
    const res = await axios.get("/api/user/collection");
    dispatch(setCollection(res.data));
  } catch (error) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const fetchRelease = releaseId => async dispatch => {
  try {
    const res = await axios.get(`/api/release/${releaseId}`);
    dispatch(setActiveRelease(res.data.release));
  } catch (error) {
    dispatch(toastError({ message: "Release currently unavailable.", title: "Error" }));
  }
};

const fetchUserReleases = () => async dispatch => {
  const res = await axios.get("/api/user/releases");
  dispatch(setUserReleases(res.data));
};

const fetchUserFavourites = () => async dispatch => {
  try {
    const res = await axios.get("/api/user/favourites");
    if (res.data) dispatch(setUserFavourites(res.data));
  } catch (error) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const fetchUserWishList = () => async dispatch => {
  try {
    const res = await axios.get("/api/user/wishlist");
    if (res.data) dispatch(setUserWishList(res.data));
  } catch (error) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const publishStatus = releaseId => async dispatch => {
  try {
    const res = await axios.patch(`/api/release/${releaseId}`);
    if (res.data.error) return dispatch(toastError({ message: res.data.error, title: "Error" }));
    dispatch(updateUserReleases(res.data));
    return true;
  } catch (error) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const updateRelease = values => async dispatch => {
  try {
    const res = await axios.post("/api/release", values);
    dispatch(setActiveRelease(res.data));
  } catch (error) {
    dispatch(toastError({ message: error.response?.data?.error || error.message, title: "Error" }));
  }
};

export const {
  addTrack,
  createRelease,
  removeRelease,
  setActiveRelease,
  setArtistCatalogue,
  setArtworkUploading,
  setArtworkUploadProgress,
  setCatalogue,
  setCollection,
  setIsLoading,
  setReleaseIdsForDeletion,
  setReleasePurchaseInfo,
  setUserFavourites,
  setUserReleases,
  setUserWishList,
  updateTrackStatus,
  updateUserReleases
} = releaseSlice.actions;

export {
  deleteRelease,
  fetchArtistCatalogue,
  fetchCatalogue,
  fetchCollection,
  fetchRelease,
  fetchUserFavourites,
  fetchUserWishList,
  fetchUserReleases,
  publishStatus,
  updateRelease
};

export default releaseSlice.reducer;
