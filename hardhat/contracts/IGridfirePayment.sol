// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.28;

/// @title Gridfire payments interface.
/// @author Chris Leary
/// @notice A payment contract for the Gridfire music site (https://gridfire.app).
interface IGridfirePayment {
    /// @notice Represents an item in the user's basket.
    /// @param artist The address of the artist receiving payment.
    /// @param amountPaid The total amount paid for the item.
    /// @param releaseId The MongoDB ID of the release being purchased.
    struct BasketItem {
        address artist;
        uint256 amountPaid;
        bytes32 releaseId;
    }

    /// @notice Emitted when a checkout is initiated.
    /// @param buyer The address of the buyer.
    /// @param amount The total amount paid by the buyer.
    /// @dev This event is emitted when a user checks out their basket.
    event Checkout(address indexed buyer, uint256 amount);

    /// @notice Emitted when an artist claims their earnings.
    /// @param artist The address of the artist claiming earnings.
    /// @param amount The amount claimed by the artist.
    /// @dev This event is emitted when an artist successfully claims their earnings.
    event Claim(address indexed artist, uint256 amount);

    /// @notice Emitted when a purchase is made.
    /// @param buyer The address of the buyer.
    /// @param artist The address of the artist receiving payment.
    /// @param releaseId The MongoDB ID of the release being purchased.
    /// @param userId The MongoDB ID of the user making the purchase.
    /// @param amountPaid The total amount paid for the purchase.
    /// @param artistShare The share of the payment that goes to the artist.
    /// @param platformFee The fee taken by the platform for the transaction.
    /// @dev This event is emitted when a purchase is successfully processed.
    event Purchase(
        address indexed buyer,
        address indexed artist,
        bytes32 releaseId,
        bytes32 userId,
        uint256 amountPaid,
        uint256 artistShare,
        uint256 platformFee
    );

    /// @notice Emitted when a payment is send directly to the contract.
    /// @param from The address sending the payment.
    /// @param amount The amount of the payment.
    event Received(address indexed from, uint256 amount);

    /// @notice Contract receives Ether.
    receive() external payable;

    /// @notice Checkout function to process a basket of items.
    /// @param basket An array of BasketItem structs containing the items to purchase.
    /// @param userId The MongoDB ID of the user making the purchase.
    /// @dev This function calculates the total amount to be paid, pulls DAI from the user, and credits the artist and platform for each item in the basket.
    /// @dev It emits a Checkout event after processing the basket.
    /// @dev Each BasketItem contains the artist address, amount paid, release ID.
    /// @dev A Purchase event is emitted for each item in the basket, to allow for payment validation and fulfillment.
    function checkout(BasketItem[] calldata basket, bytes32 userId) external;

    /// @notice Allow the user to withdraw their DAI balance.
    /// @dev This function allows users to claim their DAI balance, which is set to 0 after the transfer.
    /// @dev It emits a Claim event after the transfer.
    function claim() external;

    /// @notice Get the balance of an artist.
    /// @param artist The address of the artist whose balance is being queried.
    /// @return The balance of the artist in DAI.
    function getBalance(address artist) external view returns (uint256);

    /// @notice Get the address of the Gridfire Editions contract.
    /// @return The address of the Gridfire Editions contract.
    /// @dev This function returns the address set for the Gridfire Editions contract, which is used for handling edition payments.
    function getGridfireEditionsAddress() external view returns (address);

    /// @notice Purchase a release by an artist.
    /// @param artist The address of the artist receiving the payment.
    /// @param amountPaid The total amount paid by the user.
    /// @param releaseId The MongoDB ID of the release being purchased (either album or track).
    /// @param userId The MongoDB ID of the user making the purchase.
    /// @dev This function allows users to purchase a release by an artist, pulling DAI from the user and crediting the artist and platform.
    /// @dev It emits a Purchase event after the payment is processed.
    function purchase(address artist, uint256 amountPaid, bytes32 releaseId, bytes32 userId) external;

    /// @notice Set the address of the Gridfire Editions contract.
    /// @param contractAddress The address of the Gridfire Editions contract.
    /// @dev This function allows the owner to set the address of the Gridfire Editions contract, used for the Editions payment function and modifier.
    function setGridfireEditionsAddress(address payable contractAddress) external;

    /// @notice Set the service fee for the contract.
    /// @param newServiceFee The new service fee as a percentage (bps).
    function setServiceFee(uint256 newServiceFee) external;

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
    ) external returns (uint256, uint256);

    /// @notice Transfer payment from a user to an artist for a release.
    /// @param artist The address of the artist receiving the payment.
    /// @param amountPaid The total amount paid by the user.
    /// @param releaseId The MongoDB ID of the release being purchased (either album or track).
    /// @param userId The MongoDB ID of the user making the purchase.
    /// @dev This function allows users to purchase a release by an artist, pulling DAI from the user and crediting the artist and platform.
    function transferPayment(address artist, uint256 amountPaid, bytes32 releaseId, bytes32 userId) external;

    /// @notice Allow funds sent directly to the contract to be withdrawn by the owner.
    function withdraw() external;
}
