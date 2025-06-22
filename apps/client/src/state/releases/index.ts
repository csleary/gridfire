import { AppDispatch, GetState } from "index";
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
} from "types";
import { toastError, toastSuccess } from "state/toast";
import { DateTime } from "luxon";
import axios from "axios";
import { createSlice, nanoid } from "@reduxjs/toolkit";
import { fetchUserEditions as _fetchUserEditions } from "web3";
import { addActiveProcess, removeActiveProcess } from "state/user";

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
  userFavourites: Favourite[];
  userReleases: UserRelease[];
  userSingles: CollectionSingle[];
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
  links: [],
  releases: []
};

const initialState: ReleasesState = {
  activeRelease: defaultReleaseState,
  artist: defaultArtistState,
  artworkUploading: false,
  artworkUploadProgress: 0,
  isLoading: true,
  catalogue: [],
  catalogueLimit: 12,
  catalogueSkip: 0,
  editing: defaultReleaseState,
  reachedEndOfCat: false,
  releaseIdsForDeletion: {},
  userAlbums: [],
  userFavourites: [],
  userReleases: [],
  userSingles: [],
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
  dispatch(addActiveProcess({ id: processId, description: "Checking out…", type: "purchase" }));

  try {
    await axios.post("/api/release/checkout", basket);
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
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
    try {
      dispatch(setIsLoading(true));
      const res = await axios.get(`/api/catalogue/${artistSlug || artistId}`);
      dispatch(setArtistCatalogue(res.data));
    } catch (error: any) {
      dispatch(toastError({ message: error.response.data.error, title: "Error" }));
    } finally {
      dispatch(setIsLoading(false));
    }
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

const fetchRelease = (releaseId: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setIsLoading(true));
    const res = await axios.get(`/api/release/${releaseId}`);
    dispatch(setActiveRelease(res.data));
  } catch (error: any) {
    dispatch(toastError({ message: "Release currently unavailable.", title: "Error" }));
    throw error;
  } finally {
    dispatch(setIsLoading(false));
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

const fetchUserAlbums = () => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get("/api/user/albums");
    dispatch(setUserAlbums(res.data));
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const fetchUserEditions = () => async (dispatch: AppDispatch) => {
  try {
    const editions = await _fetchUserEditions();
    dispatch(setUserEditions(editions));
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const fetchUserFavourites = () => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get("/api/user/favourites");

    if (res.data) {
      dispatch(setUserFavourites(res.data));
    }
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
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
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  }
};

const fetchUserWishList = () => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.get("/api/user/wishlist");

    if (res.data) {
      dispatch(setUserWishList(res.data));
    }
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
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
  } catch (error: any) {
    dispatch(toastError({ message: error.response.data.error, title: "Error" }));
  } finally {
    dispatch(setIsLoading(false));
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
