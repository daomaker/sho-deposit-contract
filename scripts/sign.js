require('dotenv').config();

async function main() {
    const winner = "0xf8f26151c9f445407eeA10E5DcA1C7e12a6194eE";
    const shoId = "ABC123";
    const depositToken = "";
	const amount = ethers.utils.parseUnits("1", 6);
    const deadline = Math.round(Date.now() / 1000) + 3600;
    const depositReceiver = "0xcF28556EE95Be8c52AD2f3480149128cCA51daC1";

    const dataHash = web3.utils.soliditySha3(winner, shoId, depositToken, amount.toString(), deadline, depositReceiver);
    const signature = web3.eth.accounts.sign(dataHash, process.env.DEPLOYER_PRIVATE_KEY).signature;
    
    console.log("Winner:", winner);
    console.log("SHO ID:", shoId);
    console.log("Deposit token:", depositToken);
    console.log("Amount:", amount.toString());
    console.log("Deadline:", deadline);
    console.log("Deposit receiver:", depositReceiver);
    console.log();
    console.log("Message:", dataHash);
    console.log("Signature:", signature);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
