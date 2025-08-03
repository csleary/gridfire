import { BasketItem } from "@gridfire/shared/types";
import { nanoid } from "@reduxjs/toolkit";
import axios from "axios";

import { selectTrackById, trackRemove } from "@/state/editor";
import { addFavouritesItem, addWishListItem, removeFavouritesItem, removeWishListItem } from "@/state/releases";
import { setActiveRelease } from "@/state/releases";
import {
  addActiveProcess,
  addUserFavouritesItem,
  addUserWishListItem,
  removeActiveProcess,
  removeUserFavouritesItem,
  removeUserWishListItem
} from "@/state/user";
import { AppDispatch, GetState } from "@/types";
import handleError from "@/utils/handleError";
import { toastSuccess } from "@/utils/toast";

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
  ({ note, releaseId }: { note: string; releaseId: string }) =>
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

const getTrackById = (trackId: string) => (dispatch: AppDispatch, getState: GetState) => {
  return selectTrackById(getState(), trackId);
};

const removeTrackById = (trackId: string) => (dispatch: AppDispatch) => {
  dispatch(trackRemove(trackId));
};

const addActiveUserProcess =
  (process: { description: string; id: string; type: string }) => (dispatch: AppDispatch) => {
    dispatch(addActiveProcess(process));
  };

const removeActiveUserProcess = (processId: string) => (dispatch: AppDispatch) => {
  dispatch(removeActiveProcess(processId));
};

const deleteArtwork = (releaseId: string) => async (dispatch: AppDispatch) => {
  try {
    const res = await axios.delete(`/api/artwork/${releaseId}`);
    dispatch(setActiveRelease(res.data));
  } catch (error: unknown) {
    handleError(error, dispatch);
  }
};

export {
  addActiveUserProcess,
  addToFavourites,
  addToWishList,
  checkoutFreeBasket,
  deleteArtwork,
  getTrackById,
  removeActiveUserProcess,
  removeFromFavourites,
  removeFromWishList,
  removeTrackById
};
