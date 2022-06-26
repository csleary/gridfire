import User from "../models/User.js";

const getUser = async userId => {
  const [user] = await User.aggregate([
    { $match: { _id: userId } },
    { $lookup: { from: "favourites", localField: "_id", foreignField: "user", as: "favourites" } },
    { $lookup: { from: "wishlists", localField: "_id", foreignField: "user", as: "wishList" } },
    { $lookup: { from: "sales", localField: "_id", foreignField: "user", as: "purchases" } },
    { $project: { __v: 0, key: 0 } }
  ]).exec();

  return user;
};

const setPaymentAddress = async ({ paymentAddress, userId }) => {
  await User.findByIdAndUpdate(userId, { paymentAddress }).exec();
};

export { getUser, setPaymentAddress };
