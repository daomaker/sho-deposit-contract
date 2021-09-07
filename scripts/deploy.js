async function main() {
    const depositToken = "";
    const depositReceiver = "";
    const organizer = "";

    const SHO = await ethers.getContractFactory("SHO");
    const sho = await SHO.deploy(depositToken, depositReceiver, organizer);
    await sho.deployed();

    console.log("SHO deployed to:", sho.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
