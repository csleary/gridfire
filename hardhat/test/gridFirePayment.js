const GridFirePayment = ethers.getContractFactory("GridFirePayment");
const assert = require("assert");

describe("GridFirePayment contract", async () => {
  const [owner, buyer, artist] = await ethers.getSigners();

  it("should make a buyer payment", async () => {
    const instance = await GridFirePayment.deploy();
    const price = 1000;
    const value = 1500_000_000_000_000;
    await instance.purchase(artist, price, { from: buyer, value });
  });

  it("should get artist's balance", async () => {
    const instance = await GridFirePayment.deploy();
    const artistShare = await instance.getBalance(artist, { from: artist });
    assert.equal(1425_000_000_000_000, artistShare);
  });

  it("should get owner's balance", async () => {
    const instance = await GridFirePayment.deploy();
    const ownerBalance = await instance.getOwnerBalance({ from: owner });
    assert.equal(75_000_000_000_000, ownerBalance);
  });

  it("should get contract balance", async () => {
    const instance = await GridFirePayment.deploy();
    const contractBalance = await web3.eth.getBalance(instance.address);
    assert.equal(1500_000_000_000_000, contractBalance);
  });

  it("should make a another buyer payment", async () => {
    const instance = await GridFirePayment.deploy();
    const price = 2500_000_000_000_000;
    const value = 2500_000_000_000_000;
    await instance.purchase(artist, price, { from: buyer, value });
    const contractBalance = await web3.eth.getBalance(instance.address);
    const fee = (value * 5) / 100;
    const artistShare = value - fee;
    assert.equal(2375_000_000_000_000, artistShare);
    assert.equal(125_000_000_000_000, fee);
    assert.equal(4000_000_000_000_000, contractBalance);
  });

  it("should not let non-artist address withdraw", async () => {
    const instance = await GridFirePayment.deploy();
    assert.rejects(async () => await instance.claim({ from: accounts[3] }));
  });

  it("should let artist address withdraw", async () => {
    const instance = await GridFirePayment.deploy();
    await instance.claim({ from: artist });
  });

  it("should show artist balance as 0 after claim", async () => {
    const instance = await GridFirePayment.deploy();
    const balance = await instance.getBalance(artist);
    assert.equal(0, ethers.utils.parseEther(balance));
  });

  it("should let owner withdraw", async () => {
    const instance = await GridFirePayment.deploy();
    const balance = await instance.getOwnerBalance();
    assert.equal(ethers.utils.formatEther("0.0002"), balance);
    await instance.withdrawOwnerBalance({ from: owner });
  });

  it("should show owner balance as 0 after claim", async () => {
    const instance = await GridFirePayment.deploy();
    const balance = await instance.getOwnerBalance();
    assert.equal(0, ethers.utils.parseEther(balance));
  });

  it("should get service fee", async () => {
    const instance = await GridFirePayment.deploy();
    const currentFee = await instance.getServiceFee();
    assert.equal(5, currentFee);
  });

  it("should set service fee", async () => {
    const instance = await GridFirePayment.deploy();
    await instance.setServiceFee(15, { from: owner });
    const currentFee = await instance.getServiceFee();
    assert.equal(15, currentFee);
  });
});
