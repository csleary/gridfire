import { toastError, toastSuccess } from "state/toast";
import { Artist, Collection, CollectionEdition, Favourite, ListItem, Release, UserRelease } from "types";
import { DateTime } from "luxon";
import axios from "axios";
import { createSlice } from "@reduxjs/toolkit";
import { getUserEditions } from "web3";
import { AppDispatch, GetState } from "index";

interface ReleasesState {
  activeRelease: Release;
  artist: Artist;
  artworkUploading: boolean;
  artworkUploadProgress: number;
  catalogue: Release[];
  catalogueLimit: number;
  catalogueSkip: number;
  collection: Collection;
  editing: Release;
  isLoading: boolean;
  reachedEndOfCat: boolean;
  releaseIdsForDeletion: { [key: string]: boolean };
  userFavourites: Favourite[];
  userReleases: UserRelease[];
  userEditions: CollectionEdition[];
  userWishList: ListItem[];
}

const defaultReleaseState: Release = {
  _id: "",
  artist: "",
  artistName: "",
  artwork: { status: "" },
  catNumber: "",
  credits: "",
  info: "",
  price: "10",
  published: false,
  pubName: "",
  pubYear: "",
  recName: "",
  recYear: "",
  recordLabel: "",
  releaseDate: DateTime.local().toISODate() as string,
  releaseTitle: "",
  tags: [],
  trackList: []
};

const defaultArtistState: Artist = {
  _id: "",
  name: "",
  slug: "",
  biography: "",
  links: []
};

const initialState: ReleasesState = {
  activeRelease: defaultReleaseState,
  artist: defaultArtistState,
  artworkUploading: false,
  artworkUploadProgress: 0,
  isLoading: false,
  catalogue: [],
  catalogueLimit: 12,
  catalogueSkip: 0,
  collection: { albums: [], singles: [] },
  editing: defaultReleaseState,
  reachedEndOfCat: false,
  releaseIdsForDeletion: {},
  userFavourites: [],
  userReleases: [],
  userEditions: [],
  userWishList: []
};

const releaseSlice = createSlice({
  name: "releases",
  initialState,
  reducers: {
    addFavouritesItem(state, action) {
      state.userFavourites = [action.payload, ...state.userFavourites];
    },
    addWishListItem(state, action) {
      state.userWishList = [action.payload, ...state.userWishList];
    },
    removeFavouritesItem(state, action) {
      state.userFavourites = state.userFavourites.filter(({ release }) => release._id !== action.payload);
    },
    removeRelease(state, action) {
      if (state.userReleases) state.userReleases = state.userReleases.filter(release => release._id !== action.payload);
    },
    removeWishListItem(state, action) {
      state.userWishList = state.userWishList.filter(({ release }) => release._id !== action.payload);
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
    setReleaseForEditing(state, action) {
      state.editing = action.payload;
    },
    setReleaseIdsForDeletion(state, action) {
      const { releaseId, isDeleting } = action.payload;
      state.releaseIdsForDeletion = { ...state.releaseIdsForDeletion, [releaseId]: isDeleting };
    },
    setUserEditions(state, action) {
      state.userEditions = action.payload;
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
  (releaseId: string, releaseTitle = "release") =>
  async (dispatch: AppDispatch, getState: GetState) => {
    try {
      if (getState().releases.releaseIdsForDeletion[releaseId]) {
        dispatch(removeRelease(releaseId));
        await axios.delete(`/api/release/${releaseId}`);
        dispatch(toastSuccess({ message: `Successfully deleted ${releaseTitle}.`, title: "Deleted" }));
        dispatch(setReleaseIdsForDeletion({ releaseId, isDeleting: false }));
      } else {
        dispatch(setReleaseIdsForDeletion({ releaseId, isDeleting: true }));
      }
    } catch (error: any) {
      dispatch(toastError({ message: error.response.data.error, title: "Error" }));
    }
  };

const fetchArtistCatalogue =
  (artistId = "", artistSlug = "") =>
  async (dispatch: AppDispatch) => {
    dispatch(setIsLoading(true));
    const res = await axios.get(`/api/catalogue/${artistSlug || artistId}`);
    dispatch(setArtistCatalogue(res.data));
  };

const fetchCatalogue =
  ({
    catalogueLimit,
    catalogueSkip,
    sortBy,
    sortOrder,
    isPaging = false
  }: {
    catalogueLimit: number;
    catalogueSkip: number;
    sortBy: string;
    sortOrder: string;
    isPaging?: boolean;
  }) =>
  async (dispatch: AppDispatch) => {
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
    } catch (error: any) {
      dispatch(setIsLoading(false));
      dispatch(toastError({ message: error.response?.data?.error, title: "Error" }));
    }
  };

const fetchCollection = () => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get("/api/user/collection");
    dispatch(setCollection(res.data));
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const fetchRelease = (releaseId: string) => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get(`/api/release/${releaseId}`);
    dispatch(setActiveRelease(res.data));
  } catch (error: any) {
    dispatch(toastError({ message: "Release currently unavailable.", title: "Error" }));
    throw error;
  }
};

const fetchReleaseForEditing = (releaseId: string) => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get(`/api/release/${releaseId}`);
    dispatch(setReleaseForEditing(res.data));
  } catch (error: any) {
    dispatch(toastError({ message: "Release currently unavailable.", title: "Error" }));
    throw error;
  }
};

const fetchUserEditions = () => async (dispatch: AppDispatch) => {
  try {
    const editions = await getUserEditions();
    dispatch(setUserEditions(editions));
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const fetchUserFavourites = () => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get("/api/user/favourites");
    if (res.data) dispatch(setUserFavourites(res.data));
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const fetchUserReleases = () => async (dispatch: AppDispatch) => {
  const res = await axios.get("/api/user/releases");
  dispatch(setUserReleases(res.data));
};

const fetchUserWishList = () => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get("/api/user/wishlist");
    if (res.data) dispatch(setUserWishList(res.data));
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const publishStatus = (releaseId: string) => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.patch(`/api/release/${releaseId}`);
    if (res.data.error) return dispatch(toastError({ message: res.data.error, title: "Error" }));
    dispatch(updateUserReleases(res.data));
    return true;
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const updateRelease = (values: Release) => async (dispatch: AppDispatch) => {
  const { _id: releaseId } = values;

  try {
    await axios.post(`/api/release/${releaseId}`, values);
    dispatch(setReleaseForEditing(values));
  } catch (error: any) {
    dispatch(toastError({ message: error.response?.data?.error || error.message, title: "Error" }));
  }
};

export const {
  addFavouritesItem,
  addWishListItem,
  removeFavouritesItem,
  removeRelease,
  removeWishListItem,
  setActiveRelease,
  setArtistCatalogue,
  setArtworkUploading,
  setArtworkUploadProgress,
  setCatalogue,
  setCollection,
  setIsLoading,
  setReleaseForEditing,
  setReleaseIdsForDeletion,
  setUserEditions,
  setUserFavourites,
  setUserReleases,
  setUserWishList,
  updateUserReleases
} = releaseSlice.actions;

export {
  defaultReleaseState,
  deleteRelease,
  fetchArtistCatalogue,
  fetchCatalogue,
  fetchCollection,
  fetchRelease,
  fetchReleaseForEditing,
  fetchUserEditions,
  fetchUserFavourites,
  fetchUserReleases,
  fetchUserWishList,
  publishStatus,
  updateRelease
};

export default releaseSlice.reducer;
