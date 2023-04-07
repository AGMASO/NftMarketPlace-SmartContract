const { ethers, network } = require("hardhat");

async function mintOnly() {
  const BasicNft = await ethers.getContract("BasicNft");

  console.log("Minting new BasciNft");
  const mintTx = await BasicNft._mintNFT();
  const mintTxReceipt = await mintTx.wait(1);

  const TokenId = mintTxReceipt.events[0].args.tokenId;
  console.log(`The address of new BasicNft is ${BasicNft.address}`);
  console.log(`The tokenId of the new minted BasicNft is ${TokenId}`);
  console.log("--------------------------");
}

mintOnly()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
