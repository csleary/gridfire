/* eslint-disable no-undef */
const { BigNumber, utils } = require("ethers");
const DAI_CONTRACT_ADDRESS = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";
const assert = require("assert");
const { daiAbi } = require("./utils");
const { ethers } = require("hardhat");

// Run on localhost mainnet fork with funded accounts.

describe("GridFirePayment contract", async () => {
  let gridFirePayment;

  beforeEach(async () => {
    const GridFirePayment = await ethers.getContractFactory("GridFirePayment");
    gridFirePayment = await GridFirePayment.deploy();
    await gridFirePayment.deployed();
    await gridFirePayment.initialize();
  });

  it("should get service fee", async () => {
    const currentFee = await gridFirePayment.getServiceFee();
    assert(BigNumber.from("50").eq(currentFee));
  });

  it("should set service fee", async () => {
    const [owner] = await ethers.getSigners();
    await gridFirePayment.setServiceFee(150, { from: owner.address });
    const currentFee = await gridFirePayment.getServiceFee();
    assert(BigNumber.from("150").eq(currentFee));
  });

  it("should purchase a release", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const dai = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, buyer);
    const instance = await gridFirePayment.connect(buyer);
    await dai.approve(instance.address, utils.parseEther("200"));

    const transactionReceipt = await instance.purchase(
      artist.address,
      utils.parseEther("15"),
      utils.formatBytes32String("62e27da802f11bcfd8cdee0c"),
      utils.formatBytes32String("62e27da802f11bcfd8cdee0c")
    );

    const { status } = await transactionReceipt.wait();
    assert.equal(status, 1);
    const artistShare = await gridFirePayment.getBalance(artist.address);
    const platformShare = await gridFirePayment.getBalance(owner.address);
    assert(utils.parseEther("14.25").eq(artistShare));
    assert(utils.parseEther("0.75").eq(platformShare));
  });

  it("should be able to checkout a basket of tracks", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const dai = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, buyer);
    const instance = await gridFirePayment.connect(buyer);
    await dai.approve(instance.address, utils.parseEther("200"));

    const tracks = [
      {
        amountPaid: utils.parseEther("1.50"),
        artist: artist.address,
        releaseId: utils.formatBytes32String("62e27db307437d64bdb71397")
      },
      {
        amountPaid: utils.parseEther("1.50"),
        artist: artist.address,
        releaseId: utils.formatBytes32String("62e2bd809538bc71bc83b0fb")
      },
      {
        amountPaid: utils.parseEther("1.50"),
        artist: artist.address,
        releaseId: utils.formatBytes32String("631224b3ac2aed5ad172d348")
      },
      {
        amountPaid: utils.parseEther("1.50"),
        artist: artist.address,
        releaseId: utils.formatBytes32String("631224b3ac2aed5ad172d348")
      }
    ];

    const transactionReceipt = await instance.checkout(tracks, utils.formatBytes32String("625716987c91fe99ee9d8a53"));
    const { status } = await transactionReceipt.wait();
    assert.equal(status, 1);
    const artistShare = await gridFirePayment.getBalance(artist.address);
    const platformShare = await gridFirePayment.getBalance(owner.address);
    assert(utils.parseEther("5.7").eq(artistShare));
    assert(utils.parseEther("0.3").eq(platformShare));
  });

  it("should let the artist claim their balance", async () => {
    const [owner, buyer, artist] = await ethers.getSigners();
    const dai = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, buyer);
    const instanceBuyer = await gridFirePayment.connect(buyer);
    await dai.approve(instanceBuyer.address, utils.parseEther("200"));
    const oldBalance = await dai.balanceOf(artist.address);

    const transactionReceipt = await instanceBuyer.purchase(
      artist.address,
      utils.parseEther("15"),
      utils.formatBytes32String("62e27da802f11bcfd8cdee0c"),
      utils.formatBytes32String("62e27da802f11bcfd8cdee0c")
    );

    {
      const { status } = await transactionReceipt.wait();
      assert.equal(status, 1);
      const artistShare = await gridFirePayment.getBalance(artist.address);
      const platformShare = await gridFirePayment.getBalance(owner.address);
      assert(utils.parseEther("14.25").eq(artistShare));
      assert(utils.parseEther("0.75").eq(platformShare));
    }

    {
      const instanceArtist = await gridFirePayment.connect(artist);
      const claimTxReceipt = await instanceArtist.claim();
      const { status } = await claimTxReceipt.wait();
      assert.equal(status, 1);
      const artistShare = await gridFirePayment.getBalance(artist.address);
      assert(ethers.constants.Zero.eq(artistShare));
      const newBalance = await dai.balanceOf(artist.address);
      assert(newBalance.sub(oldBalance).eq(utils.parseEther("14.25")));
    }
  });
});
