import { getAddress, parseEther } from "ethers";
import { ValidatePurchaseParams } from "gridfire-web3-events/types/index.js";
import mongoose from "mongoose";

const { Release, Sale, User } = mongoose.models;

const validatePurchase = async ({
  amountPaid,
  artistAddress,
  transactionHash,
  releaseId,
  userId
}: ValidatePurchaseParams) => {
  let price;
  let releaseTitle;
  let type = "album";

  // Check if the purchase is for a single or an album.
  let release = await Release.findOne({ "trackList._id": releaseId }, "artist artistName trackList.$", { lean: true })
    .populate({ path: "user", model: User, options: { lean: true }, select: "paymentAddress" })
    .exec();

  if (release) {
    const [track] = release.trackList;
    releaseTitle = track.trackTitle;
    ({ price } = track);
    type = "single";
  } else {
    release = await Release.findById(releaseId, "artist artistName price releaseTitle", { lean: true })
      .populate({ path: "user", model: User, options: { lean: true }, select: "paymentAddress" })
      .exec();

    ({ price, releaseTitle } = release);
  }

  const { user: artistUser } = release;

  if (getAddress(artistUser.paymentAddress) !== getAddress(artistAddress)) {
    throw new Error("Payment address and release artist address do not match.");
  }

  if (amountPaid < parseEther(price.toString())) {
    throw new Error("The amount paid is lower than the release price.");
  }

  if (
    await Sale.exists({
      paid: amountPaid.toString(),
      release: releaseId,
      "transaction.hash": transactionHash,
      type,
      user: userId
    })
  ) {
    throw new Error("The buyer already owns this release.");
  }

  return { release, releaseTitle, type };
};

export { validatePurchase };
