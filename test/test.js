const { expect } = require("chai");
const { time } = require("@openzeppelin/test-helpers");

const parseUnits = (value, decimals = 18) => {
    return ethers.utils.parseUnits(value.toString(), decimals);
}

describe("SHO", () => {
    let contract, depositToken, depositReceiver, organizer, winner1, winner2, winner3, winner4, hacker, router;
    let depositToken2, depositReceiver2, organizer2;
    let shoId = "ABC1234567";

    before(async() => {
        const SHO = await ethers.getContractFactory("SHO");
        const ERC20 = await ethers.getContractFactory('ERC20Mock');
        const RouterMock = await ethers.getContractFactory('RouterMock');

        depositToken = await ERC20.deploy("MOCK token", "MOCK", 6, parseUnits(10000, 6));
        depositToken2 = await ERC20.deploy("MOCK token 2 ", "MOCK 2", 6, parseUnits(10000, 6));

        [owner, depositReceiver, organizer, winner1, winner2, winner3, winner4, depositReceiver2, organizer2, hacker] 
            = await ethers.getSigners();

        contract = await SHO.deploy(organizer2.address, depositReceiver2.address);
        await contract.deployed();

        router = await RouterMock.deploy();

        const initialBalance = parseUnits(2000, 6);
        await depositToken.transfer(winner2.address, initialBalance);
        await depositToken2.transfer(winner1.address, initialBalance);
        await depositToken2.transfer(winner2.address, initialBalance);
        await depositToken.transfer(winner3.address, initialBalance);
        await depositToken.transfer(winner4.address, initialBalance);
        await depositToken.transfer(hacker.address, initialBalance);

        depositToken = depositToken.connect(winner1);
        await depositToken.approve(contract.address, initialBalance);
        depositToken = depositToken.connect(winner2);
        await depositToken.approve(contract.address, initialBalance);
        depositToken2 = depositToken2.connect(winner1);
        await depositToken2.approve(contract.address, initialBalance);
        depositToken2 = depositToken2.connect(winner2);
        await depositToken2.approve(contract.address, initialBalance);
        depositToken = depositToken.connect(winner3);
        await depositToken.approve(contract.address, initialBalance);
        depositToken = depositToken.connect(winner4);
        await depositToken.approve(contract.address, initialBalance);
        depositToken = depositToken.connect(hacker);
        await depositToken.approve(contract.address, initialBalance);
    });

    describe("Full flow test", () => {
        let signature1, signature2, signature3, signature4, amount, deadline, maxAmount;

        before(async() => {
            const currentTime = await time.latest();
            amount = parseUnits(500, 6);
            deadline = Number(currentTime) + Number(time.duration.hours('12'));
            maxAmount = amount.mul(2);

            const dataHash1 = web3.utils.soliditySha3(winner1.address, shoId, depositToken.address, amount.toString(), deadline, depositReceiver.address, maxAmount);
            signature1 = await web3.eth.sign(dataHash1, organizer.address);

            const dataHash2 = web3.utils.soliditySha3(winner2.address, shoId, depositToken.address, amount.toString(), deadline, depositReceiver.address, maxAmount);
            signature2 = await web3.eth.sign(dataHash2, organizer.address);

            signatureWrongShoOrganizer = await web3.eth.sign(dataHash2, winner2.address);

            const dataHashWrongDepositReceiver = web3.utils.soliditySha3(winner2.address, shoId, depositToken.address, amount.toString(), deadline, winner2.address, maxAmount);
            signatureWrongDepositReceiver = await web3.eth.sign(dataHashWrongDepositReceiver, organizer.address);

            const dataHash3 = web3.utils.soliditySha3(winner3.address, shoId, depositToken.address, amount.toString(), deadline, depositReceiver.address, maxAmount);
            signature3 = await web3.eth.sign(dataHash3, organizer.address);

            const dataHash4 = web3.utils.soliditySha3(winner4.address, shoId, depositToken.address, amount.toString(), deadline, depositReceiver.address, maxAmount);
            signature4 = await web3.eth.sign(dataHash4, organizer.address);
        });

        it("Changing deposit receiver, organizer and pausing - only owner", async() => {
            contract = contract.connect(winner1);
            await expect(contract.setShoOrganizer(organizer.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(contract.setDepositReceiver(depositReceiver.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(contract.pause()).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(contract.unpause()).to.be.revertedWith("Ownable: caller is not the owner");

            contract = contract.connect(owner);
            await contract.setShoOrganizer(organizer.address);
            await contract.setDepositReceiver(depositReceiver.address);
            await contract.pause();
            await contract.unpause();
        });

        it("Winner 1 tries to deposit - fails, not enough balance", async() => {
            contract = contract.connect(winner1);
            await expect(contract.deposit(signature1, shoId, depositToken.address, amount, deadline, maxAmount))
                .to.be.revertedWith("ERC20: transfer amount exceeds balance");
                
            depositToken = depositToken.connect(owner);
            await depositToken.transfer(winner1.address, parseUnits(2000, 6));
        });

        it("Winner 1 tries to deposit and unpause while paused", async() => {
            contract = contract.connect(owner);
            await contract.pause();

            contract = contract.connect(winner1);
            await expect(contract.deposit(signature1, shoId, depositToken.address, amount, deadline, maxAmount))
                .to.be.revertedWith("Pausable: paused");
            await expect(contract.unpause())
                .to.be.revertedWith("Ownable: caller is not the owner");
            
            // Verify that the deposit did not take place
            const depositReceiverBalanceAfter = await depositToken.balanceOf(depositReceiver.address);
            expect(depositReceiverBalanceAfter).to.equal(0);

            contract = contract.connect(owner);
            await contract.unpause();
        });

        it("Winner 1 deposits - succeeds", async() => {
            contract = contract.connect(winner1);

            const depositReceiverBalanceBefore = await depositToken.balanceOf(depositReceiver.address);
            await contract.deposit(signature1, shoId, depositToken.address, amount, deadline, maxAmount);
            const depositReceiverBalanceAfter = await depositToken.balanceOf(depositReceiver.address);
            expect(depositReceiverBalanceAfter).to.equal(depositReceiverBalanceBefore.add(amount));
        });

        it("Winner 1 tries to deposit again - fails", async() => {
            contract = contract.connect(winner1);

            await expect(contract.deposit(signature1, shoId, depositToken.address, amount, deadline, maxAmount)).to.be.revertedWith("SHO: this wallet already made a deposit for this SHO");
        });
        
        it("Winner 2 tries to deposit with wrong parameters - fails", async() => {
            contract = contract.connect(winner2);

            await expect(contract.deposit(signature1, shoId, depositToken.address, amount, deadline, maxAmount))
                .to.be.revertedWith("SHO: signature verification failed");
            await expect(contract.deposit(signature2, shoId + "8", depositToken.address, amount, deadline, maxAmount))
                .to.be.revertedWith("SHO: signature verification failed");
            await expect(contract.deposit(signature2, shoId, depositToken2.address, amount, deadline, maxAmount))
                .to.be.revertedWith("SHO: signature verification failed");
            await expect(contract.deposit(signature2, shoId, depositToken.address, parseUnits(1, 6), deadline, maxAmount))
                .to.be.revertedWith("SHO: signature verification failed");
            await expect(contract.deposit(signature2, shoId, depositToken.address, amount, deadline + 1, maxAmount))
                .to.be.revertedWith("SHO: signature verification failed");
            await expect(contract.deposit(signatureWrongShoOrganizer, shoId, depositToken.address, amount, deadline, maxAmount))
                .to.be.revertedWith("SHO: signature verification failed");
            await expect(contract.deposit(signatureWrongDepositReceiver, shoId, depositToken.address, amount, deadline, maxAmount))
                .to.be.revertedWith("SHO: signature verification failed");
            await expect(contract.deposit(signatureWrongDepositReceiver, shoId, depositToken.address, amount, deadline, maxAmount.mul(2)))
                .to.be.revertedWith("SHO: signature verification failed");
        });

        it("Winner 2 deposits after 6 hours - succeeds", async() => {
            await time.increase(time.duration.hours('6'));
            contract = contract.connect(winner2);

            const depositReceiverBalanceBefore = await depositToken.balanceOf(depositReceiver.address);
            await contract.deposit(signature2, shoId, depositToken.address, amount, deadline, maxAmount);
            const depositReceiverBalanceAfter = await depositToken.balanceOf(depositReceiver.address);
            expect(depositReceiverBalanceAfter).to.equal(depositReceiverBalanceBefore.add(amount));
        });

        it("A hacker sends deposit directly to the SHO contract - the owner withdraws it", async() => {
            depositToken = depositToken.connect(hacker);
            await depositToken.transfer(contract.address, amount);

            contract = contract.connect(owner);
            const ownerBalanceBefore = await depositToken.balanceOf(owner.address);
            await contract.recoverERC20(depositToken.address);
            const ownerBalanceAfter = await depositToken.balanceOf(owner.address);
            expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.add(amount));
        })

        it("Winner 3 deposits when max deposit amount has been reached - fails", async() => {
            contract = contract.connect(winner4);

            await expect(contract.deposit(signature4, shoId, depositToken.address, amount, deadline, maxAmount)).to.be.revertedWith("SHO: the maximum amount of deposits have been reached");
        });

        it("Winner 4 deposits 2 hours after the deadline - fails", async() => {
            await time.increase(time.duration.hours('8'));
            contract = contract.connect(winner3);

            await expect(contract.deposit(signature3, shoId, depositToken.address, amount, deadline, maxAmount)).to.be.revertedWith("SHO: the deadline for this SHO has passed");
        });
    });

    describe("depositWithSwap", async() => {
        let shoId = "xxxx1234"

        it("deposits with swap", async() => {
            const currentTime = await time.latest();
            const amount = parseUnits(100, 6);
            const deadline = Number(currentTime) + Number(time.duration.hours('12'));
            const maxAmount = amount.mul(2);

            const dataHash1 = web3.utils.soliditySha3(winner1.address, shoId, depositToken.address, amount.toString(), deadline, depositReceiver.address, maxAmount);
            signature1 = await web3.eth.sign(dataHash1, organizer.address);

            await depositToken.connect(owner).transfer(router.address, parseUnits(101, 6));
            const swapData = await router.populateTransaction.swap(depositToken2.address, depositToken.address, parseUnits(101, 6), parseUnits(101, 6));

            const swapDataObj = {
                router: router.address,
                tokenIn: depositToken2.address,
                amountIn: parseUnits(101, 6),
                data: swapData.data
            }

            const depositReceiverBalanceBefore = await depositToken.balanceOf(depositReceiver.address);
            const winnerBalanceBefore = await depositToken.balanceOf(winner1.address);
            await contract.connect(winner1).depositWithSwap(signature1, shoId, depositToken.address, amount, deadline, maxAmount, swapDataObj);
            expect(await depositToken.balanceOf(depositReceiver.address)).to.equal(depositReceiverBalanceBefore.add(parseUnits(100, 6)));
            expect(await depositToken.balanceOf(winner1.address)).to.equal(winnerBalanceBefore.add(parseUnits(1, 6)));
        });
    });
});
