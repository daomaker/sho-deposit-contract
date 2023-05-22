require('dotenv').config();

async function main() {
    const winner = "0x7d7b27b107b19ad9cb198bf3ed2b48dc919eca14";
    const shoId = "NgiILi6PTj";
    const depositToken = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
	const amount = ethers.utils.parseUnits("500", 18);
    const deadline = 1654279260;
    const maxDepositAmount = "445000000000000000000000";
    const depositReceiver = "0x0281286b92fAECC04E38A70fDe45BA9D0575fa5E";

    const dataHash = web3.utils.soliditySha3(winner, shoId, depositToken, amount.toString(), deadline, depositReceiver, maxDepositAmount.toString());
    const signature = web3.eth.accounts.sign(dataHash, process.env.DEPLOYER_PRIVATE_KEY).signature;
    
    console.log("Winner:", winner);
    console.log("SHO ID:", shoId);
    console.log("Deposit token:", depositToken);
    console.log("Amount:", amount.toString());
    console.log("Deadline:", deadline);
    console.log("Deposit receiver:", depositReceiver);
    console.log("Max deposit amount:", maxDepositAmount);
    console.log();
    console.log("Signature:", signature);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
