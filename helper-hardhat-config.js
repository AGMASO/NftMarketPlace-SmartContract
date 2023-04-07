//Como ARGS debemos añadir la address del SmartContract de Chainlink-vrfCoordinationV2.
//En este js, vamos a crear la lógica, en la que le diremos que si la chainId es x que use Y, pero si es z, que use p.

const { ethers } = require("hardhat");

const networkConfig = {
  5: {
    name: "goerli",
    ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    vrfCoordinatorV2: "0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d",
    mintFee: ethers.utils.parseEther("0.05"),
    keyHash:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    subscriptionId: "4054",
    callbackGasLimit: "500000",
    interval: "30",
  },
  11155111: {
    name: "sepolia",
    ethUsdPriceFeed: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    mintFee: ethers.utils.parseEther("0.05"),
    keyHash:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    subscriptionId: "4054",
    callbackGasLimit: "500000",
    interval: "30",
  },
  31337: {
    name: "hardhat",
    ethUsdPriceFeed: "0x9326BFA02ADD2366b30bacB125260Af641031331",
    /*vrfCoordinatorV2: "",*/ //We don´t need it for local.
    mintFee: ethers.utils.parseEther("0.05"),
    vrfCoordinatorV2: "0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d",
    keyHash:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    subscriptionId: "4054",
    callbackGasLimit: "500000",
    interval: "30",
  },
  137: {
    name: "polygon",
    vrfCoordinatorV2: "0xAE975071Be8F8eE67addBC1A82488F1C24858067",
    entranceFee: ethers.utils.parseEther("0.000002"),
    keyHash:
      "0x6e099d640cde6de9d40ac749b4b594126b0169747122711109c9985d47751f93",
    subscriptionId: "4054",
    callbackGasLimit: "500000",
    interval: "30",
  },
};

const VERIFICATION_BLOCK_CONFIRMATIONS = 6;

//Aqui vamos a especificar cual es nuestra developmentChain, es decir la que no tiene priceFeed,

const developmentChain = ["hardhat", "localhost"];

/**
 * !Los argumentos que necesita el deployment de MockV3Aggregator, es decir el test, son decimals y initial_answer
 * ! Por esto los debemos definir aquí, y luego exportarlos al contrato.
 */

module.exports = {
  networkConfig,
  developmentChain,
  VERIFICATION_BLOCK_CONFIRMATIONS,
};
