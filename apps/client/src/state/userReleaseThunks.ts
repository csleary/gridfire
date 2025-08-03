import axios from "axios";

import { addFavouritesItem, addWishListItem, removeFavouritesItem, removeWishListItem } from "@/state/releases";
import { toastSuccess } from "@/state/toast";
import { AppDispatch } from "@/types";

const { addUserFavouritesItem, addUserWishListItem, removeUserFavouritesItem, removeUserWishListItem } = await import(
  "@/state/user"
);

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

export { addToFavourites, addToWishList, removeFromFavourites, removeFromWishList };
