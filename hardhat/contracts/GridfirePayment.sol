// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.28;
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IGridfirePayment} from "./IGridfirePayment.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Gridfire payments.
/// @author Chris Leary
/// @notice A payment contract for the Gridfire music site (https://gridfire.app).
/// @dev This contract handles payments to artists, collects service fees, and allows users to claim their balances.
/// @dev It uses DAI as the payment token and is designed to be upgradeable.
/// @dev The contract is initialized with a service fee of 5% (in basis points).
/// @dev It can be called from the Gridfire Editions contract for Editions payment.
contract GridfirePayment is
    IGridfirePayment,
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    uint256 public serviceFee;
    mapping(address => uint256) private balances;
    IERC20 private constant DAI_CONTRACT = IERC20(0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1);
    address payable private gridfireEditionsAddress;

    modifier onlyGridfire() {
        require(gridfireEditionsAddress != address(0), "Editions address not set.");
        require(msg.sender == gridfireEditionsAddress || msg.sender == owner(), "For internal use only.");
        _;
    }

    /// @notice Set the initial service fee (bps).
    function initialize() public initializer {
        __Pausable_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        serviceFee = 500;
    }

    /// @notice Pause the contract, preventing any state changes.
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract, allowing state changes again.
    function unpause() public onlyOwner {
        _unpause();
    }

    /// @notice Authorize the upgrade of the contract.
    /// @param newImplementation The address of the new implementation contract.
    /// @dev This function is called by the UUPS proxy to authorize upgrades.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Ensure funds sent to the contract are logged.
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /// @notice Credit balances for an artist based on the amount paid.
    /// @param artist The address of the artist receiving the payment.
    /// @param amountPaid The total amount paid by the user.
    /// @return artistShare The amount credited to the artist.
    /// @return platformShare The amount credited to the platform (Gridfire).
    /// @dev This function calculates the artist's share and the platform's share based on the service fee.
    /// @dev If the service fee is 0, the entire amount is credited to the artist.
    function _creditBalances(address artist, uint256 amountPaid) private returns (uint256, uint256) {
        require(artist != address(0));

        if (amountPaid == 0) {
            return (amountPaid, 0);
        }

        if (serviceFee == 0) {
            balances[artist] += amountPaid;
            return (amountPaid, 0);
        }

        uint256 platformShare = (amountPaid * serviceFee) / 10_000;
        uint256 artistShare = amountPaid - platformShare;
        balances[owner()] += platformShare;
        balances[artist] += artistShare;
        return (artistShare, platformShare);
    }

    /// @notice Pull DAI from the sender to this contract.
    /// @param from The address from which to pull DAI.
    /// @param amount The amount of DAI to pull.
    function _pullDai(address from, uint256 amount) internal {
        require(from != address(0), "Invalid sender");
        require(amount > 0, "Amount must be > 0");
        DAI_CONTRACT.safeTransferFrom(from, address(this), amount);
    }

    /// @notice Internal function to handle edition payments.
    /// @param buyer The address of the buyer.
    /// @param artist The address of the artist receiving the payment.
    /// @param amountPaid The total amount paid by the buyer.
    /// @return artistShare The amount credited to the artist.
    /// @return platformShare The amount credited to the platform (Gridfire).
    function _transferEditionPayment(
        address buyer,
        address artist,
        uint256 amountPaid
    ) private returns (uint256, uint256) {
        _pullDai(buyer, amountPaid);
        (uint256 artistShare, uint256 platformShare) = creditBalances(artist, amountPaid);
        return (artistShare, platformShare);
    }

    /// @notice Internal function to handle payments for a release.
    /// @param artist The address of the artist receiving the payment.
    /// @param amountPaid The total amount paid by the user.
    /// @param releaseId The ID of the release being purchased (either album or track).
    /// @param userId The MongoDB ID of the user making the purchase.
    /// @dev This function pulls DAI from the user, credits the artist and platform, and emits a Purchase event.
    function _transferPayment(address artist, uint256 amountPaid, bytes32 releaseId, bytes32 userId) private {
        _pullDai(msg.sender, amountPaid);
        (uint256 artistShare, uint256 platformShare) = creditBalances(artist, amountPaid);
        emit Purchase(msg.sender, artist, releaseId, userId, amountPaid, artistShare, platformShare);
    }

    /// @notice Allow the user to withdraw their DAI balance.
    /// @dev This function allows users to claim their DAI balance, which is set to 0 after the transfer.
    /// @dev It emits a Claim event after the transfer.
    function claim() public nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount != 0);
        balances[msg.sender] = 0;
        DAI_CONTRACT.safeTransfer(msg.sender, amount);
        emit Claim(msg.sender, amount);
    }

    /// @notice Credit balances for an artist based on the amount paid.
    /// @param artist The address of the artist receiving the payment.
    /// @param amountPaid The total amount paid by the user.
    /// @return artistShare The amount credited to the artist.
    /// @return platformShare The amount credited to the platform (Gridfire).
    function creditBalances(address artist, uint256 amountPaid) private returns (uint256, uint256) {
        return _creditBalances(artist, amountPaid);
    }

    /// @notice Checkout function to process a basket of items.
    /// @param basket An array of BasketItem structs containing the items to purchase.
    /// @param userId The MongoDB ID of the user making the purchase.
    /// @dev This function calculates the total amount to be paid, pulls DAI from the user, and credits the artist and platform for each item in the basket.
    /// @dev It emits a Checkout event after processing the basket.
    /// @dev Each BasketItem contains the artist address, amount paid, release ID.
    /// @dev A Purchase event is emitted for each item in the basket, to allow for payment validation and fulfillment.
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

    /// @notice Get the balance of an artist.
    /// @param artist The address of the artist whose balance is being queried.
    /// @return The balance of the artist in DAI.
    function getBalance(address artist) external view returns (uint256) {
        return balances[artist];
    }

    /// @notice Get the address of the Gridfire Editions contract.
    /// @return The address of the Gridfire Editions contract.
    /// @dev This function returns the address set for the Gridfire Editions contract, which is used for handling edition payments.
    function getGridfireEditionsAddress() external view returns (address) {
        return gridfireEditionsAddress;
    }

    /// @notice Purchase a release by an artist.
    /// @param artist The address of the artist receiving the payment.
    /// @param amountPaid The total amount paid by the user.
    /// @param releaseId The MongoDB ID of the release being purchased (either album or track).
    /// @param userId The MongoDB ID of the user making the purchase.
    /// @dev This function allows users to purchase a release by an artist, pulling DAI from the user and crediting the artist and platform.
    /// @dev It emits a Purchase event after the payment is processed.
    function purchase(address artist, uint256 amountPaid, bytes32 releaseId, bytes32 userId) external nonReentrant {
        require(artist != address(0) && amountPaid != 0);
        transferPayment(artist, amountPaid, releaseId, userId);
    }

    /// @notice Set the address of the Gridfire Editions contract.
    /// @param contractAddress The address of the Gridfire Editions contract.
    /// @dev This function allows the owner to set the address of the Gridfire Editions contract, used for the Editions payment function and modifier.
    function setGridfireEditionsAddress(address payable contractAddress) external onlyOwner {
        require(contractAddress != address(0));
        gridfireEditionsAddress = contractAddress;
    }

    /// @notice Set the service fee for the contract.
    /// @param newServiceFee The new service fee as a percentage (bps).
    function setServiceFee(uint256 newServiceFee) external onlyOwner {
        require(newServiceFee < 10_000);
        serviceFee = newServiceFee;
    }

    /// @notice Transfer edition payment from a buyer to an artist.
    /// @param buyer The address of the buyer making the payment.
    /// @param artist The address of the artist receiving the payment.
    /// @param amountPaid The total amount paid by the buyer.
    /// @return artistShare The amount credited to the artist.
    /// @return platformShare The amount credited to the platform (Gridfire).
    /// @dev This function is called from the Gridfire Editions contract to handle edition payments.
    function transferEditionPayment(
        address buyer,
        address artist,
        uint256 amountPaid
    ) external onlyGridfire returns (uint256, uint256) {
        require(buyer != address(0) && artist != address(0));
        (uint256 artistShare, uint256 platformShare) = _transferEditionPayment(buyer, artist, amountPaid);
        return (artistShare, platformShare);
    }

    /// @notice Transfer payment from a user to an artist for a release.
    /// @param artist The address of the artist receiving the payment.
    /// @param amountPaid The total amount paid by the user.
    /// @param releaseId The MongoDB ID of the release being purchased (either album or track).
    /// @param userId The MongoDB ID of the user making the purchase.
    /// @dev This function allows users to purchase a release by an artist, pulling DAI from the user and crediting the artist and platform.
    function transferPayment(address artist, uint256 amountPaid, bytes32 releaseId, bytes32 userId) public {
        require(artist != address(0));
        require(releaseId.length > 0 && userId.length > 0);
        _transferPayment(artist, amountPaid, releaseId, userId);
    }

    /// @notice Allow funds sent directly to the contract to be withdrawn by the owner.
    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}
