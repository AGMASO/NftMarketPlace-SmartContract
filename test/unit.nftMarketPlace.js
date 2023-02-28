//Test for NftMarketPlace
//Proceso: importamos todo lo necesario.
//arrancamos el test en Local
//Hacemos un beforeEach donde iniciaremos primero el deployer y el BasicNft
//Luego con Fixture, iniciamos el deployment del mock(en el caso de haberlo) y el contrato requerido
//Finalmente creamos constante de lo contratos que vamos a usar, en ente caso nuestro nftMarketPlace y basic nft

//!Añadimos este plugin de chai llamado eventemitter2 para poder usar .to.emit(nombre del evento)
const chai = require("chai");
const eventemitter2 = require("chai-eventemitter2");

chai.use(eventemitter2());
const { assert, expect } = require("chai");
const { deployments, network, getNamedAccounts } = require("hardhat");
const { ethers } = require("hardhat");
const { developmentChain, networkConfig } = require("../helper-hardhat-config");
const chainId = network.config.chainId;

!developmentChain.includes(network.name)
  ? describe.skip
  : describe("NftMarkelPlace Uint Testing", function () {
      let nftMarketPlace,
        deployer,
        nftMarketPlaceContract,
        basicNftContract,
        basicNft;
      const PRICE = ethers.utils.parseEther("0.1");
      const NEWPRICE = ethers.utils.parseEther("0.2");
      const TOKEN_ID = 0;

      beforeEach(async function () {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        user1 = accounts[1];
        console.log(`Deployer account is ${deployer.address}`);

        await deployments.fixture(["all"]);

        nftMarketPlaceContract = await ethers.getContract("NftMarketplace");
        nftMarketPlace = nftMarketPlaceContract.connect(deployer);

        basicNftContract = await ethers.getContract("BasicNft");
        basicNft = basicNftContract.connect(deployer);
        await basicNft._mintNFT();
        await basicNft.approve(nftMarketPlaceContract.address, TOKEN_ID);
      });

      describe("listItems", function () {
        it("emits an event after listing an item", async function () {
          expect(
            await nftMarketPlace.listItems(
              basicNftContract.address,
              TOKEN_ID,
              PRICE
            )
          ).to.emit("ItemListing");
        });

        it("exclusively items that haven't been listed", async function () {
          await nftMarketPlace.listItems(basicNft.address, TOKEN_ID, PRICE);

          const error = `MarketPlace_AlreadyListed("${basicNft.address}", ${TOKEN_ID})`;
          /*await expect(
            await nftMarketPlace.listItems(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("MarketPlace_AlreadyListed");
        */
          await expect(
            nftMarketPlace.listItems(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith(error);
        });

        it("exclusively allows owners to list", async function () {
          nftMarketPlace = nftMarketPlaceContract.connect(user1);

          await basicNft.approve(user1.address, TOKEN_ID);

          await expect(
            nftMarketPlace.listItems(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("MarketPlace_NotOwner");
        });

        it("needs approvals to list item", async function () {
          await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID);

          await expect(
            nftMarketPlace.listItems(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("MarketPlace_NotApprovedForMarketPlace");
        });

        it("Updates listing with seller and price", async function () {
          await nftMarketPlace.listItems(basicNft.address, TOKEN_ID, PRICE);
          const listing = await nftMarketPlace.getListing(
            basicNft.address,
            TOKEN_ID
          );
          console.log(listing.price.toString());
          console.log(listing.seller.toString());

          assert.equal(listing.price.toString(), PRICE.toString());
          assert.equal(listing.seller.toString(), deployer.address);
        });
      });

      describe("cancelListing", function () {
        it("reverts if there is no listing", async function () {
          await expect(
            nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("MarketPlace_NotListed");
        });

        it("reverts if anyone but the owner tries to call", async function () {
          nftMarketPlace = nftMarketPlaceContract.connect(user1);
          await expect(
            nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("MarketPlace_NotOwner");
        });

        it("emits event and removes listing", async function () {
          await nftMarketPlace.listItems(basicNft.address, TOKEN_ID, PRICE);
          await expect(
            nftMarketPlace.cancelListing(basicNft.address, TOKEN_ID)
          ).to.emit("ItemCanceled");

          const listing = await nftMarketPlace.getListing(
            basicNft.address,
            TOKEN_ID
          );

          assert.equal(listing.price.toString(), 0);
        });
      });

      describe("buyItem", function () {
        it("reverts if the item isnt listed", async function () {
          await expect(
            nftMarketPlace.buyItem(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("MarketPlace_NotListed");
        });

        it("reverts if the price isnt met", async function () {
          await nftMarketPlace.listItems(basicNft.address, TOKEN_ID, PRICE);

          await expect(
            nftMarketPlace.buyItem(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("MarketPlace_PriceNotMet");
        });
        it("transfers the nft to the buyer and updates internal proceeds record", async function () {
          await nftMarketPlace.listItems(basicNft.address, TOKEN_ID, PRICE);

          const oldOwner = await basicNft.ownerOf(TOKEN_ID);
          console.log(oldOwner);

          nftMarketPlace = nftMarketPlaceContract.connect(user1);
          //Estamos conectando la wallet del otro usuario al contrato marketPlace que contiene los NFT listados.

          await expect(
            nftMarketPlace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
          ).to.emit("ItemBought");

          const newOwner = await basicNft.ownerOf(TOKEN_ID);
          console.log(newOwner);

          const deployerProceeds = await nftMarketPlace.getProceeds(
            deployer.address
          );
          assert.equal(newOwner, user1.address);
          assert.equal(deployerProceeds.toString(), PRICE);
        });
      });

      describe("updateListing", function () {
        it("must be owner and listed", async function () {
          await expect(
            nftMarketPlace.updateListing(basicNft.address, TOKEN_ID, NEWPRICE)
          ).to.be.revertedWith("MarketPlace_NotListed");

          await nftMarketPlace.listItems(basicNft.address, TOKEN_ID, PRICE);
          nftMarketPlace = nftMarketPlaceContract.connect(user1);
          await expect(
            nftMarketPlace.updateListing(basicNft.address, TOKEN_ID, NEWPRICE)
          ).to.be.revertedWith("MarketPlace_NotOwner");
        });

        it("New price must be greater than 0 and updates the new price", async function () {
          await nftMarketPlace.listItems(basicNft.address, TOKEN_ID, PRICE);

          await expect(
            nftMarketPlace.updateListing(basicNft.address, TOKEN_ID, 0)
          ).to.be.revertedWith("MarketPlace_PriceMustBeAboveZero");

          await expect(
            nftMarketPlace.updateListing(basicNft.address, TOKEN_ID, NEWPRICE)
          ).to.emit("ItemListing");

          const listing = await nftMarketPlace.getListing(
            basicNft.address,
            TOKEN_ID
          );

          assert.equal(listing.price.toString(), NEWPRICE);
        });
      });

      describe("withdrawProceeds", function () {
        it("doesn't allow 0 proceed withdrawls", async function () {
          await expect(
            nftMarketPlace.withdrawProceeds({ value: 0 })
          ).to.be.revertedWith("MarketPlace_NoProceeds");
        });

        it("withdraws proceeds", async function () {
          await nftMarketPlace.listItems(basicNft.address, TOKEN_ID, PRICE);

          nftMarketPlace = nftMarketPlaceContract.connect(user1);

          await nftMarketPlace.buyItem(basicNft.address, TOKEN_ID, {
            value: PRICE,
          });

          nftMarketPlace = nftMarketPlaceContract.connect(deployer);

          const deployerProceedsbefore = await nftMarketPlace.getProceeds(
            deployer.address
          );
          const deployerBalanceBefore = await deployer.getBalance();

          console.log(deployerProceedsbefore.toString());
          console.log(deployerBalanceBefore.toString());

          assert.equal(deployerProceedsbefore.toString(), PRICE);

          const txResponse = await nftMarketPlace.withdrawProceeds();
          const transactionReceipt = await txResponse.wait(1);

          const deployerProceedsafter = await nftMarketPlace.getProceeds(
            deployer.address
          );

          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          console.log(gasCost.toString());

          const deployerBalanceAfter = await deployer.getBalance();

          assert.equal(deployerProceedsafter, 0);
          assert.equal(
            deployerBalanceAfter.add(gasCost).toString(),
            deployerProceedsbefore.add(deployerBalanceBefore).toString()
          );
          console.log(deployerBalanceAfter.add(gasCost).toString());
          console.log(
            deployerProceedsbefore.add(deployerBalanceBefore).toString()
          );
        });
      });
    });
