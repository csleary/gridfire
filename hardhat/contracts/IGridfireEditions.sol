// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.28;

/// @title Gridfire editions interface.
/// @author Chris Leary
/// @notice A token issuance contract for the Gridfire music site (https://gridfire.app).
interface IGridfireEditions {
    /// @notice Represents a Gridfire edition.
    /// @param price The price of the edition.
    /// @param uri The URI for the edition metadata.
    struct GridfireEdition {
        uint256 price;
        string uri;
    }

    /// @notice Emitted when a new edition is minted.
    /// @param releaseId The MongoDB ID of the release.
    /// @param artist The address of the artist who minted the edition.
    /// @param objectId The MongoDB ID of the edition.
    /// @param editionId The ID of the minted edition.
    /// @param amount The number of tokens minted.
    /// @param price The price of the edition.
    event EditionMinted(
        bytes32 indexed releaseId,
        address indexed artist,
        bytes32 indexed objectId,
        uint256 editionId,
        uint256 amount,
        uint256 price
    );

    /// @notice Emitted when an edition is purchased.
    /// @param buyer The address of the buyer.
    /// @param artist The address of the artist who receives the payment.
    /// @param editionId The ID of the purchased edition.
    /// @param amountPaid The total amount paid by the buyer.
    /// @param artistShare The share of the payment received by the artist.
    /// @param platformFee The platform fee deducted from the payment.
    /// @param releaseId The MongoDB ID of the release being purchased.
    event PurchaseEdition(
        address indexed buyer,
        address indexed artist,
        uint256 indexed editionId,
        uint256 amountPaid,
        uint256 artistShare,
        uint256 platformFee,
        bytes32 releaseId
    );

    /// @notice Emitted when funds are received by the contract.
    /// @param from The address that sent the funds.
    /// @param amount The amount of funds received.
    event Received(address from, uint256 amount);

    /// @notice Ensure funds sent to the contract are logged.
    receive() external payable;

    /// @notice Mint a new edition token.
    /// @param amount The number of tokens to mint.
    /// @param price The price of the edition.
    /// @param metadataUri The URI for the token metadata.
    /// @param releaseId The MongoDB ID of the release being minted.
    /// @param objectId The MongoDB ID of the edition being minted.
    function mintEdition(
        uint256 amount,
        uint256 price,
        string calldata metadataUri,
        bytes32 releaseId,
        bytes32 objectId
    ) external;

    /// @notice Purchase a Gridfire edition.
    /// @param editionId The ID of the edition being purchased.
    /// @param amountPaid The total amount paid by the buyer.
    /// @param paymentAddress The address to which the payment is sent.
    /// @param releaseId The MongoDB ID of the release being purchased.
    /// @dev This function checks if the edition is available, processes the payment, and transfers the edition token to the buyer.
    /// @dev It emits a PurchaseEdition event after payment.
    function purchaseGridfireEdition(
        uint256 editionId,
        uint256 amountPaid,
        address paymentAddress,
        bytes32 releaseId
    ) external;

    /// @notice Allow funds sent directly to the contract to be withdrawn by the owner.
    function withdraw() external;
}
