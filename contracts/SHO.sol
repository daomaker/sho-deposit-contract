//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SHO is Ownable {
    using ECDSA for bytes32;

    IERC20 public depositToken;
    address public depositReceiver;
    address public organizer;

    mapping(uint => mapping(address => bool)) public deposits;

    event Deposited(
        address winner,
        uint indexed shoId,
        uint amount,
        uint deadline,
        address depositReceiver,
        address organizer
    );
    
    event DepositTokenChanged(
        IERC20 oldDepositToken,
        IERC20 newDepositToken
    );
    
    event DepositReceiverChanged(
        address oldDepositReceiver,
        address newDepositReceiver
    );

    event OrganierChanged(
        address oldOrganier,
        address newOrganizer
    );

    constructor(IERC20 _depositToken, address _depositReceiver, address _organizer) {
        depositToken = _depositToken;
        depositReceiver = _depositReceiver;
        organizer = _organizer;
    }

    function setDepositToken(IERC20 _depositToken) external onlyOwner {
        emit DepositTokenChanged(depositToken, _depositToken);
        depositToken = _depositToken;
    }

    function setDepositReceiver(address _depositReceiver) external onlyOwner {
        emit DepositReceiverChanged(depositReceiver, _depositReceiver);
        depositReceiver = _depositReceiver;
    }

    function setOrganizer(address _organizer) external onlyOwner {
        emit OrganierChanged(organizer, _organizer);
        organizer = _organizer;
    }

    function deposit(
        bytes calldata signature, 
        uint shoId, 
        uint amount, 
        uint deadline, 
        address _depositReceiver
    ) external {
        address winner = msg.sender;
        require(_depositReceiver == depositReceiver, "SHO: wrong deposit receiver");
        require(!deposits[shoId][winner], "SHO: deposited");
        require(block.timestamp <= deadline, "SHO: deadline");

        bytes32 dataHash = keccak256(abi.encodePacked(winner, shoId, amount, deadline, _depositReceiver));
        require(dataHash.toEthSignedMessageHash().recover(signature) == organizer, "SHO: signature verification failed");

        deposits[shoId][winner] = true;
        depositToken.transferFrom(winner, _depositReceiver, amount);

        emit Deposited(winner, shoId, amount, deadline, _depositReceiver, organizer);
    }
}
