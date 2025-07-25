import { ActiveProcess, Sale, UserFavourite, UserListItem } from "@gridfire/shared/types";
import { createEntityAdapter, createSelector, createSlice, EntityState } from "@reduxjs/toolkit";
import axios from "axios";

import { toastSuccess } from "@/state/toast";
import { AppDispatch, RootState } from "@/types";
import handleError from "@/utils/handleError";

interface UserState {
  account: string;
  accountShort: string;
  emailAddress: string;
  favourites: UserFavourite[];
  isLoading: boolean;
  lastLogin: string;
  paymentAddress: string;
  processList: EntityState<ActiveProcess, string>;
  purchases: Sale[];
  userId: string;
  wishList: UserListItem[];
}

const processAdapter = createEntityAdapter<ActiveProcess>();

const initialState: UserState = {
  account: "",
  accountShort: "",
  emailAddress: "",
  favourites: [],
  isLoading: true,
  lastLogin: "",
  paymentAddress: "",
  processList: processAdapter.getInitialState(),
  purchases: [],
  userId: "",
  wishList: []
};

const userSlice = createSlice({
  initialState,
  name: "user",
  reducers: {
    addActiveProcess(state, action) {
      const newProcess = action.payload;
      processAdapter.addOne(state.processList, newProcess);
    },
    addUserFavouritesItem(state, action) {
      state.favourites = [...state.favourites, action.payload];
    },
    addUserWishListItem(state, action) {
      state.wishList = [...state.wishList, action.payload];
    },
    clearUser() {
      return initialState;
    },
    removeActiveProcess(state, action) {
      const processId = action.payload;
      processAdapter.removeOne(state.processList, processId);
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

const addPaymentAddress =
  (paymentAddress: string) =>
  async (dispatch: AppDispatch): Promise<string | undefined> => {
    try {
      const res = await axios.post("/api/user/address", { paymentAddress });
      dispatch(setPaymentAddress(res.data));
      dispatch(toastSuccess({ message: "Payment address saved.", title: "Saved!" }));
      return res.data;
    } catch (error: unknown) {
      handleError(error, dispatch);
    }
  };

const fetchUser = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setIsLoading(true));
    const res = await axios.get("/api/user");
    if (res.data) dispatch(updateUser(res.data));
    return res.data;
  } catch (error: unknown) {
    handleError(error, dispatch);
  } finally {
    dispatch(setIsLoading(false));
  }
};

const logOut = () => async (dispatch: AppDispatch) => {
  try {
    await axios.get("/api/auth/logout");
    window.localStorage.removeItem("wasConnected");
    dispatch(toastSuccess({ message: "Thanks for visiting. You are now logged out." }));
    dispatch(clearUser());
  } catch (error: unknown) {
    handleError(error, dispatch);
  } finally {
    dispatch(setIsLoading(false));
  }
};

export const {
  addActiveProcess,
  addUserFavouritesItem,
  addUserWishListItem,
  clearUser,
  removeActiveProcess,
  removeUserFavouritesItem,
  removeUserWishListItem,
  setIsLoading,
  setPaymentAddress,
  updateFavourites,
  updateUser
} = userSlice.actions;

const {
  selectAll: selectActiveProcessList,
  selectById: selectActiveProcessById,
  selectIds: selectActiveProcessIds,
  selectTotal: selectActiveProcessTotal
} = processAdapter.getSelectors((state: RootState) => state.user.processList);

const selectFavourites = (state: RootState) => state.user.favourites;
const selectWishList = (state: RootState) => state.user.wishList;

const selectIsInFavourites = (releaseId: string) =>
  createSelector([selectFavourites], favourites => favourites.some(({ release }) => release === releaseId));

const selectIsInWishList = (releaseId: string) =>
  createSelector([selectWishList], wishList => wishList.some(({ release }) => release === releaseId));

export {
  addPaymentAddress,
  fetchUser,
  logOut,
  selectActiveProcessById,
  selectActiveProcessIds,
  selectActiveProcessList,
  selectActiveProcessTotal,
  selectIsInFavourites,
  selectIsInWishList,
  initialState as userInitialState
};

export type { UserState };
export default userSlice.reducer;
