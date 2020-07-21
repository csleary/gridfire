import { createAction, createSlice } from '@reduxjs/toolkit';
import { fetchUserFavourites, fetchUserWishList } from 'features/releases';
import { toastError, toastSuccess } from 'features/toast';
import axios from 'axios';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    credits: 0,
    favourites: [],
    nemAddress: '',
    nemAddressVerified: false,
    purchases: [],
    wishList: []
  },
  reducers: {
    setCredits(state, action) {
      state.credits = action.payload;
    },

    setFavourites(state, action) {
      const { releaseId } = action.payload;
      if (state.favourites.includes(releaseId)) {
        state.favourites = state.favourites.filter(id => id !== releaseId);
      } else {
        state.favourites.push(action.payload);
      }
    },

    setNemAddress(state, action) {
      state.credits = action.payload.credits;
      state.nemAddress = action.payload.nemAddress;
      state.nemAddressVerified = action.payload.nemAddressVerified;
    },

    updateFavourites(state, action) {
      state.favourites = action.payload;
    },

    updateWishList(state, action) {
      state.wishList = action.payload;
    },

    updateUser(state, action) {
      const {
        _id,
        artists,
        auth,
        credits,
        favourites,
        nemAddress,
        nemAddressVerified,
        purchases,
        wishList
      } = action.payload;
      state.auth = artists;
      state.auth = auth;
      state.credits = credits;
      state.favourites = favourites;
      state.nemAddress = nemAddress;
      state.nemAddressVerified = nemAddressVerified;
      state.purchases = purchases;
      state.wishList = wishList;
      state.userId = _id;
    }
  }
});

const saveToFavourites = releaseId => async dispatch => {
  const res = await axios.post(`/api/user/favourite/${releaseId}`);
  const favourites = res.data;
  dispatch(updateFavourites(favourites));
  if (favourites.some(rel => rel.releaseId === releaseId)) dispatch(toastSuccess('Added to favourites.'));
  else dispatch(toastSuccess('Removed from favourites.'));
  dispatch(fetchUserFavourites());
};

const saveToWishList = releaseId => async dispatch => {
  const res = await axios.post(`/api/user/wish-list/${releaseId}`);
  const wishList = res.data;
  dispatch(updateWishList(wishList));
  if (wishList.some(rel => rel.releaseId === releaseId)) dispatch(toastSuccess('Added to wish list.'));
  else dispatch(toastSuccess('Removed from wish list.'));
  dispatch(fetchUserWishList());
};

const addNemAddress = values => async dispatch => {
  try {
    const res = await axios.post('/api/user/address', values);
    dispatch(setNemAddress(res.data));
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

const logOut = callback => async dispatch => {
  try {
    const res = await axios.get('/api/auth/logout');
    dispatch(createAction({ type: 'user/logOut' }));
    callback(res);
  } catch (error) {
    dispatch(toastError(error.response.data.error));
  }
};

export default userSlice.reducer;
export const {
  setCredits,
  setFavourites,
  setLoading,
  setNemAddress,
  updateFavourites,
  updateWishList,
  updateUser
} = userSlice.actions;

export { addNemAddress, fetchUser, fetchUserCredits, logOut, saveToFavourites, saveToWishList };
