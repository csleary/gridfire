import { getResolvedAddress } from "@gridfire/api/controllers/web3/index";
import type { IFavourite } from "@gridfire/shared/models/Favourite";
import type { ISale } from "@gridfire/shared/models/Sale";
import type { IUser } from "@gridfire/shared/models/User";
import User from "@gridfire/shared/models/User";
import type { IWishList } from "@gridfire/shared/models/WishList";
import { ObjectId } from "mongoose";

interface ExtendedUser extends IUser {
  favourites: IFavourite[];
  purchases: ISale[];
  wishList: IWishList[];
}

const getUser = async (userId: ObjectId): Promise<ExtendedUser> => {
  const [user] = await User.aggregate([
    { $match: { _id: userId } },
    { $lookup: { from: "favourites", localField: "_id", foreignField: "user", as: "favourites" } },
    { $lookup: { from: "lists", localField: "_id", foreignField: "user", as: "wishList" } },
    { $lookup: { from: "sales", localField: "_id", foreignField: "user", as: "purchases" } },
    { $project: { __v: 0, purchases: { __v: 0 } } }
  ]).exec();

  return user;
};

const setPaymentAddress = async ({
  paymentAddress,
  userId
}: {
  paymentAddress: string;
  userId: ObjectId;
}): Promise<string> => {
  const resolvedAddress = await getResolvedAddress(paymentAddress);
  await User.updateOne({ _id: userId }, { paymentAddress: resolvedAddress }).exec();
  return resolvedAddress;
};

export { getUser, setPaymentAddress };
