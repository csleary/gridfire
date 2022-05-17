// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GridFirePayment is Ownable {
    uint256 private feePercent = 5;
    mapping(address => uint256) balances;

    struct BasketItem {
        address artist;
        uint256 amountPaid;
        uint256 releasePrice;
    }

    IERC20 dai = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);

    event Claim(address indexed artist, uint256 amount);
    event Purchase(address indexed buyer, address indexed artist, uint256 amount, uint256 fee);
    event Received(address from, uint256 amount);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function purchase(
        address artist,
        uint256 amountPaid,
        uint256 releasePrice
    ) public {
        require(amountPaid != 0);
        require(amountPaid >= releasePrice);
        transferPayment(artist, amountPaid);
    }

    function checkout(BasketItem[] calldata basket) public {
        uint256 total = 0;

        for (uint256 i = 0; i < basket.length; i++) {
            address artist = basket[i].artist;
            uint256 amountPaid = basket[i].amountPaid;
            uint256 releasePrice = basket[i].releasePrice;
            require(amountPaid != 0);
            require(amountPaid >= releasePrice);
            total += amountPaid;
            (uint256 artistShare, uint256 serviceFee) = creditBalances(artist, amountPaid);
            emit Purchase(msg.sender, artist, artistShare, serviceFee);
        }

        dai.transferFrom(msg.sender, address(this), total);
    }

    function claim() public {
        uint256 amount = balances[msg.sender];
        require(amount != 0, "Nothing to claim.");
        balances[msg.sender] = 0;
        dai.transferFrom(address(this), msg.sender, amount);
        emit Claim(msg.sender, amount);
    }

    function setServiceFee(uint256 newFee) public onlyOwner {
        require(newFee < 100);
        feePercent = newFee;
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function getBalance(address artist) public view returns (uint256) {
        return balances[artist];
    }

    function getServiceFee() public view returns (uint256) {
        return feePercent;
    }

    function creditBalances(address artist, uint256 artistShare) private returns (uint256, uint256) {
        require(artistShare != 0);
        uint256 serviceFee = 0;

        if (feePercent == 0) {
            balances[artist] += artistShare;
        } else {
            serviceFee = (artistShare * feePercent) / 100;
            balances[owner()] += serviceFee;
            artistShare -= serviceFee;
            balances[artist] += artistShare;
        }

        return (artistShare, serviceFee);
    }

    function transferPayment(address artist, uint256 amountPaid) private {
        (uint256 artistShare, uint256 serviceFee) = creditBalances(artist, amountPaid);
        dai.transferFrom(msg.sender, address(this), amountPaid);
        emit Purchase(msg.sender, artist, artistShare, serviceFee);
    }
}
