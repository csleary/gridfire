/* eslint-disable no-undef */
const { BigNumber, utils } = require("ethers");
const DAI_CONTRACT_ADDRESS = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";
const assert = require("assert");
const { daiAbi } = require("./utils");
const { ethers } = require("hardhat");

// Run on localhost mainnet fork with funded accounts.

describe("GridFireEditions contract", async () => {
  let gridFireEditions;
  let gridFirePayment;

  before(async () => {
    const GridFirePayment = await ethers.getContractFactory("GridFirePayment");
    gridFirePayment = await GridFirePayment.deploy();
    const { address } = await gridFirePayment.deployed();
    await gridFirePayment.initialize();

    const GridFireEditions = await ethers.getContractFactory("GridFireEditions");
    gridFireEditions = await GridFireEditions.deploy();
    await gridFireEditions.deployed();
    await gridFireEditions.initialize(address);
  });

  const releaseIdBytes = utils.formatBytes32String("62e27da802f11bcfd8cdee0c");
  const PRICE = 50;
  const BUYER_ALLOWANCE = 200;
  const BUYER_PAID = 55;
  let editionId;

  const editionToMint = {
    amount: 100,
    price: utils.parseEther(PRICE.toString()),
    uri: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    releaseId: releaseIdBytes,
    objectId: utils.formatBytes32String("6335db4d9f6d66d370946a99")
  };

  it("should let artist mint edition", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const instanceArtist = await gridFireEditions.connect(artist);
    await instanceArtist.mintEdition(...Object.values(editionToMint));
    const mintFilter = gridFireEditions.filters.EditionMinted(releaseIdBytes, artist.address);
    const mintEvents = await gridFireEditions.queryFilter(mintFilter);
    ({ editionId } = mintEvents[0].args);
    assert(editionId.eq(BigNumber.from("1")));
  });

  it("should update buyer's dai allowance", async () => {
    const [owner, buyer] = await ethers.getSigners();
    const dai = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, buyer);
    const paymentInstance = await gridFirePayment.connect(buyer);
    await dai.approve(paymentInstance.address, utils.parseEther(BUYER_ALLOWANCE.toString()));
    const allowance = await dai.allowance(buyer.address, paymentInstance.address);
    assert(allowance.eq(utils.parseEther(BUYER_ALLOWANCE.toString())));
  });

  it("should let buyer purchase edition", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const instanceBuyer = await gridFireEditions.connect(buyer);

    await instanceBuyer.purchaseGridFireEdition(
      editionId,
      utils.parseEther(BUYER_PAID.toString()),
      artist.address,
      releaseIdBytes
    );

    const balance = await gridFireEditions.balanceOf(buyer.address, editionId);
    assert(balance.eq(BigNumber.from("1")));
  });

  it("should reduce buyer's allowance by amount paid", async () => {
    const [owner, buyer] = await ethers.getSigners();
    const dai = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, buyer);
    const paymentInstance = await gridFirePayment.connect(buyer);
    const newAllowance = await dai.allowance(buyer.address, paymentInstance.address);
    assert(newAllowance.eq(utils.parseEther((BUYER_ALLOWANCE - BUYER_PAID).toString())));
  });

  it("should update artist and owner balances", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const artistBalance = await gridFirePayment.getBalance(artist.address);
    assert(artistBalance.eq(utils.parseEther("52.25")));
    const ownerBalance = await gridFirePayment.getBalance(owner.address);
    assert(ownerBalance.eq(utils.parseEther("2.75")));
  });
});
