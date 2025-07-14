import {
  Artist,
  BasketItem,
  CollectionEdition,
  CollectionRelease,
  CollectionSingle,
  Favourite,
  ListItem,
  Release,
  UserRelease
} from "@gridfire/shared/types";
import { createSlice, nanoid } from "@reduxjs/toolkit";
import axios from "axios";
import { DateTime } from "luxon";

import { toastError, toastSuccess } from "@/state/toast";
import { addActiveProcess, removeActiveProcess } from "@/state/user";
import { AppDispatch, GetState } from "@/types";
import handleError from "@/utils/handleError";
import { fetchUserEditions as _fetchUserEditions } from "@/web3";

interface ReleasesState {
  activeRelease: Release;
  artist: Artist;
  artworkUploading: boolean;
  artworkUploadProgress: number;
  catalogue: Release[];
  catalogueLimit: number;
  catalogueSkip: number;
  editing: Release;
  isLoading: boolean;
  reachedEndOfCat: boolean;
  releaseIdsForDeletion: { [key: string]: boolean };
  userAlbums: CollectionRelease[];
  userEditions: CollectionEdition[];
  userFavourites: Favourite[];
  userReleases: UserRelease[];
  userSingles: CollectionSingle[];
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
  recordLabel: "",
  recYear: "",
  releaseDate: DateTime.local().toISODate(),
  releaseTitle: "",
  tags: [],
  trackList: []
};

const defaultArtistState: Artist = {
  _id: "",
  biography: "",
  links: [],
  name: "",
  releases: [],
  slug: ""
};

const initialState: ReleasesState = {
  activeRelease: defaultReleaseState,
  artist: defaultArtistState,
  artworkUploading: false,
  artworkUploadProgress: 0,
  catalogue: [],
  catalogueLimit: 12,
  catalogueSkip: 0,
  editing: defaultReleaseState,
  isLoading: true,
  reachedEndOfCat: false,
  releaseIdsForDeletion: {},
  userAlbums: [],
  userEditions: [],
  userFavourites: [],
  userReleases: [],
  userSingles: [],
  userWishList: []
};

const releaseSlice = createSlice({
  initialState,
  name: "releases",
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
    setActiveRelease(state, action) {
      state.activeRelease = action.payload;
    },
    setArtistCatalogue(state, action) {
      state.artist = action.payload;
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
    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },
    setReleaseForEditing(state, action) {
      state.editing = action.payload;
    },
    setReleaseIdsForDeletion(state, action) {
      const { isDeleting, releaseId } = action.payload;
      state.releaseIdsForDeletion = { ...state.releaseIdsForDeletion, [releaseId]: isDeleting };
    },
    setUserAlbums(state, action) {
      state.userAlbums = action.payload;
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
    setUserSingles(state, action) {
      state.userSingles = action.payload;
    },
    setUserWishList(state, action) {
      state.userWishList = action.payload;
    },
    updateUserReleases(state, action) {
      state.userReleases = state.userReleases.map(release => {
        if (release._id === action.payload._id) return action.payload;
        return release;
      });
    }
  }
});

const checkoutFreeBasket = (basket: BasketItem[]) => async (dispatch: AppDispatch) => {
  const processId = nanoid();
  dispatch(addActiveProcess({ description: "Checking out…", id: processId, type: "purchase" }));

  try {
    await axios.post("/api/release/checkout", basket);
  } catch (error: unknown) {
    handleError(error, dispatch);
  } finally {
    dispatch(removeActiveProcess(processId));
  }
};

const deleteRelease =
  (releaseId: string, releaseTitle = "release") =>
  async (dispatch: AppDispatch, getState: GetState) => {
    try {
      if (getState().releases.releaseIdsForDeletion[releaseId]) {
        dispatch(removeRelease(releaseId));
        await axios.delete(`/api/release/${releaseId}`);
        dispatch(toastSuccess({ message: `Successfully deleted ${releaseTitle}.`, title: "Deleted" }));
        dispatch(setReleaseIdsForDeletion({ isDeleting: false, releaseId }));
      } else {
        dispatch(setReleaseIdsForDeletion({ isDeleting: true, releaseId }));
      }
    } catch (error: unknown) {
      handleError(error, dispatch);
    }
  };

