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
        address artist;
        uint256 price;
        string uri;
        string releaseId;
    }

    IERC20 constant dai = IERC20(0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1);

    event Checkout(address indexed buyer, uint256 amount);
    event Claim(address indexed artist, uint256 amount);
    event EditionMinted(address indexed artist, uint256 indexed id, uint256 amount, uint256 price, string indexed releaseId);

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
        string releaseId,
        string userId,
        uint256 amountPaid,
        uint256 artistShare,
        uint256 platformFee,
        uint256 editionId
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
        uint256 amountPaid,
        uint256 releasePrice
    ) public {
        require(amountPaid != 0);
        require(amountPaid >= releasePrice);
        transferPayment(artist, releaseId, userId, amountPaid);
    }

    function purchaseGridFireEdition(
        address artist,
        uint256 editionId,
        string calldata userId,
        uint256 amountPaid
    ) public {
        require(balanceOf(address(this), editionId) != 0, "This GridFire Edition is sold out.");
        require(amountPaid != 0);
        require(amountPaid >= editions[editionId].price);
        string memory releaseId = editions[editionId].releaseId;
        transferEditionPayment(artist, releaseId, userId, amountPaid, editionId);
        _safeTransferFrom(address(this), msg.sender, editionId, 1, "");
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
        uint256 tokenId = editionIdTracker.current();
        _mint(address(this), tokenId, amount, "");
        // setEditionArtist(tokenId, msg.sender);
        // setEditionPrice(tokenId, price);
        // setEditionRelease(tokenId, releaseId);
        setEditionUri(tokenId, metadataUri);
            emit EditionMinted(address  msg.sender, uint256  tokenId, uint256 amount, uint256 price, string indexed releaseId);
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
        editionsByReleaseId[releaseId].push(editionId);
        editions[editionId].releaseId = releaseId;
    }

    function setEditionUri(uint256 editionId, string memory metadataUri) private {
        editions[editionId].uri = metadataUri;
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

    function getEdition(uint256 id) public view returns (GridFireEdition memory) {
        return editions[id];
    }

    function getEditionsByReleaseId(string calldata releaseId)
        public
        view
        returns (
            uint256[] memory,
            GridFireEdition[] memory,
            uint256[] memory
        )
    {
        uint256[] memory editionIds = editionsByReleaseId[releaseId];
        address[] memory accounts = new address[](editionIds.length);
        for (uint256 i = 0; i < accounts.length; i++) accounts[i] = address(this);
        uint256[] memory editionBalances = balanceOfBatch(accounts, editionIds);
        GridFireEdition[] memory releaseEditions = new GridFireEdition[](editionIds.length);

        for (uint256 i = 0; i < editionIds.length; i++) {
            uint256 id = editionIds[i];
            releaseEditions[i] = editions[id];
        }

        return (editionIds, releaseEditions, editionBalances);
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
        address artist,
        string memory releaseId,
        string calldata userId,
        uint256 amountPaid,
        uint256 editionId
    ) private {
        dai.safeTransferFrom(msg.sender, address(this), amountPaid);
        (uint256 artistShare, uint256 platformShare) = creditBalances(artist, amountPaid);
        emit PurchaseEdition(msg.sender, artist, releaseId, userId, amountPaid, artistShare, platformShare, editionId);
    }
}
