// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.28;
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC1155PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155PausableUpgradeable.sol";
import {ERC1155BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import {ERC1155SupplyUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IGridfireEditions} from "./IGridfireEditions.sol";
import {IGridfirePayment} from "./IGridfirePayment.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

/// @title Gridfire editions (ERC1155 tokens).
/// @author Chris Leary
/// @notice A token issuance contract for the Gridfire music site (https://gridfire.app).
/// @dev This contract allows artists to create unique tokens representing special edition releases.
/// @dev This calls the Gridfire payments contract for payment handling.
contract GridfireEditions is
    IGridfireEditions,
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ERC1155Holder,
    ERC1155Upgradeable,
    ERC1155BurnableUpgradeable,
    ERC1155PausableUpgradeable,
    ERC1155SupplyUpgradeable
{
    /// @dev Counter for the next edition token ID.
    uint256 private _tokenIds;

    /// @dev Mapping from edition ID to edition details.
    mapping(uint256 => GridfireEdition) private editions;

    /// @dev Address of the Gridfire payment contract.
    address payable private gridfirePaymentAddress;

    /// @notice Initialise contract and set the payment contract address.
    /// @param _gridfirePaymentAddress The address of the Gridfire payment contract.
    function initialize(address _gridfirePaymentAddress) public initializer {
        assert(_gridfirePaymentAddress != address(0));
        __Ownable_init(msg.sender);
        __ERC1155_init("");
        __ERC1155Pausable_init();
        __ERC1155Burnable_init();
        __ERC1155Supply_init();
        __UUPSUpgradeable_init();
        gridfirePaymentAddress = payable(address(_gridfirePaymentAddress));
    }

    /// @notice Set the base token URI.
    /// @param newuri The new base URI for the token metadata.
    /// @dev This function can only be called by the contract owner.
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
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
    /// @inheritdoc UUPSUpgradeable
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Ensure funds sent to the contract are logged.
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /// @notice Transfer payment for an edition purchase.
    /// @param editionId The ID of the edition being purchased.
    /// @param amountPaid The total amount paid by the buyer.
    /// @param artist The address of the artist receiving the payment.
    /// @param releaseId The MongoDB ID of the release being purchased.
    /// @dev This function calls the Gridfire payment contract to handle the payment transfer.
    /// @dev It emits a PurchaseEdition event after the payment is processed.
    function _transferEditionPayment(uint256 editionId, uint256 amountPaid, address artist, bytes32 releaseId) private {
        IGridfirePayment gridfirePayment = IGridfirePayment(gridfirePaymentAddress);
        (uint256 artistShare, uint256 platformShare) = gridfirePayment.transferEditionPayment(
            msg.sender,
            artist,
            amountPaid
        );
        emit PurchaseEdition(msg.sender, artist, editionId, amountPaid, artistShare, platformShare, releaseId);
    }

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
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        require(price > 0, "Price must be greater than 0");
        require(bytes(metadataUri).length != 0, "Metadata URI must not be empty");
        require(releaseId.length != 0, "Release ID must not be empty");
        require(objectId.length != 0, "Object ID must not be empty");
        uint256 editionId = ++_tokenIds;
        _mint(address(this), editionId, amount, "");
        editions[editionId].price = price;
        editions[editionId].uri = metadataUri;
        emit EditionMinted(releaseId, msg.sender, objectId, editionId, amount, price);
    }

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
    ) external {
        require(balanceOf(address(this), editionId) != 0, "Edition sold out");
        require(amountPaid >= editions[editionId].price, "Insufficient payment amount");
        require(paymentAddress != address(0), "Payment address invalid");
        require(releaseId.length > 0, "Release ID must not be empty");
        _transferEditionPayment(editionId, amountPaid, paymentAddress, releaseId);
        _safeTransferFrom(address(this), msg.sender, editionId, 1, "");
    }

    /// @notice Checks if the contract supports a given interface ID (ERC165).
    /// @inheritdoc ERC1155Upgradeable
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155Holder, ERC1155Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Get the URI for a specific edition.
    /// @param editionId The ID of the edition.
    /// @return The URI for the edition metadata.
    function uri(uint256 editionId) public view override(ERC1155Upgradeable) returns (string memory) {
        return (editions[editionId].uri);
    }

    /// @notice Allow funds sent directly to the contract to be withdrawn by the owner.
    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    /// @notice Internal hook that is called after any token transfer, mint, or burn.
    /// @inheritdoc ERC1155Upgradeable
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155Upgradeable, ERC1155PausableUpgradeable, ERC1155SupplyUpgradeable) {
        super._update(from, to, ids, values);
    }
}
