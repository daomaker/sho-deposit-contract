const { expect } = require("chai");
const { time } = require("@openzeppelin/test-helpers");

const parseUnits = (value, decimals = 18) => {
    return ethers.utils.parseUnits(value.toString(), decimals);
}

describe("SHO", () => {
    let contract, depositToken, depositReceiver, organizer, winner1, winner2, winner3;
    let depositToken2, depositReceiver2, organizer2;
    let shoId = "ABC1234567";

    before(async() => {
        const SHO = await ethers.getContractFactory("SHO");
        const ERC20 = await ethers.getContractFactory('ERC20Mock');

        depositToken = await ERC20.deploy("MOCK token", "MOCK", 6, parseUnits(6000, 6));
        depositToken2 = await ERC20.deploy("MOCK token 2 ", "MOCK 2", 6, parseUnits(0, 6));
        [depositReceiver, organizer, winner1, winner2, winner3, depositReceiver2, organizer2] = await ethers.getSigners();

        contract = await SHO.deploy(depositToken2.address, depositReceiver2.address, organizer2.address);
        await contract.deployed();

        const initialBalance = parseUnits(2000, 6);
        await depositToken.transfer(winner2.address, initialBalance);
        await depositToken.transfer(winner3.address, initialBalance);

        depositToken = depositToken.connect(winner1);
        await depositToken.approve(contract.address, initialBalance);
        depositToken = depositToken.connect(winner2);
        await depositToken.approve(contract.address, initialBalance);
        depositToken = depositToken.connect(winner3);
        await depositToken.approve(contract.address, initialBalance);
    });

    describe("Full flow test", () => {
        let signature1, signature2, signature3, amount, deadline;

        before(async() => {
            const currentTime = await time.latest();
            amount = parseUnits(500, 6);
            deadline = Number(currentTime) + Number(time.duration.hours('12'));

            const dataHash1 = web3.utils.soliditySha3(winner1.address, shoId, amount.toString(), deadline, depositReceiver.address);
            signature1 = await web3.eth.sign(dataHash1, organizer.address);

            const dataHash2 = web3.utils.soliditySha3(winner2.address, shoId, amount.toString(), deadline, depositReceiver.address);
            signature2 = await web3.eth.sign(dataHash2, organizer.address);

            const dataHash3 = web3.utils.soliditySha3(winner2.address, shoId, amount.toString(), deadline, depositReceiver.address);
            signature3 = await web3.eth.sign(dataHash3, organizer.address);;
        });

        it("Changing deposit token, deposit receiver and organizer - only owner", async() => {
            contract = contract.connect(winner1);
            await expect(contract.setDepositToken(depositToken.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(contract.setDepositReceiver(depositReceiver.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(contract.setShoOrganizer(organizer.address)).to.be.revertedWith("Ownable: caller is not the owner");

            contract = contract.connect(depositReceiver);
            await contract.setDepositToken(depositToken.address);
            await contract.setDepositReceiver(depositReceiver.address);
            await contract.setShoOrganizer(organizer.address);
        });

        it("Winner 1 tries to send the deposit TX - fails, not enough balance", async() => {
            contract = contract.connect(winner1);
            await expect(contract.deposit(signature1, shoId, amount, deadline, depositReceiver.address))
                .to.be.revertedWith("ERC20: transfer amount exceeds balance");
                
            depositToken = depositToken.connect(depositReceiver);
            await depositToken.transfer(winner1.address, parseUnits(2000, 6));
        });

        it("Winner 1 sends the deposit TX", async() => {
            contract = contract.connect(winner1);

            const depositReceiverBalanceBefore = await depositToken.balanceOf(depositReceiver.address);
            await contract.deposit(signature1, shoId, amount, deadline, depositReceiver.address);
            const depositReceiverBalanceAfter = await depositToken.balanceOf(depositReceiver.address);
            expect(depositReceiverBalanceAfter).to.equal(depositReceiverBalanceBefore.add(amount));
        });

        it("Winner 1 tries to deposit again - fails", async() => {
            contract = contract.connect(winner1);

            await expect(contract.deposit(signature1, shoId, amount, deadline, depositReceiver.address)).to.be.revertedWith("SHO: this wallet already made a deposit for this SHO");
        });
        
        it("Winner 2 tries to deposit with wrong parameters", async() => {
            contract = contract.connect(winner2);

            await expect(contract.deposit(signature1, shoId, amount, deadline, depositReceiver.address))
                .to.be.revertedWith("SHO: signature verification failed");
            await expect(contract.deposit(signature2, shoId + "8", amount, deadline, depositReceiver.address))
                .to.be.revertedWith("SHO: signature verification failed");
            await expect(contract.deposit(signature2, shoId, parseUnits(1, 6), deadline, depositReceiver.address))
                .to.be.revertedWith("SHO: signature verification failed");
            await expect(contract.deposit(signature2, shoId, parseUnits(1000, 6), deadline, depositReceiver.address))
                .to.be.revertedWith("SHO: signature verification failed");
            await expect(contract.deposit(signature2, shoId, amount, deadline + Number(time.duration.hours('12')), depositReceiver.address))
                .to.be.revertedWith("SHO: signature verification failed");
            await expect(contract.deposit(signature2, shoId, amount, deadline, organizer.address))
                .to.be.revertedWith("SHO: invalid deposit receiver");
        });

        it("Winner 2 sends the deposit TX after 6 hours", async() => {
            await time.increase(time.duration.hours('6'));
            contract = contract.connect(winner2);

            const depositReceiverBalanceBefore = await depositToken.balanceOf(depositReceiver.address);
            await contract.deposit(signature2, shoId, amount, deadline, depositReceiver.address);
            const depositReceiverBalanceAfter = await depositToken.balanceOf(depositReceiver.address);
            expect(depositReceiverBalanceAfter).to.equal(depositReceiverBalanceBefore.add(amount));
        });

        it("Winner 3 deposit after 14 hours fails - too late", async() => {
            await time.increase(time.duration.hours('8'));
            contract = contract.connect(winner3);

            await expect(contract.deposit(signature3, shoId, amount, deadline, depositReceiver.address)).to.be.revertedWith("SHO: the deadline for this SHO has passed");
        });
    });
});
