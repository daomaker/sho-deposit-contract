//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/// @title Strong Holder Offering (SHO) contract used to collect funds from SHO lottery winners.
/// @author DAO Maker
/// @notice The flow is the following:
/// 1. SHO Organizer runs the lottery off-chain.
/// 2. Once the winners are selected, for every winner, the SHO Organzier signs a message cointaining the SHO information.
///    The signing, as well as the signature storage, is done off-chain.
/// 3. Winners call this contract passing in the signature and the relevant SHO data. By doing this they confirm their
///    particiaption in the SHO (i.e. claim their winning spot) and transfer the funds required to participate.
/// 4. The SHO contract verifies the signature, to make sure it comes from the SHO Organizer, and verifies the signed SHO data.
///    If all is correct, the funds are transferred from the winner to the fund receiver.
/// @dev The contract is owned by an admin (intended to be a multisig wallet) who can change critical state variables.
/// SHO Organizer is a off-chain role.
contract SHO is Ownable, Pausable {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    address public shoOrganizer;
    address public depositReceiver;

    mapping(string => mapping(address => bool)) public depositsForSho;

    event ShoOrganizerChanged(
        address oldShoOrganizer,
        address newShoOrganizer
    );

    event DepositReceiverChanged(
        address oldDepositReceiver,
        address newDepositReceiver
    );

    event Deposited(
        address indexed winner,
        string indexed indexedShoId,
        string shoId,
        IERC20 depositToken,
        uint amount,
        uint deadline,
        address indexed depositReceiver,
        address shoOrganizer,
        uint option
    );

    event RecoveredERC20(
        uint amount,
        IERC20 token
    );

    constructor(address _shoOrganizer, address _depositReceiver) {
        shoOrganizer = _shoOrganizer;
        depositReceiver = _depositReceiver;

        emit ShoOrganizerChanged(address(0), _shoOrganizer);
        emit DepositReceiverChanged(address(0), _depositReceiver);
    }

    function setShoOrganizer(address _shoOrganizer) external onlyOwner {
        emit ShoOrganizerChanged(shoOrganizer, _shoOrganizer);
        shoOrganizer = _shoOrganizer;
    }
    function setDepositReceiver(address _depositReceiver) external onlyOwner {
        emit DepositReceiverChanged(depositReceiver, _depositReceiver);
        depositReceiver = _depositReceiver;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Verifies that the passed SHO data is signed correctly and that the signature comes from the SHO Organizer.
    /// If all checks out, the caller is marked in contract storage and funds are transferred from the caller to the predefined
    /// fund receiver.
    /// @dev Callable by any account. Security is based on the passed signature. Pausable by the owner.
    /// @param signature Signature from the SHO Organizer. The message signed contains the winner address and the other parameters
    ///        passed in the call.
    /// @param shoId An opaque SHO identifier.
    /// @param depositToken Address of an ERC20-compatible token used for deposits in this SHO. The winner must first set the token
    ///        allowance of this contract for the `amount` or more.
    /// @param amount Amount of tokens the winner is allowed to send. The unit is the base unit of the `depositToken`
    ///        (i.e. the smallest subdenomination of the token).
    /// @param deadline Time until the winners have to call this function (in Unix time).
    function deposit(
        bytes calldata signature,
        string calldata shoId,
        IERC20 depositToken,
        uint amount,
        uint deadline,
        uint option
    ) external whenNotPaused {
        address winner = msg.sender;

        require(!depositsForSho[shoId][winner], "SHO: this wallet already made a deposit for this SHO");
        require(block.timestamp <= deadline, "SHO: the deadline for this SHO has passed");

        bytes32 dataHash = keccak256(abi.encodePacked(winner, shoId, depositToken, amount, deadline, depositReceiver));
        require(dataHash.toEthSignedMessageHash().recover(signature) == shoOrganizer, "SHO: signature verification failed");

        depositsForSho[shoId][winner] = true;
        depositToken.safeTransferFrom(winner, depositReceiver, amount);

        emit Deposited(winner, shoId, shoId, depositToken, amount, deadline, depositReceiver, shoOrganizer, option);
    }

    /// @notice Recovers any tokens unintentionally sent to this contract. This contract is not meant to hold any funds.
    /// @dev The admin can call this to recover any tokens sent mistakenly to this contract by users.
    /// @param token ERC20 token address to be recovered.
    function recoverERC20(IERC20 token) external onlyOwner {
        uint balance = token.balanceOf(address(this));
        token.safeTransfer(msg.sender, balance);

        emit RecoveredERC20(balance, token);
    }
}
