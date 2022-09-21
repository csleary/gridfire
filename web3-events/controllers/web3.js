import { Contract, ethers, utils } from "ethers";
import Release from "gridfire-web3-events/models/Release.js";
import Sale from "gridfire-web3-events/models/Sale.js";
import User from "gridfire-web3-events/models/User.js";
import abi from "gridfire-web3-events/controllers/abi.js";
import { publishToQueue } from "./amqp.js";

const { CONTRACT_ADDRESS, NETWORK_URL, NETWORK_KEY } = process.env;

const getProvider = () => {
  return ethers.getDefaultProvider(`${NETWORK_URL}/${NETWORK_KEY}`);
};

const getGridFireContract = () => {
  const provider = getProvider();
  return new Contract(CONTRACT_ADDRESS, abi, provider);
};

const gridFire = getGridFireContract();

const onPurchase = async (
  buyerAddress,
  artistAddress,
  releaseId,
  userId,
  amountPaid,
  artistShare,
  platformFee,
  event
) => {
  try {
    const date = new Date().toLocaleString("en-UK", { timeZone: "Europe/Amsterdam" });
    const daiPaid = utils.formatEther(amountPaid);
    console.log(`[${date}] 🙌 User ${userId} paid ${daiPaid} DAI for release ${releaseId}!`);

    let price;
    let releaseTitle;
    let type = "album";

    // Check if the purchase is for a single or an album.
    let release = await Release.findOne({ "trackList._id": releaseId }, "artistName trackList.$", { lean: true })
      .populate({ path: "user", model: User, options: { lean: true }, select: "paymentAddress" })
      .exec();

    if (release) {
      const [track] = release.trackList;
      releaseTitle = track.trackTitle;
      ({ price } = track);
      type = "single";
    } else {
      release = await Release.findById(releaseId, "artistName price releaseTitle", { lean: true })
        .populate({ path: "user", model: User, options: { lean: true }, select: "paymentAddress" })
        .exec();

      ({ price, releaseTitle } = release);
    }

    const { artistName, user: artistUser } = release;

    if (utils.getAddress(artistUser.paymentAddress) !== utils.getAddress(artistAddress)) {
      return;
    }

    if (amountPaid.lt(utils.parseEther(price.toString()))) {
      return;
    }

    if (await Sale.exists({ release: releaseId, user: userId })) {
      return;
    }

    const transactionReceipt = await event.getTransactionReceipt();
    const { from: buyer, status } = transactionReceipt;

    if (status === 1) {
      await Sale.create({
        purchaseDate: Date.now(),
        release: releaseId,
        paid: amountPaid,
        fee: platformFee,
        netAmount: artistShare,
        transaction: transactionReceipt,
        type,
        user: userId,
        userAddress: buyer
      }).catch(error => {
        if (error.code === 11000) return;
        console.error(error);
      });

      // Notify user of successful purchase.
      publishToQueue("user", userId, { artistName, releaseTitle, type: "purchaseEvent", userId });
      const artistUserId = artistUser._id.toString();

      // Notify artist of sale.
      publishToQueue("user", artistUserId, {
        artistName,
        artistShare: utils.formatEther(artistShare),
        buyerAddress,
        platformFee: utils.formatEther(platformFee),
        releaseTitle,
        type: "saleEvent",
        userId: artistUserId
      });
    }
  } catch (error) {
    console.error("[Web3 Events] 🔴 Purchase error:", error);
  }
};

const onPurchaseEdition = async (
  buyerAddress,
  artistAddress,
  releaseId,
  userId,
  amountPaid,
  artistShare,
  platformFee,
  editionId,
  event
) => {
  try {
    const date = new Date().toLocaleString("en-UK", { timeZone: "Europe/Amsterdam" });
    const daiPaid = utils.formatEther(amountPaid);
    const id = editionId.toString();
    console.log(`[${date}] 🙌 User ${userId} paid ${daiPaid} DAI for GridFire Edition (${id}), release ${releaseId}!`);

    const release = await Release.findById(releaseId, "artistName releaseTitle", { lean: true })
      .populate({ path: "user", model: User, options: { lean: true }, select: "paymentAddress" })
      .exec();

    const { artistName, releaseTitle, user: artistUser } = release;
    const transactionReceipt = await event.getTransactionReceipt();
    const { status } = transactionReceipt;

    if (status === 1) {
      // Notify user of successful purchase.
      publishToQueue("user", userId, { artistName, releaseTitle, type: "purchaseEditionEvent", userId });
      const artistUserId = artistUser._id.toString();

      // Notify artist of sale.
      publishToQueue("user", artistUserId, {
        artistName,
        artistShare: utils.formatEther(artistShare),
        buyerAddress,
        platformFee: utils.formatEther(platformFee),
        releaseTitle,
        type: "saleEvent",
        userId: artistUserId
      });
    }
  } catch (error) {
    console.error("[Web3 Events] 🔴 Edition Purchase error:", error);
  }
};

export { gridFire, onPurchase, onPurchaseEdition };
