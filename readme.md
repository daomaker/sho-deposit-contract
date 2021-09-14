# Deploy

`npx hardhat run --network [NETWORK_NAME] scripts\deploy.js`

# Verify on Etherscan

`npx hardhat verify --network [NETWORK_NAME] [DEPLOYED_CONTRACT_ADDRESS] [SHO_ORGANIZER_ADDRESS] [DEPOSIT_RECEIVER_ADDRESS]`

# Sign a test message

Edit the `sign.js` script as desired and run:

`npx hardhat run scripts\sign.js`