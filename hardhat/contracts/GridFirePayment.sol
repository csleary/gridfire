// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GridFirePayment is Ownable {
    uint256 private feePercent = 5;
    mapping(address => uint256) balances;

    IERC20 dai = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);

    event Claim(address indexed artist, uint256 amount);
    event Purchase(address indexed buyer, address indexed artist, uint256 amount, uint256 fee);
    event Received(address from, uint256 amount);

    function transferPayment(address _artist, uint256 _paid) private {
        uint256 _artistShare = _paid;
        uint256 _serviceFee = 0;
        require(_artistShare != 0);

        if (feePercent == 0) {
            balances[_artist] += _artistShare;
        } else {
            _serviceFee = (_artistShare * feePercent) / 100;
            balances[owner()] += _serviceFee;
            _artistShare -= _serviceFee;
            balances[_artist] += _artistShare;
        }

        dai.transferFrom(msg.sender, address(this), _paid);
        emit Purchase(msg.sender, _artist, _artistShare, _serviceFee);
    }

    function purchase(
        address _artist,
        uint256 _paid,
        uint256 _releasePrice
    ) public {
        require(_paid != 0);
        require(_paid >= _releasePrice);
        transferPayment(_artist, _paid);
    }

    function getBalance(address _address) public view returns (uint256) {
        return balances[_address];
    }

    function claim() public {
        uint256 _amount = balances[msg.sender];
        require(_amount != 0, "Nothing to claim.");
        balances[msg.sender] = 0;
        dai.transferFrom(address(this), msg.sender, _amount);
        emit Claim(msg.sender, _amount);
    }

    function getServiceFee() public view returns (uint256) {
        return feePercent;
    }

    function setServiceFee(uint256 _newFee) public onlyOwner {
        require(_newFee < 100);
        feePercent = _newFee;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }
}
