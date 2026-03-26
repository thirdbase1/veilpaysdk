// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25;

import {FHE, euint128, ebool, eaddress} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {InEuint128, InEaddress} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

/**
 * @title VeilPayEscrow
 * @notice Fhenix CoFHE Encrypted Private Invoice & Payment System
 * @dev Demonstrates MEANINGFUL Encrypted Computation (Asynchronous FHE.gte) on Sepolia
 */
contract VeilPayEscrow {
    address public immutable AUTHORIZED_BACKEND;
    address public immutable COFHE_ORACLE;
    address public constant SEPOLIA_USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

    struct Request {
        eaddress merchantEnc;
        euint128 requiredAmount;    // The secret price
        euint128 submittedAmount;   // The secret amount the user actually paid
        uint256 expiryTimestamp;
        bool isResolved;            // Has CoFHE processed it?
        bool isPaid;                // Did CoFHE say submitted >= required?
        uint256 createdAt;
    }

    mapping(bytes32 => Request) public requests;
    mapping(uint256 => bytes32) private _callbackToRequest;

    uint256 private _requestNonce;

    event RequestCreated(bytes32 indexed requestId);
    event PaymentSubmitted(bytes32 indexed requestId);
    event PaymentResolved(bytes32 indexed requestId, bool isPaid);

    error NotAuthorized();
    error RequestNotFound();
    error AlreadyResolved();
    error InvalidInput();
    error InvalidBackendAddress();

    modifier onlyBackend() {
        if (msg.sender != AUTHORIZED_BACKEND) revert NotAuthorized();
        _;
    }

    modifier onlyOracle() {
        if (msg.sender != COFHE_ORACLE) revert NotAuthorized();
        _;
    }

    /**
     * @param _authorizedBackend The address of the backend service tracking USDC payments
     * @param _cofheOracle The address of the Fhenix CoFHE Oracle on Sepolia
     */
    constructor(address _authorizedBackend, address _cofheOracle) {
        if (_authorizedBackend == address(0)) revert InvalidBackendAddress();
        AUTHORIZED_BACKEND = _authorizedBackend;
        COFHE_ORACLE = _cofheOracle;
    }

    /**
     * @notice Merchant creates an encrypted payment request
     */
    function createRequest(
        InEuint128 calldata inAmount,
        InEaddress calldata inMerchant,
        uint256 expiry
    ) external returns (bytes32 requestId) {
        if (expiry <= block.timestamp) revert InvalidInput();

        euint128 amount = FHE.asEuint128(inAmount);
        eaddress merchantEnc = FHE.asEaddress(inMerchant);

        requestId = keccak256(abi.encodePacked(msg.sender, block.timestamp, _requestNonce++));

        Request storage req = requests[requestId];
        req.merchantEnc = merchantEnc;
        req.requiredAmount = amount;
        req.submittedAmount = FHE.asEuint128(0);
        req.expiryTimestamp = expiry;
        req.isResolved = false;
        req.isPaid = false;
        req.createdAt = block.timestamp;

        emit RequestCreated(requestId);
        return requestId;
    }

    /**
     * @notice Backend submits the actual amount paid by the user.
     * @dev This triggers the MEANINGFUL FHE computation on the Coprocessor.
     */
    function submitPayment(bytes32 requestId, InEuint128 calldata inPaidAmount) external onlyBackend {
        Request storage req = requests[requestId];
        if (req.createdAt == 0) revert RequestNotFound();
        if (req.isResolved) revert AlreadyResolved();

        euint128 paidAmount = FHE.asEuint128(inPaidAmount);
        req.submittedAmount = paidAmount;

        // ------------------------------------------------------------------
        // MEANINGFUL COMPUTATION: Is the paid amount >= the required amount?
        // ------------------------------------------------------------------
        ebool isSufficient = FHE.gte(req.submittedAmount, req.requiredAmount);

        // CoFHE Decryption Request
        // The network monitors the events emitted by decrypt and provides the answer
        FHE.decrypt(isSufficient);

        emit PaymentSubmitted(requestId);
    }

    /**
     * @notice Checks the decrypted status of the payment resolving the FHE computation
     */
    function resolvePayment(bytes32 requestId) external {
        Request storage req = requests[requestId];
        if (req.createdAt == 0) revert RequestNotFound();
        if (req.isResolved) revert AlreadyResolved();

        ebool isSufficient = FHE.gte(req.submittedAmount, req.requiredAmount);

        // getDecryptResultSafe is the official method in FHE.sol (as verified via grep)
        // to safely read the async decryption result without reverting if it's not ready.
        (bool decryptedResult, bool isReady) = FHE.getDecryptResultSafe(isSufficient);

        if (isReady) {
            req.isResolved = true;
            req.isPaid = decryptedResult;
            emit PaymentResolved(requestId, decryptedResult);
        }
    }

    /**
     * @notice Public view function to check the status of a request safely
     */
    function getRequestStatus(bytes32 requestId)
        external
        view
        returns (
            uint256 expiryTimestamp,
            bool isResolved,
            bool isPaid
        )
    {
        Request storage req = requests[requestId];
        if (req.createdAt == 0) revert RequestNotFound();

        return (req.expiryTimestamp, req.isResolved, req.isPaid);
    }
}