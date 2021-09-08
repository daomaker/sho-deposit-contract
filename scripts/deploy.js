async function main() {
    const organizer = "";
    const depositReceiver = "";
    const depositToken = "";

    const SHO = await ethers.getContractFactory("SHO");
    const sho = await SHO.deploy(organizer, depositReceiver, depositToken);
    await sho.deployed();

    console.log("SHO deployed to:", sho.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
