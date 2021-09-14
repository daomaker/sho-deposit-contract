async function main() {
    const shoOrganizer = "";
    const depositReceiver = "";

    const SHO = await ethers.getContractFactory("SHO");
    const sho = await SHO.deploy(shoOrganizer, depositReceiver);
    await sho.deployed();

    console.log("SHO smart contract deployed at:", sho.address);
    console.log("shoOrganizer:", shoOrganizer);
    console.log("depositReceiver:", depositReceiver);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
