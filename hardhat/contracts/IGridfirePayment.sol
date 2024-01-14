// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.20;

interface IGridfirePayment {
    struct BasketItem {
        address artist;
        uint256 amountPaid;
        bytes32 releaseId;
    }

    event Checkout(address indexed buyer, uint256 amount);
    event Claim(address indexed artist, uint256 amount);

    event Purchase(
        address indexed buyer,
        address indexed artist,
        bytes32 releaseId,
        bytes32 userId,
        uint256 amountPaid,
        uint256 artistShare,
        uint256 platformFee
    );

    event Received(address from, uint256 amount);

    receive() external payable;

    function checkout(BasketItem[] calldata basket, bytes32 userId) external;

    function claim() external;

    function getBalance(address artist) external view returns (uint256);

    function getGridfireEditionsAddress() external view returns (address);

    function getServiceFee() external view returns (uint256);

    function purchase(address artist, uint256 amountPaid, bytes32 releaseId, bytes32 userId) external;

    function setGridfireEditionsAddress(address payable contractAddress) external;

    function setServiceFee(uint256 newServiceFee) external;

    function transferEditionPayment(
        address buyer,
        address artist,
        uint256 amountPaid
    ) external returns (uint256, uint256);

    function transferPayment(address artist, uint256 amountPaid, bytes32 releaseId, bytes32 userId) external;

    function withdraw() external;
}
