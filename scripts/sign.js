require('dotenv').config();

async function main() {
    const winner = "0xf8f26151c9f445407eeA10E5DcA1C7e12a6194eE";
    const shoId = "ABC123";
	const amount = ethers.utils.parseUnits("1", 6);
    const deadline = Math.round(Date.now() / 1000) + 3600;
    const depositReceiver = "0xcF28556EE95Be8c52AD2f3480149128cCA51daC1";

    const dataHash = web3.utils.soliditySha3(winner, shoId, amount.toString(), deadline, depositReceiver);
    const res = web3.eth.accounts.sign(dataHash, process.env.DEPLOYER_PRIVATE_KEY);
    const signature = res.signature;
    
    console.log(amount.toString());
    console.log(deadline)
    console.log(signature);
    console.log(signature2);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
