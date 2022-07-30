const GridFirePayment = ethers.getContractFactory("GridFirePayment");
const assert = require("assert");

describe("GridFirePayment contract", async () => {
  const [owner, buyer, artist] = await ethers.getSigners();

  it("should get service fee", async () => {
    const instance = await GridFirePayment.deploy();
    const currentFee = await instance.getServiceFee();
    assert.equal(50, currentFee);
  });

  it("should set service fee", async () => {
    const instance = await GridFirePayment.deploy();
    await instance.setServiceFee(150, { from: owner });
    const currentFee = await instance.getServiceFee();
    assert.equal(150, currentFee);
  });
});
