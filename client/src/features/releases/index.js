import { toastError, toastSuccess } from 'features/toast';
import axios from 'axios';
import { createSlice } from '@reduxjs/toolkit';

const releaseSlice = createSlice({
  name: 'releases',
  initialState: {
    artist: {},
    artworkUploading: false,
    artworkUploadProgress: 0,
    isLoading: false,
    catalogue: [],
    catalogueLimit: 12,
    catalogueSkip: 0,
    collection: [],
    paymentAddress: '',
    priceInXem: '',
    reachedEndOfCat: false,
    activeRelease: { releaseDate: '', tags: [], trackList: [] },
    userReleases: []
  },
  reducers: {
    clearActiveRelease(state) {
      state.activeRelease = {};
    },

    setDeleteRelease(state, action) {
      if (state.userReleases) state.userReleases = state.userReleases.filter(release => release._id !== action.payload);
    },

    setReleasePurchaseInfo(state, action) {
      state.activeRelease = action.payload.release;
      state.paymentAddress = action.payload.paymentInfo.paymentAddress;
      state.paymentHash = action.payload.paymentInfo.paymentHash;
      state.priceInXem = action.payload.price;
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

    setCollection(state, action) {
      state.collection = action.payload;
    },

    setActiveRelease(state, action) {
      state.activeRelease = action.payload;
    },

    setUserReleases(state, action) {
      state.userReleases = action.payload;
    },

    updateActiveRelease(state, action) {
      const currentId = state.activeRelease?._id;
      const updatedId = action.payload._id;
      if (!currentId || currentId === updatedId) {
        state.activeRelease = action.payload;
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

const addNewRelease = () => async dispatch => {
  try {
    dispatch(clearActiveRelease());
    const res = await axios.post('/api/release');
    if (res.data.warning) return res.data;
    dispatch(setActiveRelease(res.data));
  } catch (error) {
    dispatch(toastError(error.response?.data.error));
  }
};

const deleteRelease = (releaseId, releaseTitle = 'release') => async dispatch => {
  try {
    const res = await axios.delete(`/api/release/${releaseId}`);
    dispatch(setDeleteRelease(res.data));
    dispatch(toastSuccess(`Successfully deleted ${releaseTitle}.`));
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

const fetchArtistCatalogue = artistId => async dispatch => {
  const res = await axios.get(`/api/catalogue/${artistId}`);
  dispatch(setArtistCatalogue(res.data));
};

const fetchCatalogue = (catalogueLimit, catalogueSkip, sortPath, sortOrder, isPaging = false) => async dispatch => {
  const res = await axios.get('/api/catalogue/', {
    params: {
      catalogueLimit,
      catalogueSkip: isPaging ? catalogueSkip + catalogueLimit : 0,
      sortPath,
      sortOrder
    }
  });

  dispatch(setCatalogue({ catalogue: res.data, isPaging }));
};

const fetchCollection = () => async dispatch => {
  try {
    const res = await axios.get('/api/collection/');
    dispatch(setCollection(res.data));
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

const fetchRelease = releaseId => async dispatch => {
  try {
    const res = await axios.get(`/api/release/${releaseId}`);
    dispatch(setActiveRelease(res.data.release));
  } catch (error) {
    dispatch(toastError('Release currently unavailable.'));
    return error.response.data;
  }
};

const fetchUserRelease = releaseId => async dispatch => {
  const res = await axios.get(`/api/user/release/${releaseId}`);
  dispatch(setActiveRelease(res.data));
};

const fetchUserReleases = () => async dispatch => {
  const res = await axios.get('/api/user/releases');
  dispatch(setUserReleases(res.data));
};

const publishStatus = releaseId => async dispatch => {
  try {
    const res = await axios.patch(`/api/release/${releaseId}`);
    if (res.data.error) return dispatch(toastError(res.data.error));
    dispatch(updateUserReleases(res.data));
    return true;
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

const purchaseRelease = releaseId => async dispatch => {
  try {
    const res = await axios.get(`/api/purchase/${releaseId}`);
    if (res.data.error) dispatch(toastError(res.data.error));
    dispatch(setReleasePurchaseInfo(res.data));
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

const updateRelease = values => async dispatch => {
  try {
    const res = await axios.put('/api/release', values);
    dispatch(setActiveRelease(res.data));
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

export const {
  clearActiveRelease,
  setArtistCatalogue,
  setArtworkUploading,
  setArtworkUploadProgress,
  setCatalogue,
  setCollection,
  setDeleteRelease,
  setActiveRelease,
  setReleasePurchaseInfo,
  setUserReleases,
  updateActiveRelease,
  updateUserReleases
} = releaseSlice.actions;

export {
  addNewRelease,
  deleteRelease,
  fetchArtistCatalogue,
  fetchCatalogue,
  fetchCollection,
  fetchRelease,
  fetchUserRelease,
  fetchUserReleases,
  publishStatus,
  purchaseRelease,
  updateRelease
};

export default releaseSlice.reducer;
