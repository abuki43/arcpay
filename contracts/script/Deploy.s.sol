// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ArcPaymentGateway} from "../src/ArcPaymentGateway.sol";

contract DeployScript is Script {
    function run() external returns (ArcPaymentGateway gateway) {
        // Reverts if PRIVATE_KEY is unset. Never fall back to a well-known
        // test key — a silent fallback would deploy the gateway under an
        // address whose private key is public.
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address deployer = vm.addr(deployerPrivateKey);
        address payable feeRecipient = payable(
            vm.envOr("FEE_RECIPIENT", deployer)
        );
        uint256 feeBps = vm.envOr("FEE_BPS", uint256(40)); // 0.40%

        console.log("==================================================");
        console.log("Deploying ArcPaymentGateway on Chain ID:", block.chainid);
        console.log("Deployer Address:", deployer);
        console.log("Protocol Fee Recipient:", feeRecipient);
        console.log("Protocol Fee BPS:", feeBps);
        console.log("==================================================");

        vm.startBroadcast(deployerPrivateKey);
        gateway = new ArcPaymentGateway(feeRecipient, feeBps);
        vm.stopBroadcast();

        console.log("--------------------------------------------------");
        console.log("ArcPaymentGateway Deployed at:", address(gateway));
        console.log("Owner:", gateway.owner());
        console.log("Settlement Model: 1-Click Native USDC Gas");
        console.log("==================================================");
    }
}
