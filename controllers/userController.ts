import { ObjectId, model } from "mongoose";
import { getResolvedAddress } from "gridfire/controllers/web3/index.js";

const User = model("User");

const getUser = async (userId: ObjectId) => {
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
  await User.findByIdAndUpdate(userId, { paymentAddress: resolvedAddress }).exec();
  return resolvedAddress;
};

export { getUser, setPaymentAddress };
