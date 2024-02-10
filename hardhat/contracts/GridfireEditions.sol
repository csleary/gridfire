// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.23;
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./IGridfireEditions.sol";
import "./IGridfirePayment.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

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
    uint256 private _tokenIds;
    mapping(uint256 => GridfireEdition) private editions;
    address payable gridfirePaymentAddress;

    function initialize(address _gridfirePaymentAddress) public initializer {
        assert(_gridfirePaymentAddress != address(0));
        __ERC1155_init("");
        __Ownable_init(msg.sender);
        __ERC1155Pausable_init();
        __ERC1155Burnable_init();
        __ERC1155Supply_init();
        __UUPSUpgradeable_init();
        gridfirePaymentAddress = payable(address(_gridfirePaymentAddress));
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
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

    function _transferEditionPayment(uint256 editionId, uint256 amountPaid, address artist, bytes32 releaseId) private {
        IGridfirePayment gridfirePayment = IGridfirePayment(gridfirePaymentAddress);
        (uint256 artistShare, uint256 platformShare) = gridfirePayment.transferEditionPayment(
            msg.sender,
            artist,
            amountPaid
        );
        emit PurchaseEdition(msg.sender, artist, editionId, amountPaid, artistShare, platformShare, releaseId);
    }

    function mintEdition(
        uint256 amount,
        uint256 price,
        string calldata metadataUri,
        bytes32 releaseId,
        bytes32 objectId
    ) external {
        require(amount > 0 && price > 0);
        require(bytes(metadataUri).length != 0);
        require(releaseId.length != 0 && objectId.length != 0);
        uint256 editionId = ++_tokenIds;
        _mint(address(this), editionId, amount, "");
        editions[editionId].price = price;
        editions[editionId].uri = metadataUri;
        emit EditionMinted(releaseId, msg.sender, objectId, editionId, amount, price);
    }

    function purchaseGridfireEdition(
        uint256 editionId,
        uint256 amountPaid,
        address paymentAddress,
        bytes32 releaseId
    ) external {
        require(balanceOf(address(this), editionId) != 0);
        require(amountPaid >= editions[editionId].price);
        require(paymentAddress != address(0));
        require(releaseId.length > 0);
        _transferEditionPayment(editionId, amountPaid, paymentAddress, releaseId);
        _safeTransferFrom(address(this), msg.sender, editionId, 1, "");
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155Holder, ERC1155Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function uri(uint256 editionId) public view override(ERC1155Upgradeable) returns (string memory) {
        return (editions[editionId].uri);
    }

    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155Upgradeable, ERC1155PausableUpgradeable, ERC1155SupplyUpgradeable) {
        super._update(from, to, ids, values);
    }
}
