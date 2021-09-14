async function main() {
    const organizer = "0x304E7ADdF70A4B0EA27C46483D43cc27e40c35De";
    const depositReceiver = "0xcF28556EE95Be8c52AD2f3480149128cCA51daC1"

    const SHO = await ethers.getContractFactory("SHO");
    const sho = await SHO.deploy(organizer, depositReceiver);
    await sho.deployed();

    console.log("SHO deployed to:", sho.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
