// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25;

import {FHE, euint128, ebool, eaddress} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {InEuint128, InEaddress} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";

/**
 * @title BlindPayEscrow
 * @notice Fhenix CoFHE Encrypted Escrow & Payment System
 * @dev Final Buildathon Version: Optimized for Privacy-by-Design and Scalable Infrastructure.
 */
contract BlindPayEscrow {
    address public immutable AUTHORIZED_BACKEND;
    address public immutable COFHE_ORACLE;

    enum RequestStatus { ACTIVE, SUBMITTED, RESOLVED, CANCELLED }

    struct Request {
        eaddress merchantEnc;
        euint128 requiredAmount;    // Secret price
        euint128 submittedAmount;   // Secret paid amount
        uint256 expiryTimestamp;
        RequestStatus status;
        bool isPaid;                // Result of FHE.gte
        uint256 createdAt;
        address creator;
    }

    mapping(bytes32 => Request) public requests;
    uint256 private _requestNonce;

    event RequestCreated(bytes32 indexed requestId, uint256 expiry);
    event PaymentSubmitted(bytes32 indexed requestId);
    event PaymentResolved(bytes32 indexed requestId, bool isPaid);
    event RequestCancelled(bytes32 indexed requestId);

    error NotAuthorized();
    error RequestNotFound();
    error AlreadyResolved();
    error InvalidInput();
    error RequestExpired();

    modifier onlyBackend() {
        if (msg.sender != AUTHORIZED_BACKEND) revert NotAuthorized();
        _;
    }

    modifier onlyCreator(bytes32 requestId) {
        if (msg.sender != requests[requestId].creator) revert NotAuthorized();
        _;
    }

    constructor(address _authorizedBackend, address _cofheOracle) {
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
        req.status = RequestStatus.ACTIVE;
        req.isPaid = false;
        req.createdAt = block.timestamp;
        req.creator = msg.sender;

        emit RequestCreated(requestId, expiry);
        return requestId;
    }

    /**
     * @notice Backend submits the actual amount paid by the user.
     */
    function submitPayment(bytes32 requestId, InEuint128 calldata inPaidAmount) external onlyBackend {
        Request storage req = requests[requestId];
        if (req.createdAt == 0) revert RequestNotFound();
        if (req.status != RequestStatus.ACTIVE) revert AlreadyResolved();
        if (block.timestamp > req.expiryTimestamp) revert RequestExpired();

        euint128 paidAmount = FHE.asEuint128(inPaidAmount);
        req.submittedAmount = paidAmount;
        req.status = RequestStatus.SUBMITTED;

        // Trigger FHE.gte on Fhenix Coprocessor
        ebool isSufficient = FHE.gte(req.submittedAmount, req.requiredAmount);
        FHE.decrypt(isSufficient);

        emit PaymentSubmitted(requestId);
    }

    /**
     * @notice Checks the decrypted status of the payment
     */
    function resolvePayment(bytes32 requestId) external {
        Request storage req = requests[requestId];
        if (req.status != RequestStatus.SUBMITTED) revert InvalidInput();

        ebool isSufficient = FHE.gte(req.submittedAmount, req.requiredAmount);
        (bool decryptedResult, bool isReady) = FHE.getDecryptResultSafe(isSufficient);

        if (isReady) {
            req.status = RequestStatus.RESOLVED;
            req.isPaid = decryptedResult;
            emit PaymentResolved(requestId, decryptedResult);
        }
    }

    /**
     * @notice Allows merchant to cancel a request if it hasn't been submitted yet.
     */
    function cancelRequest(bytes32 requestId) external onlyCreator(requestId) {
        Request storage req = requests[requestId];
        if (req.status != RequestStatus.ACTIVE) revert AlreadyResolved();
        req.status = RequestStatus.CANCELLED;
        emit RequestCancelled(requestId);
    }

    function getRequestStatus(bytes32 requestId)
        external
        view
        returns (
            uint256 expiry,
            RequestStatus status,
            bool isPaid
        )
    {
        Request storage req = requests[requestId];
        if (req.createdAt == 0) revert RequestNotFound();
        return (req.expiryTimestamp, req.status, req.isPaid);
    }
}
