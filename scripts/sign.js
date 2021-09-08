async function main() {
    const winner = "0xf8f26151c9f445407eeA10E5DcA1C7e12a6194eE";
    const shoId = "ABC123";
    const amount = ethers.utils.parseEther("1");
    const deadline = Math.round(Date.now() / 1000) + 3600;
    const depositReceiver = "0xcF28556EE95Be8c52AD2f3480149128cCA51daC1";

    const dataHash = web3.utils.soliditySha3(winner, shoId, amount.toString(), deadline, depositReceiver);
    const signature = await web3.eth.sign(dataHash, "0xcF28556EE95Be8c52AD2f3480149128cCA51daC1");
    console.log(amount.toString());
    console.log(deadline)
    console.log(signature);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
