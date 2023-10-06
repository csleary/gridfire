import {
  PurchasedRelease,
  ReleaseAlbum,
  ReleaseSingle,
  ValidatePurchaseParams
} from "gridfire-web3-events/types/index.js";
import { getAddress, parseEther } from "ethers";
import mongoose from "mongoose";
import Release from "gridfire-web3-events/models/Release.js";
import { SaleType } from "gridfire-web3-events/models/Sale.js";

const { Sale, User } = mongoose.models;

const validatePurchase = async ({
  amountPaid,
  artistAddress,
  transactionHash,
  releaseId,
  userId
}: ValidatePurchaseParams): PurchasedRelease => {
  let release;
  let price;
  let releaseTitle;
  let type = SaleType.Album;

  // Check if the purchase is for a single or an album.
  const releaseWithSingle = await Release.findOne({ "trackList._id": releaseId }, "artist artistName trackList.$")
    .populate({ path: "user", model: User, options: { lean: true }, select: "_id paymentAddress" })
    .exec();

  if (releaseWithSingle) {
    release = releaseWithSingle.toJSON() as ReleaseSingle;
    const [track] = release.trackList;
    ({ price } = track);
    releaseTitle = track.trackTitle;
    type = SaleType.Single;
  } else {
    const releaseAlbum = await Release.findById(releaseId, "artist artistName price releaseTitle")
      .populate({ path: "user", model: User, options: { lean: true }, select: "_id paymentAddress" })
      .exec();

    if (!releaseAlbum) {
      throw new Error(`Release ${releaseId} not found.`);
    }

    release = releaseAlbum.toJSON() as ReleaseAlbum;
    ({ price, releaseTitle } = release);
  }

  const artistUser = release.user;

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
