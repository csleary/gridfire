import { BigNumber, Contract, ethers, utils } from "ethers";
import GridFirePayment from "gridfire/hardhat/artifacts/contracts/GridFirePayment.sol/GridFirePayment.json" assert { type: "json" };
import Release from "gridfire/models/Release.js";
import User from "gridfire/models/User.js";
import daiAbi from "gridfire/controllers/web3/dai.js";

const { CONTRACT_ADDRESS, DAI_CONTRACT_ADDRESS, NETWORK_URL, NETWORK_KEY } = process.env;
const { abi } = GridFirePayment;

const getProvider = () => {
  return ethers.getDefaultProvider(`${NETWORK_URL}/${NETWORK_KEY}`);
};

const getDaiContract = () => {
  const provider = getProvider();
  return new Contract(DAI_CONTRACT_ADDRESS, daiAbi, provider);
};

const getGridFireContract = () => {
  const provider = getProvider();
  return new Contract(CONTRACT_ADDRESS, abi, provider);
};

const getGridFireEdition = async editionId => {
  const provider = getProvider();
  const gridFireContract = getGridFireContract(provider);
  return gridFireContract.getEdition(editionId);
};

const getGridFireEditionsByReleaseId = async releaseId => {
  console.log(releaseId);
  const provider = getProvider();
  const gridFireContract = getGridFireContract(provider);
  const release = await Release.findById(releaseId, "user", { lean: true }).populate("user").exec();
  const artistAccount = utils.getAddress(release.user.account);
  const releaseIdBytes = utils.formatBytes32String(releaseId);
  const mintFilter = gridFireContract.filters.EditionMinted(releaseIdBytes, artistAccount);
  const mintEvents = await gridFireContract.queryFilter(mintFilter);

  const editions = mintEvents.map(({ args }) => {
    const { amount, editionId, artist, price } = args;
    return { amount, editionId, artist, price, releaseId };
  });

  const accounts = Array(editions.length).fill(CONTRACT_ADDRESS);
  const ids = editions.map(({ editionId }) => editionId);
  const balances = await gridFireContract.balanceOfBatch(accounts, ids);
  editions.forEach((edition, index) => (edition.balance = balances[index]));
  return editions;
};

const getGridFireEditionUris = async releaseId => {
  const provider = getProvider();
  const gridFireContract = getGridFireContract(provider);
  const release = await Release.findById(releaseId, "user", { lean: true }).populate("user").exec();
  const artistAccount = utils.getAddress(release.user.account);
  const releaseIdBytes = utils.formatBytes32String(releaseId);
  const mintFilter = gridFireContract.filters.EditionMinted(releaseIdBytes, artistAccount);
  const mintEvents = await gridFireContract.queryFilter(mintFilter);
  const ids = mintEvents.map(({ args }) => args.editionId);
  const uris = Promise.all(ids.map(id => gridFireContract.uri(id)));
  return uris;
};

const getTransaction = async txId => {
  const provider = getProvider();
  const tx = await provider.getTransaction(txId);
  const iface = new utils.Interface(abi);
  const parsedTx = iface.parseTransaction(tx);
  return parsedTx;
};

const getUserGridFireEditions = async userId => {
  const user = await User.findById(userId).exec();
  const userAccount = utils.getAddress(user.account);
  const provider = getProvider();
  const gridFireContract = getGridFireContract(provider);

  // Get all editions sent to user (untrusted):
  const editionsTransferFilter = gridFireContract.filters.TransferSingle(null, null, userAccount);
  const transfers = await gridFireContract.queryFilter(editionsTransferFilter);
  const ids = transfers.map(({ args }) => args.id);
  const onChainEditions = await Promise.all(ids.map(id => gridFireContract.getEdition(id)));
  const onChainReleaseIds = onChainEditions.map(({ releaseId }) => utils.parseBytes32String(releaseId));
  const projection = "artistName artwork releaseTitle trackList._id trackList.trackTitle";

  const releases = await Release.find({ _id: { $in: onChainReleaseIds } }, projection, { lean: true })
    .populate({ path: "user", model: User, options: { lean: true }, select: "account" })
    .exec();

  // Important: get editions minted by the release owner account, for cross-checking.
  const verifiedMintedEditions = await Promise.all(
    releases.map(({ _id, user }) => {
      const releaseId = _id.toString();
      const artistAccount = utils.getAddress(user.account);
      const releaseIdBytes = utils.formatBytes32String(releaseId);
      const artistMintedFilter = gridFireContract.filters.EditionMinted(releaseIdBytes, artistAccount);
      return gridFireContract.queryFilter(artistMintedFilter);
    })
  );

  // All editions purchased by user (to get amount paid).
  const purchasedEditions = await Promise.all(
    releases.map(({ user }) => {
      const artistAccount = utils.getAddress(user.account);
      const editionsPurchaseFilter = gridFireContract.filters.PurchaseEdition(userAccount, artistAccount);
      return gridFireContract.queryFilter(editionsPurchaseFilter);
    })
  );

  const verifiedMintedEditionsFlat = verifiedMintedEditions.flat();
  const purchasedEditionsFlat = purchasedEditions.flat();
  const accounts = Array(ids.length).fill(userAccount);
  const balances = await gridFireContract.balanceOfBatch(accounts, ids);

  const editions = ids.reduce((total, id, index) => {
    const editionMatch = verifiedMintedEditionsFlat.find(edition =>
      BigNumber.from(edition.args.editionId).eq(BigNumber.from(id))
    );

    if (!editionMatch) return total;

    const purchasedMatch = purchasedEditionsFlat.find(edition =>
      BigNumber.from(edition.args.editionId).eq(BigNumber.from(id))
    );

    const transactionHash = purchasedMatch?.transactionHash || editionMatch.transactionHash;

    return [
      ...total,
      {
        _id: transactionHash,
        balance: balances[index],
        id,
        paid: purchasedMatch ? purchasedMatch.args.amountPaid : undefined,
        release: releases.find(({ _id }) => _id.toString() === onChainReleaseIds[index]), // As there could be duplicate releaseIds, the db results length may not match releaseIds array.
        transaction: { transactionHash }
      }
    ];
  }, []);

  return editions;
};

export {
  getDaiContract,
  getGridFireContract,
  getGridFireEdition,
  getGridFireEditionsByReleaseId,
  getGridFireEditionUris,
  getProvider,
  getTransaction,
  getUserGridFireEditions
};
