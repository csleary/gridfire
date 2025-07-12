import { publishToQueue } from "@gridfire/shared/amqp";
import Activity from "@gridfire/shared/models/Activity";
import Release from "@gridfire/shared/models/Release";
import Sale, { ISale, SaleType } from "@gridfire/shared/models/Sale";
import User from "@gridfire/shared/models/User";
import { BasketItem } from "@gridfire/shared/types";
import { parseEther } from "ethers";

enum NotificationType {
  Purchase = "purchaseEvent",
  Sale = "saleEvent"
}

interface RecordSaleParams {
  amountPaid: bigint;
  artistShare: bigint;
  platformFee: bigint;
  releaseId: string;
  type: Omit<SaleType, SaleType.Edition>;
  userAddress: string;
  userId: string;
}

const validateFreePurchase = async ({ releaseId, userId }: { releaseId: string; userId: string }) => {
  let release;
  let price;
  let releaseTitle;
  let type = SaleType.Album;

  // Check if the purchase is for a single or an album.
  const releaseWithSingle = await Release.findOne({ "trackList._id": releaseId }, "artist artistName trackList.$")
    .populate({ model: User, options: { lean: true }, path: "user", select: "_id paymentAddress" })
    .exec();

  if (releaseWithSingle) {
    release = releaseWithSingle.toJSON();
    const [track] = release.trackList;
    ({ price } = track);
    releaseTitle = track.trackTitle;
    type = SaleType.Single;
  } else {
    const releaseAlbum = await Release.findById(releaseId, "artist artistName price releaseTitle")
      .populate({ model: User, options: { lean: true }, path: "user", select: "_id paymentAddress" })
      .exec();

    if (!releaseAlbum) {
      throw new Error("Release not found.");
    }

    release = releaseAlbum;
    ({ price, releaseTitle } = release.toJSON());
  }

  if (parseEther(price.toString()) > 0n) {
    throw new Error("Cannot include non-free release in free checkout.");
  }

  if (
    await Sale.exists({
      paid: "0",
      release: releaseId,
      type,
      user: userId
    })
  ) {
    throw new Error("The buyer already owns this release.");
  }

  return { release, releaseTitle, type };
};

const recordSale = async ({
  amountPaid,
  artistShare,
  platformFee,
  releaseId,
  type,
  userAddress,
  userId
}: RecordSaleParams): Promise<ISale> => {
  const paid = amountPaid.toString();

  const saleExists = await Sale.exists({
    paid,
    release: releaseId,
    transactionHash: "0x0",
    type,
    user: userId
  });

  if (saleExists) {
    throw new Error("This sale has already been recorded.");
  }

  const sale = await Sale.create({
    fee: platformFee.toString(),
    netAmount: artistShare.toString(),
    paid,
    purchaseDate: Date.now(),
    release: releaseId,
    transactionHash: "0x0",
    type,
    user: userId,
    userAddress
  });

  return sale;
};

const checkoutFreeBasket = async (basket: BasketItem[], userId: string) => {
  const user = await User.findById(userId, "account").exec();

  if (!user) {
    throw new Error("User not found.");
  }

  const { account: userAddress } = user.toJSON();

  for (const basketItem of basket) {
    const { releaseId } = basketItem;
    const { release, releaseTitle, type } = await validateFreePurchase({ releaseId, userId });

    const sale = await recordSale({
      amountPaid: 0n,
      artistShare: 0n,
      platformFee: 0n,
      releaseId,
      type,
      userAddress,
      userId
    });

    const { artist: artistId, artistName, user: artistUser } = release;
    const artistUserId = artistUser._id.toString();

    Activity.sale({
      artist: artistId.toString(),
      release: releaseId,
      sale: sale._id.toString(),
      user: userId
    });

    publishToQueue("user", userId, { artistName, releaseTitle, type: NotificationType.Purchase, userId });

    publishToQueue("user", artistUserId, {
      artistName,
      artistShare: "0",
      buyerAddress: userAddress,
      platformFee: "0",
      releaseTitle,
      type: NotificationType.Sale,
      userId: artistUserId
    });
  }
};

const deleteRelease = () => {};

export { checkoutFreeBasket, deleteRelease };
