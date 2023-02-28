//Deployment of the contract NftMarketPlace for Local and GoerliNet

const { network, ethers } = require("hardhat");
const {
  developmentChain,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;

  const { deployer } = await getNamedAccounts();

  console.log("Working...");
  const nftMarketPlace = await deploy("NftMarketplace", {
    from: deployer,
    args: [],
    log: true,
    waitConfiramtions: VERIFICATION_BLOCK_CONFIRMATIONS,
  });

  console.log(
    `NftMarketplace Contract is deployed to ${nftMarketPlace.address}`
  );

  //Verifying

  if (
    !developmentChain.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log("verifying...");
    await verify(nftMarketPlace.address, []);
  }
};

module.exports.tags = ["all", "nftMarketPlace"];
