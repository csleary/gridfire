/* eslint-disable no-undef */
import { encodeBytes32String, parseEther } from "ethers";
const DAI_CONTRACT_ADDRESS = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";
import assert from "assert";
import { expect } from "chai";
import { ethers } from "hardhat";

import { daiAbi } from "./utils";

// Run on localhost mainnet fork with funded accounts.

describe("GridfireEditions contract", async () => {
  let gridfireEditions;
  let gridfirePayment;

  before(async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const GridfirePayment = await ethers.getContractFactory("GridfirePayment");
    gridfirePayment = await GridfirePayment.deploy();
    await gridfirePayment.waitForDeployment();
    await gridfirePayment.initialize();
    const address = await gridfirePayment.getAddress();

    const GridfireEditions = await ethers.getContractFactory("GridfireEditions");
    gridfireEditions = await GridfireEditions.deploy();
    await gridfireEditions.waitForDeployment();
    await gridfireEditions.initialize(address);
  });

  const releaseIdBytes = encodeBytes32String("62e27da802f11bcfd8cdee0c");
  const PRICE = 50;
  const BUYER_ALLOWANCE = 200;
  const BUYER_PAID = 55;
  let editionId;

  const editionToMint = {
    amount: 100,
    objectId: encodeBytes32String("6335db4d9f6d66d370946a99"),
    price: parseEther(PRICE.toString()),
    releaseId: releaseIdBytes,
    uri: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
  };

  it("should NOT let buyer set editions address", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const instanceEditions = await gridfireEditions.connect(owner);
    const address = await instanceEditions.getAddress();
    const instance = await gridfirePayment.connect(buyer);
    expect(instance.setGridfireEditionsAddress(address)).to.eventually.be.rejected;
  });

  it("should let owner set editions address", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const instanceEditions = await gridfireEditions.connect(owner);
    const address = await instanceEditions.getAddress();
    const instance = await gridfirePayment.connect(owner);
    await instance.setGridfireEditionsAddress(address);
  });

  it("should NOT let buyer call transferEditionPayment", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const instance = await gridfirePayment.connect(buyer);
    await expect(instance.transferEditionPayment(artist, buyer, parseEther("10"))).to.be.rejectedWith(
      "For internal use only."
    );
  });

  it("should let artist mint edition", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const instanceArtist = await gridfireEditions.connect(artist);
    await instanceArtist.mintEdition(...Object.values(editionToMint));
    const mintFilter = gridfireEditions.filters.EditionMinted(releaseIdBytes, artist.address);
    currentBlock = await ethers.provider.getBlockNumber();
    const mintEvents = await gridfireEditions.queryFilter(mintFilter, currentBlock - 100);
    ({ editionId } = mintEvents[0].args);
    assert(editionId === 1n);
  });

  it("should update buyer's dai allowance", async () => {
    const [owner, buyer] = await ethers.getSigners();
    const dai = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, buyer);
    const paymentInstance = await gridfirePayment.connect(buyer);
    const paymentInstanceAddress = await paymentInstance.getAddress();
    await dai.approve(paymentInstanceAddress, parseEther(BUYER_ALLOWANCE.toString()));
    const allowance = await dai.allowance(buyer.address, paymentInstanceAddress);
    assert(allowance === parseEther(BUYER_ALLOWANCE.toString()));
  });

  it("should let buyer purchase edition", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const instanceBuyer = await gridfireEditions.connect(buyer);

    await instanceBuyer.purchaseGridfireEdition(
      editionId,
      parseEther(BUYER_PAID.toString()),
      artist.address,
      releaseIdBytes
    );

    const balance = await gridfireEditions.balanceOf(buyer.address, editionId);
    assert(balance === 1n);
  });

  it("should reduce buyer's allowance by amount paid", async () => {
    const [owner, buyer] = await ethers.getSigners();
    const dai = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, buyer);
    const paymentInstance = await gridfirePayment.connect(buyer);
    const paymentInstanceAddress = await paymentInstance.getAddress();
    const newAllowance = await dai.allowance(buyer.address, paymentInstanceAddress);
    assert(newAllowance === parseEther((BUYER_ALLOWANCE - BUYER_PAID).toString()));
  });

  it("should update artist and owner balances", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const artistBalance = await gridfirePayment.getBalance(artist.address);
    assert(artistBalance === parseEther("52.25"));
    const ownerBalance = await gridfirePayment.getBalance(owner.address);
    assert(ownerBalance === parseEther("2.75"));
  });
});
