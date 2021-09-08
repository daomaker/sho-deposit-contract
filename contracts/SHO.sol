//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract SHO is Ownable {
    using ECDSA for bytes32;

    IERC20 public depositToken;
    address public depositReceiver;
    address public shoOrganizer;

    mapping(uint => mapping(address => bool)) public depositsForSho;

    event ShoOrganizerChanged(
        address oldOrganier,
        address newOrganizer
    );

    event DepositTokenChanged(
        IERC20 oldDepositToken,
        IERC20 newDepositToken
    );
    
    event DepositReceiverChanged(
        address oldDepositReceiver,
        address newDepositReceiver
    );

    event Deposited(
        address winner,
        uint indexed shoId,
        uint amount,
        uint deadline,
        address depositReceiver,
        address shoOrganizer
    );
    
    constructor( address _shoOrganizer, address _depositReceiver, IERC20 _depositToken) {
        shoOrganizer = _shoOrganizer;
        depositReceiver = _depositReceiver;
        depositToken = _depositToken;

        emit ShoOrganizerChanged(address(0), _shoOrganizer);
        emit DepositReceiverChanged(address(0), _depositReceiver);
        emit DepositTokenChanged(address(0), _depositToken);
    }

    function setShoOrganizer(address _shoOrganizer) external onlyOwner {
        emit ShoOrganizerChanged(shoOrganizer, _shoOrganizer);
        shoOrganizer = _shoOrganizer;
    }

    function setDepositReceiver(address _depositReceiver) external onlyOwner {
        emit DepositReceiverChanged(depositReceiver, _depositReceiver);
        depositReceiver = _depositReceiver;
    }

    function setDepositToken(IERC20 _depositToken) external onlyOwner {
        emit DepositTokenChanged(depositToken, _depositToken);
        depositToken = _depositToken;
    }

    function deposit(
        bytes calldata signature, 
        uint shoId, 
        uint amount, 
        uint deadline, 
        address _depositReceiver
    ) external {
        require(_depositReceiver == depositReceiver, "SHO: invalid deposit receiver");
        require(!depositsForSho[shoId][winner], "SHO: this wallet already made a deposit for this SHO");
        require(block.timestamp <= deadline, "SHO: too late to make a deposit for this SHO");

        bytes32 dataHash = keccak256(abi.encodePacked(winner, shoId, amount, deadline, _depositReceiver));
        address messageSigner = dataHash.toEthSignedMessageHash().recover(signature);
        
        if (messageSigner != shoOrganizer) {
            emit InvalidSigner(messageSigner);
        }

        require(messageSigner == shoOrganizer, "SHO: invalid message signer");

        address winner = msg.sender;
        depositsForSho[shoId][winner] = true;
        depositToken.transferFrom(winner, _depositReceiver, amount);

        emit Deposited(winner, shoId, amount, deadline, _depositReceiver, shoOrganizer);
    }

}
