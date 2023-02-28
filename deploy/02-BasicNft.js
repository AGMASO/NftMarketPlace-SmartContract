const { network, ethers } = require("hardhat");
const {
  developmentChain,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  INITIALSUPPLY,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;

  const { deployer } = await getNamedAccounts();

  const args = [];
  console.log("Working...");
  const basicNft = await deploy("BasicNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfiramtions: VERIFICATION_BLOCK_CONFIRMATIONS,
  });

  console.log(`Nft Guindaso is deployed to ${basicNft.address}`);

  if (
    !developmentChain.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(basicNft.address, args);
  }
};

module.exports.tags = ["all", "basicNft", "main"];
