require('dotenv').config();

async function main() {
    const winner = "";
    const shoId = "bilygb&^9871354lijh ,!@#$%^&*().";
    const depositToken = "0xfb5c0d4bf2477904dfcd003d957c474030ca4be1";
	const amount = ethers.utils.parseUnits("1", 6);
    const deadline = Math.round(Date.now() / 1000) + 3600;
    const maxDepositAmount = ethers.utils.parseUnits("5", 6);
    const depositReceiver = "";

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