const fetchArtistCatalogue =
  (artistId = "", artistSlug = "") =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setIsLoading(true));
      const res = await axios.get(`/api/catalogue/${artistSlug || artistId}`);
      dispatch(setArtistCatalogue(res.data));
    } catch (error: unknown) {
      handleError(error, dispatch);
    } finally {
      dispatch(setIsLoading(false));
    }
  };

const fetchCatalogue =
  ({
    catalogueLimit,
    catalogueSkip,
    isPaging = false,
    sortBy,
    sortOrder
  }: {
    catalogueLimit: number;
    catalogueSkip: number;
    isPaging?: boolean;
    sortBy: string;
    sortOrder: string;
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
    } catch (error: unknown) {
      handleError(error, dispatch);
    } finally {
      dispatch(setIsLoading(false));
    }
  };

const fetchRelease = (releaseId: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setIsLoading(true));
    const res = await axios.get(`/api/release/${releaseId}`);
    dispatch(setActiveRelease(res.data));
  } catch (error: unknown) {
    handleError(error, dispatch);
    throw error;
  } finally {
    dispatch(setIsLoading(false));
  }
};

const fetchReleaseForEditing = (releaseId: string) => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get(`/api/release/${releaseId}`);
    dispatch(setReleaseForEditing(res.data));
  } catch (error: unknown) {
    handleError(error, dispatch);
    throw error;
  }
};

const fetchUserAlbums = () => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get("/api/user/albums");
    dispatch(setUserAlbums(res.data));
  } catch (error: unknown) {
    handleError(error, dispatch);
  }
};

const fetchUserEditions = () => async (dispatch: AppDispatch) => {
  try {
    const editions = await _fetchUserEditions();
    dispatch(setUserEditions(editions));
  } catch (error: unknown) {
    handleError(error, dispatch);
  }
};

const fetchUserFavourites = () => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get("/api/user/favourites");

    if (res.data) {
      dispatch(setUserFavourites(res.data));
    }
  } catch (error: unknown) {
    handleError(error, dispatch);
  }
};

const fetchUserReleases = () => async (dispatch: AppDispatch) => {
  const res = await axios.get("/api/user/releases");
  dispatch(setUserReleases(res.data));
};

const fetchUserSingles = () => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get("/api/user/singles");
    dispatch(setUserSingles(res.data));
  } catch (error: unknown) {
    handleError(error, dispatch);
  }
};

const fetchUserWishList = () => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get("/api/user/wishlist");

    if (res.data) {
      dispatch(setUserWishList(res.data));
    }
  } catch (error: unknown) {
    handleError(error, dispatch);
  }
};

const publishStatus = (releaseId: string) => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.patch(`/api/release/${releaseId}`);

    if (res.data.error) {
      return dispatch(toastError({ message: res.data.error, title: "Error" }));
    }

    dispatch(updateUserReleases(res.data));
    return true;
  } catch (error: unknown) {
    handleError(error, dispatch);
  } finally {
    dispatch(setIsLoading(false));
  }
};

const updateRelease = (values: Release) => async (dispatch: AppDispatch) => {
  const { _id: releaseId } = values;

  try {
    await axios.post(`/api/release/${releaseId}`, values);
    dispatch(setReleaseForEditing(values));
  } catch (error: unknown) {
    handleError(error, dispatch);
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
  setIsLoading,
  setReleaseForEditing,
  setReleaseIdsForDeletion,
  setUserAlbums,
  setUserEditions,
  setUserFavourites,
  setUserReleases,
  setUserSingles,
  setUserWishList,
  updateUserReleases
} = releaseSlice.actions;

export type { ReleasesState };

export {
  checkoutFreeBasket,
  defaultReleaseState,
  deleteRelease,
  fetchArtistCatalogue,
  fetchCatalogue,
  fetchRelease,
  fetchReleaseForEditing,
  fetchUserAlbums,
  fetchUserEditions,
  fetchUserFavourites,
  fetchUserReleases,
  fetchUserSingles,
  fetchUserWishList,
  publishStatus,
  updateRelease
};

export default releaseSlice.reducer;
