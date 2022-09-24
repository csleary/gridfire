// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract GridFirePayment is Ownable, ERC1155, ERC1155Holder, ERC1155Supply {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

    uint256 private serviceFee = 50; // Global fee variable in thousandths (e.g. 50 = 5%).
    mapping(address => uint256) private balances;
    mapping(uint256 => GridFireEdition) private editions;
    Counters.Counter private editionIdTracker;

    struct BasketItem {
        address artist;
        uint256 amountPaid;
        string releaseId;
        uint256 releasePrice;
    }

    struct GridFireEdition {
        uint256 price;
        address artist;
        string releaseId;
        string uri;
    }

    IERC20 constant dai = IERC20(0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1);

    event Checkout(address indexed buyer, uint256 amount);
    event Claim(address indexed artist, uint256 amount);

    event EditionMinted(
        string indexed releaseId,
        address indexed artist,
        uint256 editionId,
        uint256 amount,
        uint256 price
    );

    event Purchase(
        address indexed buyer,
        address indexed artist,
        string releaseId,
        string userId,
        uint256 amountPaid,
        uint256 artistShare,
        uint256 platformFee
    );

    event PurchaseEdition(
        address indexed buyer,
        address indexed artist,
        uint256 indexed editionId,
        uint256 amountPaid,
        uint256 artistShare,
        uint256 platformFee,
        string releaseId
    );

    event Received(address from, uint256 amount);

    constructor() ERC1155("") {}

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function purchase(
        address artist,
        string calldata releaseId,
        string calldata userId,
        uint256 amountPaid
    ) public {
        require(amountPaid != 0);
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

    function mintEdition(
        uint256 amount,
        uint256 price,
        string calldata metadataUri,
        string calldata releaseId
    ) public {
        editionIdTracker.increment();
        uint256 editionId = editionIdTracker.current();
        _mint(address(this), editionId, amount, "");
        setEditionArtist(editionId, msg.sender);
        setEditionPrice(editionId, price);
        setEditionRelease(editionId, releaseId);
        setEditionUri(editionId, metadataUri);
        emit EditionMinted(releaseId, msg.sender, editionId, amount, price);
    }

    function purchaseGridFireEdition(
        uint256 editionId,
        uint256 amountPaid,
        address paymentAddress
    ) public {
        require(balanceOf(address(this), editionId) != 0, "This GridFire Edition is sold out.");
        require(amountPaid >= editions[editionId].price);
        address artist = editions[editionId].artist;
        require(address(paymentAddress) == address(artist));
        string memory releaseId = editions[editionId].releaseId;
        transferEditionPayment(editionId, amountPaid, artist, releaseId);
        _safeTransferFrom(address(this), msg.sender, editionId, 1, "");
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, ERC1155Receiver)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function setEditionArtist(uint256 editionId, address artist) private {
        editions[editionId].artist = artist;
    }

    function setEditionPrice(uint256 editionId, uint256 price) private {
        editions[editionId].price = price;
    }

    function setEditionRelease(uint256 editionId, string memory releaseId) private {
        editions[editionId].releaseId = releaseId;
    }

    function setEditionUri(uint256 editionId, string memory metadataUri) private {
        editions[editionId].uri = metadataUri;
    }

    function setServiceFee(uint256 newServiceFee) public onlyOwner {
        require(newServiceFee < 1000);
        serviceFee = newServiceFee;
    }

    function getBalance(address artist) public view returns (uint256) {
        return balances[artist];
    }

    function getEdition(uint256 id) public view returns (GridFireEdition memory) {
        return editions[id];
    }

    function getServiceFee() public view returns (uint256) {
        return serviceFee;
    }

    function uri(uint256 editionId) public view override returns (string memory) {
        return (editions[editionId].uri);
    }

    function creditBalances(address artist, uint256 amountPaid) private returns (uint256, uint256) {
        if (amountPaid == 0) {
            return (amountPaid, 0);
        }

        if (serviceFee == 0) {
            balances[artist] += amountPaid;
            return (amountPaid, 0);
        }

        uint256 platformShare = (amountPaid / 1000) * serviceFee;
        uint256 artistShare = amountPaid - platformShare;
        balances[owner()] += platformShare;
        balances[artist] += artistShare;
        return (artistShare, platformShare);
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

    function transferEditionPayment(
        uint256 editionId,
        uint256 amountPaid,
        address artist,
        string memory releaseId
    ) private {
        dai.safeTransferFrom(msg.sender, address(this), amountPaid);
        (uint256 artistShare, uint256 platformShare) = creditBalances(artist, amountPaid);
        emit PurchaseEdition(msg.sender, artist, editionId, amountPaid, artistShare, platformShare, releaseId);
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}
