const { ethers, network } = require("hardhat");

async function mintList() {
  const PRICE = ethers.utils.parseEther("0.01");

  const BasicNft = await ethers.getContract("BasicNft");

  console.log("Minting new BasciNft");
  const mintTx = await BasicNft._mintNFT();
  const mintTxReceipt = await mintTx.wait(1);

  const TokenId = mintTxReceipt.events[0].args.tokenId;
  console.log(`The address of new BasicNft is ${BasicNft.address}`);
  console.log(`The tokenId of the new minted BasicNft is ${TokenId}`);
  console.log("--------------------------");

  console.log("Creating nftMarketPlace contract");
  const nftMarketPlace = await ethers.getContract("NftMarketplace");
  console.log(
    `The addres of new NftMarketPlace contract is ${nftMarketPlace.address}`
  );
  console.log("Approving Nft..");

  const approval = await BasicNft.approve(nftMarketPlace.address, TokenId);
  await approval.wait(1);

  const txListing = await nftMarketPlace.listItems(
    BasicNft.address,
    TokenId,
    PRICE
  );
  await txListing.wait(1);
  console.log("NFT Listed!");
}

mintList()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
