// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.8;

/**
 * !Contrato para crear NFTMarketPlace
 */

/**
 * !Orden ideal para contratos de solidity por convencion
 * *Pragma, Imports,Errors, Interfaces, Libraries, NatSPEC antes de -->Contracts
 */

//IMPORTS
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

//Importamos contrato de oppenzepelin para protegernos de REENTRANCY ATTACKS
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
//ERRORS
error MarketPlace_PriceMustBeGreaterThan0();
error MarketPlace_NotApprovedForMarketPlace();
error MarketPlace_AlreadyListed(address nftAddress, uint256 tokenId);
error MarketPlace_NotOwner();
error MarketPlace_NotListed(address nftAddress, uint256 tokenId);
error MarketPlace_PriceNotMet(
    address nftAddress,
    uint256 tokenId,
    uint256 price
);
error MarketPlace_PriceMustBeAboveZero();
error MarketPlace_NoProceeds();
error MarketPlace_TransferFailed();

contract NftMarketplace is ReentrancyGuard {
    //TYPES

    struct Listing {
        uint256 price;
        address seller;
    }
    //EVENTS
    event ItemListing(
        address seller,
        address nftAddress,
        uint256 tokenId,
        uint256 price
    );
    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 tokenId,
        uint256 price
    );

    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 tokenId
    );
    //MAPPINGS
    //Crearemos un mapping que junta NFT Contract address -> Nft TokenID -> Listing(un tipo de struct)
    mapping(address => mapping(uint256 => Listing)) private s_listings;

    //Creamos otro mapa para trackear la cantidad de dienro que el vendedor del nft ha acumulado
    //Haremos que cada vez que alguien compre un Item con la function buyItem, se actualice el mapping
    mapping(address => uint256) private s_proceeds;

    ///
    //MODIFIER
    ///
    //Crearemos un Modifier para asegurarnos de que no se listan Nfts que ya se listaron anteriormente

    modifier notListed(
        address nftAddress,
        address owner,
        uint256 tokenId
    ) {
        Listing memory listingListed = s_listings[nftAddress][tokenId];

        if (listingListed.price > 0) {
            revert MarketPlace_AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    /**
     * *Creamos otro modifier para que solo el owner pueda listar sus nfts.
     */

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert MarketPlace_NotOwner();
        }
        _;
    }

    /**
     * * Creamos modifier para ver si esta listado el Nft
     */

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listingAlreadyListed = s_listings[nftAddress][tokenId];

        if (listingAlreadyListed.price <= 0) {
            revert MarketPlace_NotListed(nftAddress, tokenId);
        }
        _;
    }

    //STATE VARIABLES

    //////////////////
    //Main FUnctions//
    //////////////////

    /*
     * @notice Method for listing NFT
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     * @param price sale price for each item
     */

    function listItems(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        notListed(nftAddress, msg.sender, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert MarketPlace_PriceMustBeGreaterThan0();
        }
        //¿Cómo hacemos para listar los NFTS en nuestro marketPlace?
        //Opcion 1: Enviar el NFT directamente al Contrato que será nuestro marketplace. Usamos la function implicita Transfer
        // Esto no es práctico, porque el owner pierde su Nft y ademas los gastos en gas son altos.

        //Opcion2: Solamente le damos al contrato del Marketplace el Approval para vender el NFT si alguien lo quisiera.
        //Esta opción es óptima porque el Owner mantiene su nft en todo momento. Además no se gasta gas.

        IERC721 nft = IERC721(nftAddress);
        //Creamos una instancia de un nuevo Nft gracias a la Interface. Este Interface nft tiene la address del Nft que queremos
        //listar.
        //Luego usamos la function getApproved para aprobar el contrato, y si no es igual a la address de nuestro contrato
        //Que salte un error
        if (nft.getApproved(tokenId) != address(this)) {
            revert MarketPlace_NotApprovedForMarketPlace();
        }
        //¿Como vamos a ordenar los Items?¿Array o mapping? mejor usamos mapping. Va aser mas apropiado
        //Vamos a Update el mappig creado

        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        //Cuando update mapping lo que hay que hacer es emit un event. Ademas nos ayudara para el frontEnd

        emit ItemListing(msg.sender, nftAddress, tokenId, price);
    }

    /**END */

    /*
     * @notice Method for buying listing
     * @notice The owner of an NFT could unapprove the marketplace,
     * which would cause this function to fail
     * Ideally you'd also have a `createOffer` functionality.
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     */

    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable nonReentrant isListed(nftAddress, tokenId) {
        //La primera cosa que debemos controlar, es si el nft que queremos comprar esta listado o no. Para ello creamos otro
        //Modifier que será isListed.

        //Mapeamos para sacar los detalles de cada Nft listed
        Listing memory listedItem = s_listings[nftAddress][tokenId];

        //Una vez sacado el precio al que ha listado el Nft en nuestro contrato marketPlace, debemos hacer la logica
        //para cuando el precio no llega para compar el nft por el cliente

        if (msg.value < listedItem.price) {
            revert MarketPlace_PriceNotMet(
                nftAddress,
                tokenId,
                listedItem.price
            ); //podemos ver que nft address y token no se pudo vender y el precio del comprador
        }

        //!Nota que no enviamos el dinero directametne al vendedor. Esto es un procedimiento comun en ETH para abolir el riesgo
        //! de cometer errores enviando el dinero. Para ello se deja que el cliente se lleve el riesgo , ejecutando el mismo
        //! la function withdraw del contrato marketPlace
        //Cada vez que se compre un Item se actualiza el mapping de ingresos o s_proceeds
        //! Muy importante para evitar REENTRACY Hacks, actualizar el mapping antes del withdraw

        s_proceeds[listedItem.seller] =
            s_proceeds[listedItem.seller] +
            msg.value;
        //Borramos el Item de la lista. Para ello borramos el mapping;
        delete (s_listings[nftAddress][tokenId]);

        //Finalmente usamos la function SAFEtransferFrom interna de IERC721 para enviar el nft al nuevo owner
        //! USamos safe transfer porque nos saltara error  antes de perder el nft por cualquier cosa erronea durante el proceso
        //!SIempre meter el contrato externo de withdraw, transfer,etc.. al final del todo para evitar hacks
        IERC721(nftAddress).safeTransferFrom(
            listedItem.seller,
            msg.sender,
            tokenId
        );

        //Debemos chequear que el nft se ha transferido satisfactoriamente

        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    /**END */

    /*
     * @notice Method for cancelling listing
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     * @notice isOwner and isListed para comprobar de primeras que solo se pueda ejecutar si esta listado y es el owner
     */

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        //Simplemnete borrar el mapping correspondietne a este nft y emitir evento
        delete (s_listings[nftAddress][tokenId]);

        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    /**
     * END
     */

    /*
     * @notice Method for updating listing
     * @param nftAddress Address of NFT contract
     * @param tokenId Token ID of NFT
     * @param newPrice Price in Wei of the item
     */

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        nonReentrant
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        //SImplemnete sacamos del mapping el price antiguo y le asignamos el nuevo price, en este caso llamado newPrice
        //Emitimos el evento de ItemListed ya que es estamos listando de nuevo un nft
        if (newPrice <= 0) {
            revert MarketPlace_PriceMustBeAboveZero();
        }

        s_listings[nftAddress][tokenId].price = newPrice;

        //!Usamos el evento ItemListing, usado anteriormetne, porque al final,  update un nft es similar a listar de nuevo
        //! el nft

        emit ItemListing(msg.sender, nftAddress, tokenId, newPrice);
    }

    /**END */
    /*
     * @notice Method for withdrawing proceeds from sales
     */
    function withdrawProceeds() external nonReentrant {
        //localizamos los proceeds con el mapping que creamos para ello
        uint256 proceeds = s_proceeds[msg.sender];

        if (proceeds <= 0) {
            revert MarketPlace_NoProceeds();
        }
        //si es mayor de 0, reseteamos el mapping primero para evitar hacks
        s_proceeds[msg.sender] = 0;

        //ejecutamos el metodo de pago
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        if (!success) {
            revert MarketPlace_TransferFailed();
        }
    }

    /**END */

    ///GET FUNCTIONS///

    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}
