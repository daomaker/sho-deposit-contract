require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-etherscan");

module.exports = {
    solidity: {
        version: "0.8.7",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        mainnet: {
            url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`]
        },
        kovan: {
            url: `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: 1e9
        },
        ropsten: {
            url: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY}`,
            accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
            gasPrice: 1e9
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_KEY
    }
};
