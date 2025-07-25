// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.28;
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./IGridfirePayment.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract GridfirePayment is
    IGridfirePayment,
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    uint256 private serviceFee;
    mapping(address => uint256) private balances;
    IERC20 constant DAI_CONTRACT = IERC20(0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1);
    address payable gridfireEditionsAddress;

    modifier onlyGridfire() {
        require(gridfireEditionsAddress != address(0), "Editions address not set.");
        require(msg.sender == gridfireEditionsAddress || msg.sender == owner(), "For internal use only.");
        _;
    }

    function initialize() public initializer {
        __Pausable_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        serviceFee = 50;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function _creditBalances(address artist, uint256 amountPaid) private returns (uint256, uint256) {
        require(artist != address(0));

        if (amountPaid == 0) {
            return (amountPaid, 0);
        }

        if (serviceFee == 0) {
            balances[artist] += amountPaid;
            return (amountPaid, 0);
        }

        uint256 platformShare = (amountPaid * serviceFee) / 1000;
        uint256 artistShare = amountPaid - platformShare;
        balances[owner()] += platformShare;
        balances[artist] += artistShare;
        return (artistShare, platformShare);
    }

    function _pullDai(address from, uint256 amount) internal {
        require(from != address(0), "Invalid sender");
        require(amount > 0, "Amount must be > 0");
        DAI_CONTRACT.safeTransferFrom(from, address(this), amount);
    }

    function _transferEditionPayment(
        address buyer,
        address artist,
        uint256 amountPaid
    ) private returns (uint256, uint256) {
        _pullDai(buyer, amountPaid);
        (uint256 artistShare, uint256 platformShare) = creditBalances(artist, amountPaid);
        return (artistShare, platformShare);
    }

    function _transferPayment(address artist, uint256 amountPaid, bytes32 releaseId, bytes32 userId) private {
        _pullDai(msg.sender, amountPaid);
        (uint256 artistShare, uint256 platformShare) = creditBalances(artist, amountPaid);
        emit Purchase(msg.sender, artist, releaseId, userId, amountPaid, artistShare, platformShare);
    }

    function claim() public nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount != 0);
        balances[msg.sender] = 0;
        DAI_CONTRACT.safeTransfer(msg.sender, amount);
        emit Claim(msg.sender, amount);
    }

    function creditBalances(address artist, uint256 amountPaid) private returns (uint256, uint256) {
        return _creditBalances(artist, amountPaid);
    }

    function checkout(BasketItem[] calldata basket, bytes32 userId) external nonReentrant {
        uint256 total = 0;

        for (uint256 i = 0; i < basket.length; i++) {
            uint256 amountPaid = basket[i].amountPaid;
            total += amountPaid;
        }

        // Ensure the full balance is sent to the contract before calculating shares.
        _pullDai(msg.sender, total);

        for (uint256 i = 0; i < basket.length; i++) {
            address artist = basket[i].artist;
            uint256 amountPaid = basket[i].amountPaid;
            bytes32 releaseId = basket[i].releaseId;
            (uint256 artistShare, uint256 platformShare) = creditBalances(artist, amountPaid);
            emit Purchase(msg.sender, artist, releaseId, userId, amountPaid, artistShare, platformShare);
        }

        emit Checkout(msg.sender, total);
    }

    function getBalance(address artist) external view returns (uint256) {
        return balances[artist];
    }

    function getGridfireEditionsAddress() external view returns (address) {
        return gridfireEditionsAddress;
    }

    function getServiceFee() external view returns (uint256) {
        return serviceFee;
    }

    function purchase(address artist, uint256 amountPaid, bytes32 releaseId, bytes32 userId) external nonReentrant {
        require(artist != address(0) && amountPaid != 0);
        transferPayment(artist, amountPaid, releaseId, userId);
    }

    function setGridfireEditionsAddress(address payable contractAddress) external onlyOwner {
        require(contractAddress != address(0));
        gridfireEditionsAddress = contractAddress;
    }

    function setServiceFee(uint256 newServiceFee) external onlyOwner {
        require(newServiceFee < 1000);
        serviceFee = newServiceFee;
    }

    function transferEditionPayment(
        address buyer,
        address artist,
        uint256 amountPaid
    ) external onlyGridfire returns (uint256, uint256) {
        require(buyer != address(0) && artist != address(0));
        (uint256 artistShare, uint256 platformShare) = _transferEditionPayment(buyer, artist, amountPaid);
        return (artistShare, platformShare);
    }

    function transferPayment(address artist, uint256 amountPaid, bytes32 releaseId, bytes32 userId) public {
        require(artist != address(0));
        require(releaseId.length > 0 && userId.length > 0);
        _transferPayment(artist, amountPaid, releaseId, userId);
    }

    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}
