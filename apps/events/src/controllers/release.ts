import Release from "@gridfire/shared/models/Release";
import Sale, { SaleType } from "@gridfire/shared/models/Sale";
import { PurchasedRelease, ReleaseAlbum, ReleaseSingle, ValidatePurchaseParams } from "@gridfire/shared/types";
import { getAddress, parseEther } from "ethers";

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
    .populate("user", "_id paymentAddress")
    .lean<ReleaseSingle>();

  if (releaseWithSingle) {
    release = releaseWithSingle;
    const [track] = release.trackList;
    ({ price } = track);
    releaseTitle = track.trackTitle;
    type = SaleType.Single;
  } else {
    const releaseAlbum = await Release.findById(releaseId, "artist artistName price releaseTitle")
      .populate("user", "_id paymentAddress")
      .lean<ReleaseAlbum>();

    if (!releaseAlbum) {
      throw new Error(`Release ${releaseId} not found.`);
    }

    release = releaseAlbum;
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
