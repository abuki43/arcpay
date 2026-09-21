// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArcPaymentGateway
 * @author ArcPay Protocol
 * @notice High-performance, developer-first payment gateway purpose-built for the Arc Network.
 * @dev Arc utilizes native USDC for gas and transaction value with sub-second finality (~600ms).
 *      All payments are settled in pure native USDC via `msg.value` without requiring ERC-20 approvals.
 *      Protocol fee is fixed at 0.40% (40 bps) by default and hard-capped at 1.00% (100 bps).
 */
contract ArcPaymentGateway {
    // -------------------------------------------------------------------------
    // Constants & Immurables
    // -------------------------------------------------------------------------

    /// @notice Maximum allowable protocol fee: 1.00% (100 basis points)
    uint256 public constant MAX_FEE_BPS = 100;

    /// @notice Basis points divisor (100.00% = 10,000 bps)
    uint256 public constant BPS_DIVISOR = 10_000;

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    /// @notice Contract owner / admin address
    address public owner;

    /// @notice Address receiving protocol fees
    address payable public feeRecipient;

    /// @notice Protocol fee in basis points (40 bps = 0.40%)
    uint256 public feeBps;

    /// @notice Reentrancy lock state
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    /// @notice Global metrics
    uint256 public totalVolume;
    uint256 public totalProtocolFees;
    uint256 public totalTransactions;

    /// @notice Merchant metrics
    mapping(address => uint256) public merchantVolume;
    mapping(address => uint256) public merchantTransactionCount;

    /// @notice Structured payment record
    struct PaymentRecord {
        bytes32 orderId;       // Unique 32-byte order identifier
        address merchant;      // Merchant recipient wallet
        address payer;         // Customer wallet address
        address token;         // address(0) representing native USDC gas token
        uint256 amount;        // Gross USDC amount (18 decimals)
        uint256 protocolFee;   // Protocol fee deducted (18 decimals)
        uint256 timestamp;     // Block timestamp of settlement
        bool isSettled;        // Settlement status flag
        string metadata;       // Order metadata string (JSON, SKU, client reference)
    }

    /// @notice Payment records mapping indexed by orderId
    mapping(bytes32 => PaymentRecord) public payments;

    // -------------------------------------------------------------------------
    // Custom Errors
    // -------------------------------------------------------------------------

    error Unauthorized();
    error InvalidAmount();
    error InvalidMerchant();
    error InvalidAffiliate();
    error InvalidRecipient();
    error InvalidFeeBps(uint256 requestedBps, uint256 maxBps);
    error PaymentAlreadySettled(bytes32 orderId);
    error InvalidSplitAmounts(uint256 merchantAmount, uint256 affiliateAmount, uint256 netAmount);
    error TransferFailed(address recipient, uint256 amount);
    error ReentrancyGuardReentrantCall();

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event PaymentSettled(
        bytes32 indexed orderId,
        address indexed merchant,
        address indexed payer,
        uint256 amount,
        uint256 protocolFee,
        string metadata,
        uint256 timestamp
    );

    event PaymentSplitSettled(
        bytes32 indexed orderId,
        address indexed merchant,
        address indexed affiliate,
        address payer,
        uint256 merchantAmount,
        uint256 affiliateAmount,
        uint256 protocolFee,
        string metadata,
        uint256 timestamp
    );

    event FeeConfigUpdated(
        uint256 oldFeeBps,
        uint256 newFeeBps,
        address oldFeeRecipient,
        address newFeeRecipient
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrancyGuardReentrantCall();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @notice Initializes the ArcPaymentGateway contract
     * @param _feeRecipient Address that will receive 0.40% protocol fees
     * @param _feeBps Protocol fee in basis points (e.g. 40 = 0.40%)
     */
    constructor(address payable _feeRecipient, uint256 _feeBps) {
        if (_feeRecipient == address(0)) revert InvalidRecipient();
        if (_feeBps > MAX_FEE_BPS) revert InvalidFeeBps(_feeBps, MAX_FEE_BPS);

        owner = msg.sender;
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
        _status = _NOT_ENTERED;

        emit OwnershipTransferred(address(0), msg.sender);
        emit FeeConfigUpdated(0, _feeBps, address(0), _feeRecipient);
    }

    // -------------------------------------------------------------------------
    // Primary Settlement Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Settles a 1-click payment directly to a merchant in native USDC
     * @param orderId Unique 32-byte cryptographic identifier for this checkout order
     * @param merchant Recipient merchant address
     * @param metadata Arbitrary order metadata (JSON, SKU identifier, or order ref)
     */
    function payNative(
        bytes32 orderId,
        address payable merchant,
        string calldata metadata
    ) external payable nonReentrant {
        if (msg.value == 0) revert InvalidAmount();
        if (merchant == address(0)) revert InvalidMerchant();
        if (payments[orderId].isSettled) revert PaymentAlreadySettled(orderId);

        // Compute 0.4% protocol fee and net merchant settlement
        uint256 protocolFee = (msg.value * feeBps) / BPS_DIVISOR;
        uint256 merchantAmount = msg.value - protocolFee;

        // Persist settlement record
        payments[orderId] = PaymentRecord({
            orderId: orderId,
            merchant: merchant,
            payer: msg.sender,
            token: address(0),
            amount: msg.value,
            protocolFee: protocolFee,
            timestamp: block.timestamp,
            isSettled: true,
            metadata: metadata
        });

        // Update metrics
        totalVolume += msg.value;
        totalProtocolFees += protocolFee;
        totalTransactions += 1;
        merchantVolume[merchant] += merchantAmount;
        merchantTransactionCount[merchant] += 1;

        // Emit settlement event for real-time client indexing
        emit PaymentSettled(
            orderId,
            merchant,
            msg.sender,
            msg.value,
            protocolFee,
            metadata,
            block.timestamp
        );

        // Route protocol fee to treasury
        if (protocolFee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: protocolFee}("");
            if (!feeSuccess) revert TransferFailed(feeRecipient, protocolFee);
        }

        // Route net proceeds to merchant
        (bool merchantSuccess, ) = merchant.call{value: merchantAmount}("");
        if (!merchantSuccess) revert TransferFailed(merchant, merchantAmount);
    }

    /**
     * @notice Settles a payment with split distribution (e.g. Creator 80%, Platform 19.6%, ArcPay 0.4%)
     * @param orderId Unique 32-byte order identifier
     * @param merchant Primary merchant / creator address
     * @param merchantAmount Amount routed to merchant
     * @param affiliate Platform / partner / affiliate address
     * @param affiliateAmount Amount routed to affiliate
     * @param metadata Arbitrary order metadata
     */
    function payNativeWithSplit(
        bytes32 orderId,
        address payable merchant,
        uint256 merchantAmount,
        address payable affiliate,
        uint256 affiliateAmount,
        string calldata metadata
    ) external payable nonReentrant {
        if (msg.value == 0) revert InvalidAmount();
        if (merchant == address(0)) revert InvalidMerchant();
        if (affiliate == address(0)) revert InvalidAffiliate();
        if (payments[orderId].isSettled) revert PaymentAlreadySettled(orderId);

        uint256 protocolFee = (msg.value * feeBps) / BPS_DIVISOR;
        uint256 netAvailable = msg.value - protocolFee;

        if (merchantAmount + affiliateAmount != netAvailable) {
            revert InvalidSplitAmounts(merchantAmount, affiliateAmount, netAvailable);
        }

        // Persist settlement record
        payments[orderId] = PaymentRecord({
            orderId: orderId,
            merchant: merchant,
            payer: msg.sender,
            token: address(0),
            amount: msg.value,
            protocolFee: protocolFee,
            timestamp: block.timestamp,
            isSettled: true,
            metadata: metadata
        });

        // Update metrics
        totalVolume += msg.value;
        totalProtocolFees += protocolFee;
        totalTransactions += 1;
        merchantVolume[merchant] += merchantAmount;
        merchantTransactionCount[merchant] += 1;

        // Emit events
        emit PaymentSettled(
            orderId,
            merchant,
            msg.sender,
            msg.value,
            protocolFee,
            metadata,
            block.timestamp
        );

        emit PaymentSplitSettled(
            orderId,
            merchant,
            affiliate,
            msg.sender,
            merchantAmount,
            affiliateAmount,
            protocolFee,
            metadata,
            block.timestamp
        );

        // Route protocol fee
        if (protocolFee > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: protocolFee}("");
            if (!feeSuccess) revert TransferFailed(feeRecipient, protocolFee);
        }

        // Route merchant share
        if (merchantAmount > 0) {
            (bool merchantSuccess, ) = merchant.call{value: merchantAmount}("");
            if (!merchantSuccess) revert TransferFailed(merchant, merchantAmount);
        }

        // Route affiliate share
        if (affiliateAmount > 0) {
            (bool affiliateSuccess, ) = affiliate.call{value: affiliateAmount}("");
            if (!affiliateSuccess) revert TransferFailed(affiliate, affiliateAmount);
        }
    }

    // -------------------------------------------------------------------------
    // View Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Retrieves the complete PaymentRecord for a given orderId
     * @param orderId Unique order identifier
     * @return PaymentRecord struct
     */
    function getPayment(bytes32 orderId) external view returns (PaymentRecord memory) {
        return payments[orderId];
    }

    /**
     * @notice Checks if an orderId has been settled
     * @param orderId Unique order identifier
     * @return bool indicating settlement status
     */
    function isOrderPaid(bytes32 orderId) external view returns (bool) {
        return payments[orderId].isSettled;
    }

    /**
     * @notice Calculates fee breakdown for a prospective gross amount
     * @param grossAmount Gross USDC amount (18 decimals)
     * @return protocolFee Fee allocated to treasury
     * @return netAmount Net amount allocated to merchant
     */
    function calculateFee(uint256 grossAmount)
        external
        view
        returns (uint256 protocolFee, uint256 netAmount)
    {
        protocolFee = (grossAmount * feeBps) / BPS_DIVISOR;
        netAmount = grossAmount - protocolFee;
    }

    // -------------------------------------------------------------------------
    // Admin & Governance Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Updates the protocol fee configuration
     * @param _feeBps New fee in basis points (must be <= MAX_FEE_BPS)
     * @param _feeRecipient New fee recipient address
     */
    function setFeeConfig(uint256 _feeBps, address payable _feeRecipient) external onlyOwner {
        if (_feeRecipient == address(0)) revert InvalidRecipient();
        if (_feeBps > MAX_FEE_BPS) revert InvalidFeeBps(_feeBps, MAX_FEE_BPS);

        uint256 oldBps = feeBps;
        address oldRecipient = feeRecipient;

        feeBps = _feeBps;
        feeRecipient = _feeRecipient;

        emit FeeConfigUpdated(oldBps, _feeBps, oldRecipient, _feeRecipient);
    }

    /**
     * @notice Transfers contract ownership to a new account
     * @param newOwner Address of new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidRecipient();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
