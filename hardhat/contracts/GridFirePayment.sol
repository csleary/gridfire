// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GridFirePayment is Ownable {
    uint256 private feePercent = 5;
    IERC20 dai = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);

    function transferPayment(address _artist, uint256 _paid) private {
        uint256 artistShare = _paid;
        require(artistShare != 0);

        if (feePercent == 0) {
            dai.transferFrom(msg.sender, _artist, artistShare);
        } else {
            uint256 serviceFee = (artistShare * feePercent) / 100;
            dai.transferFrom(msg.sender, address(this), serviceFee);
            artistShare -= serviceFee;
            dai.transferFrom(msg.sender, _artist, artistShare);
        }
    }

    function purchase(
        address _artist,
        uint256 _paid,
        uint256 _releasePrice
    ) public payable {
        require(_paid != 0);
        require(_paid >= _releasePrice);
        transferPayment(_artist, _paid);
    }

    function getBalance(address _artist) public view returns (uint256) {
        return dai.balanceOf(_artist);
    }

    function getServiceFee() public view returns (uint256) {
        return feePercent;
    }

    function setServiceFee(uint256 newFee) public onlyOwner {
        require(newFee < 100);
        feePercent = newFee;
    }

    function getOwnerBalance() public view returns (uint256) {
        return dai.balanceOf(address(this));
    }

    function withdrawOwnerBalance() public onlyOwner {
        require(dai.balanceOf(address(this)) != 0);
        uint256 amount = dai.balanceOf(address(this));
        dai.transferFrom(address(this), msg.sender, amount);
    }
}
