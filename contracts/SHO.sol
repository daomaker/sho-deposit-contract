//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract SHO is Ownable {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    address public shoOrganizer;
    address public depositReceiver;
    IERC20 public depositToken;

    mapping(string => mapping(address => bool)) public depositsForSho;

    event ShoOrganizerChanged(
        address oldShoOrganizer,
        address newShoOrganizer
    );

    event DepositReceiverChanged(
        address oldDepositReceiver,
        address newDepositReceiver
    );

    event DepositTokenChanged(
        IERC20 oldDepositToken,
        IERC20 newDepositToken
    );
    
    event Deposited(
        address winner,
        string indexed shoId,
        uint amount,
        uint deadline,
        address depositReceiver,
        address shoOrganizer
    );

    constructor(address _shoOrganizer, address _depositReceiver, IERC20 _depositToken) {
        shoOrganizer = _shoOrganizer;
        depositReceiver = _depositReceiver;
        depositToken = _depositToken;

        emit ShoOrganizerChanged(address(0), _shoOrganizer);
        emit DepositReceiverChanged(address(0), _depositReceiver);
        emit DepositTokenChanged(IERC20(address(0)), _depositToken);
    }

    function setShoOrganizer(address _shoOrganizer) external onlyOwner {
        shoOrganizer = _shoOrganizer;

        emit ShoOrganizerChanged(shoOrganizer, _shoOrganizer);
    }
    function setDepositReceiver(address _depositReceiver) external onlyOwner {
        depositReceiver = _depositReceiver;

        emit DepositReceiverChanged(depositReceiver, _depositReceiver);
    }

    function setDepositToken(IERC20 _depositToken) external onlyOwner {
        depositToken = _depositToken;

        emit DepositTokenChanged(depositToken, _depositToken);
    }

    function deposit(
        bytes calldata signature, 
        string calldata shoId, 
        uint amount, 
        uint deadline, 
        address _depositReceiver
    ) external {
        address winner = msg.sender;

        require(_depositReceiver == depositReceiver, "SHO: invalid deposit receiver");
        require(!depositsForSho[shoId][winner], "SHO: this wallet already made a deposit for this SHO");
        require(block.timestamp <= deadline, "SHO: the deadline for this SHO has passed");

        bytes32 dataHash = keccak256(abi.encodePacked(winner, shoId, amount, deadline, _depositReceiver));
        require(dataHash.toEthSignedMessageHash().recover(signature) == shoOrganizer, "SHO: signature verification failed");

        depositsForSho[shoId][winner] = true;
        depositToken.safeTransferFrom(winner, _depositReceiver, amount);

        emit Deposited(winner, shoId, amount, deadline, _depositReceiver, shoOrganizer);
    }
}
