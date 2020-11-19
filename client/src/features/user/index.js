import { createAction, createSlice } from '@reduxjs/toolkit';
import { toastError, toastSuccess, toastWarning } from 'features/toast';
import axios from 'axios';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    auth: undefined,
    credits: 0,
    favourites: [],
    nemAddress: '',
    nemAddressChallenge: '',
    nemAddressVerified: false,
    purchases: [],
    wishList: []
  },
  reducers: {
    addFavouritesItem(state, action) {
      state.favourites = [action.payload, ...state.favourites];
    },

    removeFavouritesItem(state, action) {
      state.favourites = state.favourites.filter(({ release }) => release !== action.payload);
    },

    addWishListItem(state, action) {
      state.wishList = [action.payload, ...state.wishList];
    },

    removeWishListItem(state, action) {
      state.wishList = state.wishList.filter(({ release }) => release !== action.payload);
    },

    setCredits(state, action) {
      state.credits = action.payload;
    },

    setNemAddress(state, action) {
      state.credits = action.payload.credits;
      state.nemAddress = action.payload.nemAddress;
      state.nemAddressChallenge = action.payload.nemAddressChallenge;
      state.nemAddressVerified = action.payload.nemAddressVerified;
    },

    updateFavourites(state, action) {
      state.favourites = action.payload;
    },

    updateUser(state, action) {
      const {
        _id,
        artists,
        auth,
        credits,
        favourites,
        nemAddress,
        nemAddressChallenge,
        nemAddressVerified,
        purchases,
        wishList
      } = action.payload;
      state.artists = artists;
      state.auth = auth;
      state.credits = credits;
      state.favourites = favourites;
      state.nemAddress = nemAddress;
      state.nemAddressChallenge = nemAddressChallenge;
      state.nemAddressVerified = nemAddressVerified;
      state.purchases = purchases;
      state.wishList = wishList;
      state.userId = _id;
    }
  }
});

const addToFavourites = releaseId => async dispatch => {
  const res = await axios.post(`/api/user/favourites/${releaseId}`);
  dispatch(addFavouritesItem(res.data));
  dispatch(toastSuccess('Added to favourites.'));
};

const removeFromFavourites = releaseId => async dispatch => {
  dispatch(removeFavouritesItem(releaseId));
  await axios.delete(`/api/user/favourites/${releaseId}`);
  dispatch(toastSuccess('Removed from favourites.'));
};

const addToWishList = releaseId => async dispatch => {
  const res = await axios.post(`/api/user/wish-list/${releaseId}`);
  dispatch(addWishListItem(res.data));
  dispatch(toastSuccess('Added to wish list.'));
};

const removeFromWishList = releaseId => async dispatch => {
  dispatch(removeWishListItem(releaseId));
  await axios.delete(`/api/user/wish-list/${releaseId}`);
  dispatch(toastSuccess('Removed from wish list.'));
};

const addNemAddress = values => async dispatch => {
  try {
    const res = await axios.post('/api/user/address', values);
    dispatch(setNemAddress(res.data));
    if (!values.nemAddress) {
      dispatch(toastWarning('NEM payment address removed.'));
    } else {
      dispatch(toastSuccess('NEM payment address saved.'));
    }
  } catch (error) {
    dispatch(toastError(error.response.data.error));
    return error.response.data;
  }
};

const fetchUser = () => async dispatch => {
  try {
    const res = await axios.get('/api/user');
    dispatch(updateUser(res.data));
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

const fetchUserCredits = () => async dispatch => {
  try {
    const res = await axios.get('/api/user/credits');
    if (res.data?.credits) dispatch(setCredits(res.data.credits));
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

const logOut = () => async dispatch => {
  try {
    const res = await axios.get('/api/auth/logout');
    const action = createAction('user/logOut');
    dispatch(action());
    dispatch(toastSuccess(res.data.success));
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

export default userSlice.reducer;
export const {
  addFavouritesItem,
  addWishListItem,
  removeFavouritesItem,
  removeWishListItem,
  setCredits,
  setFavourites,
  setLoading,
  setNemAddress,
  updateFavourites,
  updateUser
} = userSlice.actions;

export {
  addNemAddress,
  addToFavourites,
  addToWishList,
  fetchUser,
  fetchUserCredits,
  logOut,
  removeFromFavourites,
  removeFromWishList
};
