import User from "gridfire/models/User.js";
import { getAddress } from "ethers";

const getUser = async userId => {
  const [user] = await User.aggregate([
    { $match: { _id: userId } },
    { $lookup: { from: "favourites", localField: "_id", foreignField: "user", as: "favourites" } },
    { $lookup: { from: "wishlists", localField: "_id", foreignField: "user", as: "wishList" } },
    { $lookup: { from: "sales", localField: "_id", foreignField: "user", as: "purchases" } },
    { $project: { __v: 0, key: 0, purchases: { __v: 0 } } }
  ]).exec();

  return user;
};

const setPaymentAddress = async ({ paymentAddress, userId }) => {
  return User.findByIdAndUpdate(userId, { paymentAddress: getAddress(paymentAddress) }).exec();
};

export { getUser, setPaymentAddress };
