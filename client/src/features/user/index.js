import { createAction, createSlice } from "@reduxjs/toolkit";
import { toastError, toastSuccess } from "features/toast";
import axios from "axios";

const userSlice = createSlice({
  name: "user",
  initialState: {
    auth: undefined,
    credits: 0,
    favourites: [],
    isLoading: true,
    paymentAddress: "",
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

    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },

    setPaymentAddress(state, action) {
      state.paymentAddress = action.payload;
    },

    updateFavourites(state, action) {
      state.favourites = action.payload;
    },

    updateUser(state, action) {
      const { _id, auth, favourites, paymentAddress, purchases, wishList } = action.payload;
      state.auth = auth;
      state.favourites = favourites;
      state.paymentAddress = paymentAddress;
      state.purchases = purchases;
      state.wishList = wishList;
      state.userId = _id;
    }
  }
});

const addToFavourites = releaseId => async dispatch => {
  const res = await axios.post(`/api/user/favourites/${releaseId}`);
  dispatch(addFavouritesItem(res.data));
  dispatch(toastSuccess("Added to favourites."));
};

const removeFromFavourites = releaseId => async dispatch => {
  dispatch(removeFavouritesItem(releaseId));
  await axios.delete(`/api/user/favourites/${releaseId}`);
  dispatch(toastSuccess("Removed from favourites."));
};

const addToWishList =
  ({ releaseId, note }) =>
  async dispatch => {
    const res = await axios.post(`/api/user/wishlist/${releaseId}`, { note });
    dispatch(addWishListItem(res.data));
    dispatch(toastSuccess("Added to wish list."));
  };

const removeFromWishList = releaseId => async dispatch => {
  dispatch(removeWishListItem(releaseId));
  await axios.delete(`/api/user/wishlist/${releaseId}`);
  dispatch(toastSuccess("Removed from wish list."));
};

const addPaymentAddress = values => async dispatch => {
  try {
    const res = await axios.post("/api/user/address", values);
    const { paymentAddress } = res.data;
    dispatch(setPaymentAddress(paymentAddress));
    dispatch(toastSuccess("Payment address saved."));
  } catch (error) {
    dispatch(toastError(error.response?.data?.error || error.message || error.toString()));
  }
};

const fetchUser = () => async dispatch => {
  try {
    const res = await axios.get("/api/user");
    if (res.data) dispatch(updateUser(res.data));
  } catch (error) {
    dispatch(toastError(error.response?.data?.error || error.message || error.toString()));
  } finally {
    dispatch(setIsLoading(false));
  }
};

const logOut = () => async dispatch => {
  try {
    const res = await axios.get("/api/auth/logout");
    const action = createAction("user/logOut");
    dispatch(action());
    dispatch(toastSuccess(res.data.success));
  } catch (error) {
    dispatch(toastError(error.response?.data?.error || error.message || error.toString()));
  }
};

export default userSlice.reducer;

export const {
  addFavouritesItem,
  addWishListItem,
  removeFavouritesItem,
  removeWishListItem,
  setFavourites,
  setIsLoading,
  setLoading,
  setPaymentAddress,
  updateFavourites,
  updateUser
} = userSlice.actions;

export {
  addPaymentAddress,
  addToFavourites,
  addToWishList,
  fetchUser,
  logOut,
  removeFromFavourites,
  removeFromWishList
};
