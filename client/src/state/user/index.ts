import { addFavouritesItem, addWishListItem, removeFavouritesItem, removeWishListItem } from "state/releases";
import { toastError, toastSuccess } from "state/toast";
import { Sale, UserFavourite, UserListItem } from "types";
import { AppDispatch } from "index";
import axios from "axios";
import { createSlice } from "@reduxjs/toolkit";

interface UserState {
  account: string;
  accountShort: string;
  emailAddress: string;
  favourites: UserFavourite[];
  isLoading: boolean;
  lastLogin: string;
  paymentAddress: string;
  purchases: Sale[];
  userId: string;
  wishList: UserListItem[];
}

const initialState: UserState = {
  account: "",
  accountShort: "",
  emailAddress: "",
  favourites: [],
  isLoading: true,
  lastLogin: "",
  paymentAddress: "",
  purchases: [],
  userId: "",
  wishList: []
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addUserFavouritesItem(state, action) {
      state.favourites = [...state.favourites, action.payload];
    },
    addUserWishListItem(state, action) {
      state.wishList = [...state.wishList, action.payload];
    },
    clearUser() {
      return initialState;
    },
    removeUserFavouritesItem(state, action) {
      state.favourites = state.favourites.filter(({ release }) => release !== action.payload);
    },
    removeUserWishListItem(state, action) {
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
      const { _id, account, emailAddress, favourites, lastLogin, paymentAddress, purchases, wishList } = action.payload;
      state.account = account;
      state.accountShort = `${account.slice(0, 6)}…${account.slice(-4)}`;
      state.emailAddress = emailAddress;
      state.lastLogin = lastLogin;
      state.favourites = favourites;
      state.paymentAddress = paymentAddress;
      state.purchases = purchases;
      state.wishList = wishList;
      state.userId = _id;
    }
  }
});

const addToFavourites = (releaseId: string) => async (dispatch: AppDispatch) => {
  const res = await axios.post(`/api/user/favourites/${releaseId}`);
  const { _id, dateAdded } = res.data;
  const release = res.data.release._id;
  dispatch(addUserFavouritesItem({ _id, dateAdded, release }));
  dispatch(addFavouritesItem(res.data));
  dispatch(toastSuccess({ message: "Added to favourites.", title: "Added!" }));
};

const removeFromFavourites = (releaseId: string) => async (dispatch: AppDispatch) => {
  dispatch(removeFavouritesItem(releaseId));
  dispatch(removeUserFavouritesItem(releaseId));
  await axios.delete(`/api/user/favourites/${releaseId}`);
  dispatch(toastSuccess({ message: "Removed from favourites.", title: "Removed" }));
};

const addToWishList =
  ({ releaseId, note }: { releaseId: string; note: string }) =>
  async (dispatch: AppDispatch) => {
    const res = await axios.post(`/api/user/wishlist/${releaseId}`, { note });
    const { _id, dateAdded } = res.data;
    const release = res.data.release._id;
    dispatch(addUserWishListItem({ _id, dateAdded, note, release }));
    dispatch(addWishListItem(res.data));
    dispatch(toastSuccess({ message: "Added to wish list.", title: "Added!" }));
  };

const removeFromWishList = (releaseId: string) => async (dispatch: AppDispatch) => {
  dispatch(removeWishListItem(releaseId));
  dispatch(removeUserWishListItem(releaseId));
  await axios.delete(`/api/user/wishlist/${releaseId}`);
  dispatch(toastSuccess({ message: "Removed from wish list.", title: "Removed" }));
};

const addPaymentAddress = (values: { paymentAddress: string }) => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.post("/api/user/address", values);
    const { paymentAddress } = res.data;
    dispatch(setPaymentAddress(paymentAddress));
    dispatch(toastSuccess({ message: "Payment address saved.", title: "Saved!" }));
  } catch (error: any) {
    dispatch(toastError({ message: error.response?.data?.error || error.message || error.toString(), title: "Error" }));
  }
};

const fetchUser = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setIsLoading(true));
    const res = await axios.get("/api/user");
    if (res.data) dispatch(updateUser(res.data));
  } catch (error: any) {
    dispatch(toastError({ message: error.response?.data?.error || error.message || error.toString(), title: "Error" }));
  } finally {
    dispatch(setIsLoading(false));
  }
};

const logOut = () => async (dispatch: AppDispatch) => {
  try {
    await axios.get("/api/auth/logout");
    dispatch(toastSuccess({ message: "Thanks for visiting. You are now logged out." }));
    dispatch(clearUser());
  } catch (error: any) {
    dispatch(toastError({ message: error.response?.data?.error || error.message || error.toString(), title: "Error" }));
  } finally {
    dispatch(setIsLoading(false));
  }
};

export default userSlice.reducer;

export const {
  addUserFavouritesItem,
  addUserWishListItem,
  clearUser,
  removeUserFavouritesItem,
  removeUserWishListItem,
  setIsLoading,
  setPaymentAddress,
  updateFavourites,
  updateUser
} = userSlice.actions;

export {
  addPaymentAddress,
  addToFavourites,
  addToWishList,
  fetchUser,
  initialState as userInitialState,
  logOut,
  removeFromFavourites,
  removeFromWishList
};
