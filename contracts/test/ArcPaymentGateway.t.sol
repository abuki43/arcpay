// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ArcPaymentGateway} from "../src/ArcPaymentGateway.sol";

contract MaliciousReceiver {
    ArcPaymentGateway public gateway;
    bool public attemptReenter;

    constructor(address _gateway) {
        gateway = ArcPaymentGateway(_gateway);
    }

    function setAttemptReenter(bool _attempt) external {
        attemptReenter = _attempt;
    }

    receive() external payable {
        if (attemptReenter) {
            bytes32 newOrderId = keccak256("reentrant_order");
            gateway.payNative{value: 1 ether}(newOrderId, payable(address(this)), "reentrancy");
        }
    }
}

contract RejectingReceiver {
    receive() external payable {
        revert("Rejecting ETH/USDC");
    }
}

contract ArcPaymentGatewayTest is Test {
    ArcPaymentGateway public gateway;

    address payable public owner = payable(makeAddr("owner"));
    address payable public treasury = payable(makeAddr("treasury"));
    address payable public merchant = payable(makeAddr("merchant"));
    address payable public affiliate = payable(makeAddr("affiliate"));
    address payable public customer = payable(makeAddr("customer"));
    address payable public alice = payable(makeAddr("alice"));

    uint256 public constant DEFAULT_FEE_BPS = 40; // 0.40%

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

    function setUp() public {
        vm.startPrank(owner);
        gateway = new ArcPaymentGateway(treasury, DEFAULT_FEE_BPS);
        vm.stopPrank();

        vm.deal(customer, 1000 ether);
        vm.deal(alice, 1000 ether);
    }

    // -------------------------------------------------------------------------
    // Initial State & Constructor
    // -------------------------------------------------------------------------

    function test_InitialState() public view {
        assertEq(gateway.owner(), owner);
        assertEq(gateway.feeRecipient(), treasury);
        assertEq(gateway.feeBps(), 40);
        assertEq(gateway.MAX_FEE_BPS(), 100);
        assertEq(gateway.BPS_DIVISOR(), 10_000);
        assertEq(gateway.totalVolume(), 0);
        assertEq(gateway.totalProtocolFees(), 0);
        assertEq(gateway.totalTransactions(), 0);
    }

    function test_Constructor_RevertIf_ZeroFeeRecipient() public {
        vm.expectRevert(ArcPaymentGateway.InvalidRecipient.selector);
        new ArcPaymentGateway(payable(address(0)), 40);
    }

    function test_Constructor_RevertIf_FeeBpsExceedsMax() public {
        vm.expectRevert(abi.encodeWithSelector(ArcPaymentGateway.InvalidFeeBps.selector, 101, 100));
        new ArcPaymentGateway(treasury, 101);
    }

    // -------------------------------------------------------------------------
    // payNative Tests
    // -------------------------------------------------------------------------

    function test_PayNative_Success() public {
        bytes32 orderId = keccak256("order_saas_001");
        uint256 grossAmount = 100 ether; // 100 USDC in 18 decimals
        string memory metadata = '{"sku":"cloud_ai_pro","plan":"monthly"}';

        uint256 expectedFee = (grossAmount * 40) / 10_000; // 0.40 ether
        uint256 expectedMerchantAmount = grossAmount - expectedFee; // 99.60 ether

        uint256 initTreasuryBal = treasury.balance;
        uint256 initMerchantBal = merchant.balance;
        uint256 initCustomerBal = customer.balance;

        vm.prank(customer);
        vm.expectEmit(true, true, true, true);
        emit PaymentSettled(orderId, merchant, customer, grossAmount, expectedFee, metadata, block.timestamp);
        gateway.payNative{value: grossAmount}(orderId, merchant, metadata);

        // Verify balances
        assertEq(treasury.balance, initTreasuryBal + expectedFee);
        assertEq(merchant.balance, initMerchantBal + expectedMerchantAmount);
        assertEq(customer.balance, initCustomerBal - grossAmount);

        // Verify state mappings
        assertEq(gateway.totalVolume(), grossAmount);
        assertEq(gateway.totalProtocolFees(), expectedFee);
        assertEq(gateway.totalTransactions(), 1);
        assertEq(gateway.merchantVolume(merchant), expectedMerchantAmount);
        assertEq(gateway.merchantTransactionCount(merchant), 1);
        assertTrue(gateway.isOrderPaid(orderId));

        // Verify PaymentRecord
        ArcPaymentGateway.PaymentRecord memory record = gateway.getPayment(orderId);
        assertEq(record.orderId, orderId);
        assertEq(record.merchant, merchant);
        assertEq(record.payer, customer);
        assertEq(record.token, address(0));
        assertEq(record.amount, grossAmount);
        assertEq(record.protocolFee, expectedFee);
        assertEq(record.timestamp, block.timestamp);
        assertTrue(record.isSettled);
        assertEq(record.metadata, metadata);
    }

    function test_PayNative_RevertIf_ZeroAmount() public {
        bytes32 orderId = keccak256("zero_amount_order");
        vm.prank(customer);
        vm.expectRevert(ArcPaymentGateway.InvalidAmount.selector);
        gateway.payNative{value: 0}(orderId, merchant, "meta");
    }

    function test_PayNative_RevertIf_ZeroMerchant() public {
        bytes32 orderId = keccak256("zero_merchant_order");
        vm.prank(customer);
        vm.expectRevert(ArcPaymentGateway.InvalidMerchant.selector);
        gateway.payNative{value: 10 ether}(orderId, payable(address(0)), "meta");
    }

    function test_PayNative_ReplayAttack_Reverts() public {
        bytes32 orderId = keccak256("replay_order");
        uint256 amount = 50 ether;

        vm.prank(customer);
        gateway.payNative{value: amount}(orderId, merchant, "first_attempt");

        // Attempt second payment with same orderId
        vm.prank(customer);
        vm.expectRevert(abi.encodeWithSelector(ArcPaymentGateway.PaymentAlreadySettled.selector, orderId));
        gateway.payNative{value: amount}(orderId, merchant, "second_attempt");
    }

    function test_PayNative_RevertIf_MerchantTransferFails() public {
        RejectingReceiver rejecter = new RejectingReceiver();
        bytes32 orderId = keccak256("reject_order");

        vm.prank(customer);
        vm.expectRevert(abi.encodeWithSelector(ArcPaymentGateway.TransferFailed.selector, address(rejecter), 99.6 ether));
        gateway.payNative{value: 100 ether}(orderId, payable(address(rejecter)), "meta");
    }

    function test_PayNative_RevertIf_FeeRecipientTransferFails() public {
        RejectingReceiver badFeeRecipient = new RejectingReceiver();
        ArcPaymentGateway badGateway = new ArcPaymentGateway(payable(address(badFeeRecipient)), 40);
        bytes32 orderId = keccak256("bad_fee_recipient_order");

        vm.deal(customer, 100 ether);
        vm.prank(customer);
        vm.expectRevert(abi.encodeWithSelector(ArcPaymentGateway.TransferFailed.selector, address(badFeeRecipient), 0.40 ether));
        badGateway.payNative{value: 100 ether}(orderId, merchant, "meta");
    }

    // -------------------------------------------------------------------------
    // payNativeWithSplit Tests
    // -------------------------------------------------------------------------

    function test_PayNativeWithSplit_Success() public {
        bytes32 orderId = keccak256("split_order_001");
        uint256 grossAmount = 100 ether;
        string memory metadata = '{"courseId":"solidity_mastery"}';

        // 0.40% fee = 0.40 ether
        // Net available = 99.60 ether
        // Creator = 80.00 ether, Affiliate = 19.60 ether
        uint256 expectedFee = 0.40 ether;
        uint256 creatorAmount = 80 ether;
        uint256 affiliateAmount = 19.60 ether;

        uint256 initTreasuryBal = treasury.balance;
        uint256 initMerchantBal = merchant.balance;
        uint256 initAffiliateBal = affiliate.balance;

        vm.prank(customer);
        vm.expectEmit(true, true, true, true);
        emit PaymentSplitSettled(
            orderId,
            merchant,
            affiliate,
            customer,
            creatorAmount,
            affiliateAmount,
            expectedFee,
            metadata,
            block.timestamp
        );
        gateway.payNativeWithSplit{value: grossAmount}(
            orderId,
            merchant,
            creatorAmount,
            affiliate,
            affiliateAmount,
            metadata
        );

        assertEq(treasury.balance, initTreasuryBal + expectedFee);
        assertEq(merchant.balance, initMerchantBal + creatorAmount);
        assertEq(affiliate.balance, initAffiliateBal + affiliateAmount);

        assertTrue(gateway.isOrderPaid(orderId));
        assertEq(gateway.merchantVolume(merchant), creatorAmount);
    }

    function test_PayNativeWithSplit_ZeroMerchantOrZeroAffiliate_Success() public {
        // Case A: 100% affiliate commission (merchant = 0, affiliate = 99.60 ether)
        bytes32 orderA = keccak256("split_zero_merchant");
        uint256 gross = 100 ether;
        uint256 net = 99.60 ether;

        uint256 initAffiliateBal = affiliate.balance;
        vm.prank(customer);
        gateway.payNativeWithSplit{value: gross}(orderA, merchant, 0, affiliate, net, "zero_merchant");
        assertEq(affiliate.balance, initAffiliateBal + net);
        assertTrue(gateway.isOrderPaid(orderA));

        // Case B: 100% merchant (merchant = 99.60 ether, affiliate = 0)
        bytes32 orderB = keccak256("split_zero_affiliate");
        uint256 initMerchantBal = merchant.balance;
        vm.prank(customer);
        gateway.payNativeWithSplit{value: gross}(orderB, merchant, net, affiliate, 0, "zero_affiliate");
        assertEq(merchant.balance, initMerchantBal + net);
        assertTrue(gateway.isOrderPaid(orderB));
    }

    function test_PayNativeWithSplit_ReplayAttack_Reverts() public {
        bytes32 orderId = keccak256("split_replay");
        uint256 gross = 100 ether;

        vm.prank(customer);
        gateway.payNativeWithSplit{value: gross}(orderId, merchant, 80 ether, affiliate, 19.6 ether, "first");

        vm.prank(customer);
        vm.expectRevert(abi.encodeWithSelector(ArcPaymentGateway.PaymentAlreadySettled.selector, orderId));
        gateway.payNativeWithSplit{value: gross}(orderId, merchant, 80 ether, affiliate, 19.6 ether, "second");
    }

    function test_CrossFunction_ReplayAttack_Reverts() public {
        bytes32 orderId = keccak256("cross_replay");
        uint256 gross = 100 ether;

        // First pay with payNative
        vm.prank(customer);
        gateway.payNative{value: gross}(orderId, merchant, "pay_native");

        // Attempt replay via payNativeWithSplit
        vm.prank(customer);
        vm.expectRevert(abi.encodeWithSelector(ArcPaymentGateway.PaymentAlreadySettled.selector, orderId));
        gateway.payNativeWithSplit{value: gross}(orderId, merchant, 80 ether, affiliate, 19.6 ether, "split_attempt");
    }

    function test_PayNativeWithSplit_RevertIf_SplitMathMismatch() public {
        bytes32 orderId = keccak256("bad_split_math");
        uint256 grossAmount = 100 ether;
        // Net available = 99.60 ether, but passing 80 + 20 = 100 (which exceeds net available)
        uint256 creatorAmount = 80 ether;
        uint256 affiliateAmount = 20 ether;

        vm.prank(customer);
        vm.expectRevert(
            abi.encodeWithSelector(
                ArcPaymentGateway.InvalidSplitAmounts.selector,
                creatorAmount,
                affiliateAmount,
                99.60 ether
            )
        );
        gateway.payNativeWithSplit{value: grossAmount}(
            orderId,
            merchant,
            creatorAmount,
            affiliate,
            affiliateAmount,
            "meta"
        );
    }

    function test_PayNativeWithSplit_RevertIf_ZeroAffiliate() public {
        bytes32 orderId = keccak256("zero_affiliate_order");
        vm.prank(customer);
        vm.expectRevert(ArcPaymentGateway.InvalidAffiliate.selector);
        gateway.payNativeWithSplit{value: 10 ether}(
            orderId,
            merchant,
            9.96 ether,
            payable(address(0)),
            0,
            "meta"
        );
    }

    // -------------------------------------------------------------------------
    // calculateFee Helper Tests
    // -------------------------------------------------------------------------

    function test_CalculateFee_CorrectCalculation() public view {
        uint256 gross = 250 ether;
        (uint256 fee, uint256 net) = gateway.calculateFee(gross);
        // 250 * 40 / 10,000 = 1.00 ether
        assertEq(fee, 1 ether);
        assertEq(net, 249 ether);
    }

    // -------------------------------------------------------------------------
    // Admin & Governance Tests
    // -------------------------------------------------------------------------

    function test_SetFeeConfig_Success() public {
        address payable newTreasury = payable(makeAddr("newTreasury"));
        uint256 newFeeBps = 30; // 0.30%

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit FeeConfigUpdated(DEFAULT_FEE_BPS, newFeeBps, treasury, newTreasury);
        gateway.setFeeConfig(newFeeBps, newTreasury);

        assertEq(gateway.feeBps(), newFeeBps);
        assertEq(gateway.feeRecipient(), newTreasury);
    }

    function test_SetFeeConfig_RevertIf_NonOwner() public {
        vm.prank(alice);
        vm.expectRevert(ArcPaymentGateway.Unauthorized.selector);
        gateway.setFeeConfig(20, treasury);
    }

    function test_SetFeeConfig_RevertIf_ExceedsMaxCap() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ArcPaymentGateway.InvalidFeeBps.selector, 101, 100));
        gateway.setFeeConfig(101, treasury);
    }

    function test_SetFeeConfig_RevertIf_ZeroRecipient() public {
        vm.prank(owner);
        vm.expectRevert(ArcPaymentGateway.InvalidRecipient.selector);
        gateway.setFeeConfig(50, payable(address(0)));
    }

    function test_TransferOwnership_Success() public {
        address newOwner = makeAddr("newOwner");

        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(owner, newOwner);
        gateway.transferOwnership(newOwner);

        assertEq(gateway.owner(), newOwner);
    }

    function test_TransferOwnership_RevertIf_NonOwner() public {
        vm.prank(alice);
        vm.expectRevert(ArcPaymentGateway.Unauthorized.selector);
        gateway.transferOwnership(alice);
    }

    function test_TransferOwnership_RevertIf_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ArcPaymentGateway.InvalidRecipient.selector);
        gateway.transferOwnership(address(0));
    }

    // -------------------------------------------------------------------------
    // Reentrancy Protection
    // -------------------------------------------------------------------------

    function test_Reentrancy_Guard_Blocks_Reentry() public {
        MaliciousReceiver attacker = new MaliciousReceiver(address(gateway));
        attacker.setAttemptReenter(true);

        bytes32 orderId = keccak256("attack_order");

        vm.deal(customer, 10 ether);
        vm.prank(customer);
        // The reentrant call inside receive() will revert with ReentrancyGuardReentrantCall or cause TransferFailed
        vm.expectRevert();
        gateway.payNative{value: 5 ether}(orderId, payable(address(attacker)), "attack");
    }
}
