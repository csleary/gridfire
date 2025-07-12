/* eslint-disable no-undef */
import { encodeBytes32String, parseEther } from "ethers";
const DAI_CONTRACT_ADDRESS = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";
import assert, { equal } from "assert";
import { expect } from "chai";
import { ethers } from "hardhat";

import { daiAbi } from "./utils";

// Run on localhost mainnet fork with funded accounts.

describe("GridfirePayment contract", async () => {
  let gridfirePayment;

  beforeEach(async () => {
    const GridfirePayment = await ethers.getContractFactory("GridfirePayment");
    gridfirePayment = await GridfirePayment.deploy();
    await gridfirePayment.waitForDeployment();
    await gridfirePayment.initialize();
  });

  it("should get service fee", async () => {
    const currentFee = await gridfirePayment.getServiceFee();
    assert(50n === currentFee);
  });

  it("should set service fee", async () => {
    const [owner] = await ethers.getSigners();
    await gridfirePayment.setServiceFee(150, { from: owner.address });
    const currentFee = await gridfirePayment.getServiceFee();
    assert(150n === currentFee);
  });

  it("should purchase a release", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const dai = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, buyer);
    const instance = await gridfirePayment.connect(buyer);
    const instanceAddress = await instance.getAddress();
    await dai.approve(instanceAddress, parseEther("200")).catch(console.error);

    const transactionReceipt = await instance.purchase(
      artist.address,
      parseEther("15"),
      encodeBytes32String("62e27da802f11bcfd8cdee0c"),
      encodeBytes32String("62e27da802f11bcfd8cdee0c")
    );

    const { status } = await transactionReceipt.wait();
    equal(status, 1);
    const artistShare = await gridfirePayment.getBalance(artist.address);
    const platformShare = await gridfirePayment.getBalance(owner.address);
    assert(parseEther("14.25") === artistShare);
    assert(parseEther("0.75") === platformShare);
  });

  it("should be able to checkout a basket of tracks", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const dai = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, buyer);
    const instance = await gridfirePayment.connect(buyer);
    const instanceAddress = await instance.getAddress();
    await dai.approve(instanceAddress, parseEther("200"));

    const tracks = [
      {
        amountPaid: parseEther("1.50"),
        artist: artist.address,
        releaseId: encodeBytes32String("62e27db307437d64bdb71397")
      },
      {
        amountPaid: parseEther("1.50"),
        artist: artist.address,
        releaseId: encodeBytes32String("62e2bd809538bc71bc83b0fb")
      },
      {
        amountPaid: parseEther("1.50"),
        artist: artist.address,
        releaseId: encodeBytes32String("631224b3ac2aed5ad172d348")
      },
      {
        amountPaid: parseEther("1.50"),
        artist: artist.address,
        releaseId: encodeBytes32String("631224b3ac2aed5ad172d348")
      }
    ];

    const transactionReceipt = await instance.checkout(tracks, encodeBytes32String("625716987c91fe99ee9d8a53"));
    const { status } = await transactionReceipt.wait();
    equal(status, 1);
    const artistShare = await gridfirePayment.getBalance(artist.address);
    const platformShare = await gridfirePayment.getBalance(owner.address);
    assert(parseEther("5.7") === artistShare);
    assert(parseEther("0.3") === platformShare);
  });

  it("should let the artist claim their balance", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const dai = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, buyer);
    const instanceBuyer = await gridfirePayment.connect(buyer);
    const instanceAddress = await instanceBuyer.getAddress();
    await dai.approve(instanceAddress, parseEther("200"));
    const oldBalance = await dai.balanceOf(artist.address);

    const transactionReceipt = await instanceBuyer.purchase(
      artist.address,
      parseEther("15"),
      encodeBytes32String("62e27da802f11bcfd8cdee0c"),
      encodeBytes32String("62e27da802f11bcfd8cdee0c")
    );

    {
      const { status } = await transactionReceipt.wait();
      equal(status, 1);
      const artistShare = await gridfirePayment.getBalance(artist.address);
      const platformShare = await gridfirePayment.getBalance(owner.address);
      assert(parseEther("14.25") === artistShare);
      assert(parseEther("0.75") === platformShare);
    }

    {
      const instanceArtist = await gridfirePayment.connect(artist);
      const claimTxReceipt = await instanceArtist.claim();
      const { status } = await claimTxReceipt.wait();
      equal(status, 1);
      const artistShare = await gridfirePayment.getBalance(artist.address);
      assert(0n === artistShare);
      const newBalance = await dai.balanceOf(artist.address);
      assert(newBalance - oldBalance === parseEther("14.25"));
    }
  });

  it("should reject as contract address not set", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const instanceBuyer = await gridfirePayment.connect(buyer);
    await expect(instanceBuyer.transferEditionPayment(artist, buyer, parseEther("10"))).to.be.revertedWith(
      "gridfireEditions address not set."
    );
  });
});
