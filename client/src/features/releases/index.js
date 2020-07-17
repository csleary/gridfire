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
    isPaging: false,
    catalogue: [],
    catalogueLimit: 12,
    catalogueSkip: 0,
    collection: [],
    paymentAddress: '',
    priceInXem: '',
    reachedEndOfCat: false,
    selectedRelease: { releaseDate: '', tags: [], trackList: [] },
    userReleases: []
  },
  reducers: {
    setDeleteRelease(state, action) {
      if (state.userReleases) state.userReleases = state.userReleases.filter(release => release._id !== action.payload);
    },

    setReleasePurchaseInfo(state, action) {
      state.selectedRelease = action.payload.release;
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

    setCatalogue(state, { payload }) {
      const reachedEndOfCat = payload.length < state.catalogueLimit ? true : false;
      state.catalogue = state.isPaging ? [...state.catalogue, ...payload] : payload;
      state.catalogueSkip = state.isPaging ? state.catalogueSkip + state.catalogueLimit : 0;
      state.isPaging = false;
      state.reachedEndOfCat = reachedEndOfCat;
    },

    setCollection(state, action) {
      state.collection = action.payload;
    },

    setIsPaging(state) {
      state.isPaging = true;
    },

    setRelease(state, action) {
      const currentId = state.selectedRelease?._id;
      const updatedId = action.payload._id;
      if (!currentId || currentId === updatedId) {
        state.selectedRelease = action.payload;
      }
    },

    setUserReleases(state, action) {
      state.userReleases = action.payload;
    },

    setReleaseUpdate(state, action) {
      state.isLoading = false;
      state.userReleases = state.userReleases.map(release => {
        if (release._id === action.payload._id) return action.payload;
        return release;
      });
    }
  }
});

const addRelease = () => async dispatch => {
  try {
    const res = await axios.post('/api/release');
    if (res.data.warning) return res.data;
    dispatch(setRelease(res.data));
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

const fetchCatalogue = (catalogueLimit, catalogueSkip, sortPath, sortOrder) => async (dispatch, getState) => {
  const isPaging = getState().releases.isPaging;

  const res = await axios.get('/api/catalogue/', {
    params: {
      catalogueLimit,
      catalogueSkip: isPaging ? catalogueSkip + catalogueLimit : 0,
      sortPath,
      sortOrder
    }
  });

  dispatch(setCatalogue(res.data));
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
    dispatch(setRelease(res.data.release));
  } catch (error) {
    dispatch(toastError('Release currently unavailable.'));
    return error.response.data;
  }
};

const fetchUserRelease = releaseId => async dispatch => {
  const res = await axios.get(`/api/user/release/${releaseId}`);
  dispatch(setRelease(res.data));
};

const fetchUserReleases = () => async dispatch => {
  const res = await axios.get('/api/user/releases');
  dispatch(setUserReleases(res.data));
};

const publishStatus = releaseId => async dispatch => {
  try {
    const res = await axios.patch(`/api/release/${releaseId}`);
    if (res.data.error) return dispatch(toastError(res.data.error));
    dispatch(setReleaseUpdate(res.data));
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
    dispatch(setRelease(res.data));
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

export const {
  setArtistCatalogue,
  setArtworkUploading,
  setArtworkUploadProgress,
  setCatalogue,
  setCollection,
  setDeleteRelease,
  setIsPaging,
  setRelease,
  setReleasePurchaseInfo,
  setUserReleases,
  setReleaseUpdate
} = releaseSlice.actions;

export {
  addRelease,
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
