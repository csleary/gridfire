// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract GridFirePayment is Ownable {
    using SafeERC20 for IERC20;

    // Global fee variable in thousandths (e.g. 50 = 5%).
    uint256 private serviceFee = 50;
    mapping(address => uint256) balances;

    struct BasketItem {
        address artist;
        uint256 amountPaid;
        string releaseId;
        uint256 releasePrice;
    }

    IERC20 dai = IERC20(0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1); // Arbitrum Mainnet/dev fork
    // IERC20 dai = IERC20(0xe905AaAb78C4160C3FdaC2eBbf7a01C34CA28B4F); // Arbitrum Rinkeby

    event Checkout(address indexed buyer, uint256 amount);
    event Claim(address indexed artist, uint256 amount);

    event Purchase(
        address indexed buyer,
        address indexed artist,
        string releaseId,
        string userId,
        uint256 amountPaid,
        uint256 artistShare,
        uint256 platformFee
    );

    event Received(address from, uint256 amount);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function purchase(
        address artist,
        string calldata releaseId,
        string calldata userId,
        uint256 amountPaid,
        uint256 releasePrice
    ) public {
        require(amountPaid != 0);
        require(amountPaid >= releasePrice);
        transferPayment(artist, releaseId, userId, amountPaid);
    }

    function checkout(BasketItem[] calldata basket, string calldata userId) public {
        uint256 total = 0;

        for (uint256 i = 0; i < basket.length; i++) {
            uint256 amountPaid = basket[i].amountPaid;
            uint256 releasePrice = basket[i].releasePrice;
            require(amountPaid >= releasePrice, "Payment amount too low.");
            total += amountPaid;
        }

        // Ensure the full balance is sent to the contract before calculating shares.
        dai.safeTransferFrom(msg.sender, address(this), total);

        for (uint256 i = 0; i < basket.length; i++) {
            address artist = basket[i].artist;
            uint256 amountPaid = basket[i].amountPaid;
            string calldata releaseId = basket[i].releaseId;
            (uint256 artistShare, uint256 platformShare) = creditBalances(artist, amountPaid);
            emit Purchase(msg.sender, artist, releaseId, userId, amountPaid, artistShare, platformShare);
        }

        emit Checkout(msg.sender, total);
    }

    function claim() public {
        uint256 amount = balances[msg.sender];
        require(amount != 0, "Nothing to claim.");
        balances[msg.sender] = 0;
        dai.safeTransfer(msg.sender, amount);
        emit Claim(msg.sender, amount);
    }

    function setServiceFee(uint256 newServiceFee) public onlyOwner {
        require(newServiceFee < 1000);
        serviceFee = newServiceFee;
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function getBalance(address artist) public view returns (uint256) {
        return balances[artist];
    }

    function getServiceFee() public view returns (uint256) {
        return serviceFee;
    }

    function creditBalances(address artist, uint256 amountPaid) private returns (uint256, uint256) {
        if (amountPaid == 0) {
            return (amountPaid, 0);
        }

        if (serviceFee == 0) {
            balances[artist] += amountPaid;
            return (amountPaid, 0);
        } else {
            uint256 platformShare = (amountPaid / 1000) * serviceFee;
            uint256 artistShare = amountPaid - platformShare;
            balances[owner()] += platformShare;
            balances[artist] += artistShare;
            return (artistShare, platformShare);
        }
    }

    function transferPayment(
        address artist,
        string calldata releaseId,
        string calldata userId,
        uint256 amountPaid
    ) private {
        dai.safeTransferFrom(msg.sender, address(this), amountPaid);
        (uint256 artistShare, uint256 platformShare) = creditBalances(artist, amountPaid);
        emit Purchase(msg.sender, artist, releaseId, userId, amountPaid, artistShare, platformShare);
    }
}
