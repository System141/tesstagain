// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract NFTMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    struct Offer {
        address buyer;
        uint256 amount;
        uint256 timestamp;
        bool active;
    }

    // Platform fee (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFeeBps = 250;
    
    // Listings
    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId = 1;
    
    // Offers: nftContract => tokenId => offers array
    mapping(address => mapping(uint256 => Offer[])) public offers;
    
    // User listings tracking
    mapping(address => uint256[]) public userListings;
    
    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );
    
    event ListingCancelled(uint256 indexed listingId);
    event ListingUpdated(uint256 indexed listingId, uint256 newPrice);
    
    event Sale(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        address nftContract,
        uint256 tokenId,
        uint256 price
    );
    
    event OfferMade(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 amount
    );
    
    event OfferAccepted(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed buyer,
        address seller,
        uint256 amount
    );
    
    event OfferCancelled(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed buyer
    );

    constructor() Ownable(msg.sender) {}

    // Create a listing
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant returns (uint256) {
        require(price > 0, "Price must be greater than 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        uint256 listingId = nextListingId++;
        
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });
        
        userListings[msg.sender].push(listingId);
        
        emit ListingCreated(listingId, msg.sender, nftContract, tokenId, price);
        
        return listingId;
    }

    // Update listing price
    function updateListing(uint256 listingId, uint256 newPrice) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        require(newPrice > 0, "Price must be greater than 0");
        
        listing.price = newPrice;
        
        emit ListingUpdated(listingId, newPrice);
    }

    // Cancel listing
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        
        listing.active = false;
        
        emit ListingCancelled(listingId);
    }

    // Buy listed NFT
    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value == listing.price, "Incorrect payment amount");
        
        listing.active = false;
        
        // Calculate fees and royalties
        (uint256 platformFee, uint256 royaltyAmount, address royaltyReceiver) = _calculateFees(
            listing.nftContract,
            listing.tokenId,
            listing.price
        );
        
        uint256 sellerAmount = listing.price - platformFee - royaltyAmount;
        
        // Transfer NFT to buyer
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );
        
        // Distribute payments
        if (platformFee > 0) {
            (bool success1, ) = payable(owner()).call{value: platformFee}("");
            require(success1, "Platform fee transfer failed");
        }
        
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            (bool success2, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            require(success2, "Royalty transfer failed");
        }
        
        (bool success3, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(success3, "Seller payment failed");
        
        emit Sale(listingId, msg.sender, listing.seller, listing.nftContract, listing.tokenId, listing.price);
    }

    // Make an offer
    function makeOffer(
        address nftContract,
        uint256 tokenId
    ) external payable nonReentrant {
        require(msg.value > 0, "Offer must be greater than 0");
        
        // Check if user already has an active offer
        Offer[] storage tokenOffers = offers[nftContract][tokenId];
        for (uint256 i = 0; i < tokenOffers.length; i++) {
            if (tokenOffers[i].buyer == msg.sender && tokenOffers[i].active) {
                revert("Already have an active offer");
            }
        }
        
        tokenOffers.push(Offer({
            buyer: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            active: true
        }));
        
        emit OfferMade(nftContract, tokenId, msg.sender, msg.value);
    }

    // Cancel an offer
    function cancelOffer(
        address nftContract,
        uint256 tokenId
    ) external nonReentrant {
        Offer[] storage tokenOffers = offers[nftContract][tokenId];
        
        for (uint256 i = 0; i < tokenOffers.length; i++) {
            if (tokenOffers[i].buyer == msg.sender && tokenOffers[i].active) {
                tokenOffers[i].active = false;
                
                // Refund the offer amount
                (bool success, ) = payable(msg.sender).call{value: tokenOffers[i].amount}("");
                require(success, "Refund failed");
                
                emit OfferCancelled(nftContract, tokenId, msg.sender);
                return;
            }
        }
        
        revert("No active offer found");
    }

    // Accept an offer
    function acceptOffer(
        address nftContract,
        uint256 tokenId,
        address buyer
    ) external nonReentrant {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );
        
        Offer[] storage tokenOffers = offers[nftContract][tokenId];
        uint256 offerIndex = type(uint256).max;
        uint256 offerAmount = 0;
        
        // Find the offer
        for (uint256 i = 0; i < tokenOffers.length; i++) {
            if (tokenOffers[i].buyer == buyer && tokenOffers[i].active) {
                offerIndex = i;
                offerAmount = tokenOffers[i].amount;
                break;
            }
        }
        
        require(offerIndex != type(uint256).max, "Offer not found");
        
        // Deactivate the offer
        tokenOffers[offerIndex].active = false;
        
        // Cancel any active listing for this NFT
        _cancelActiveListings(nftContract, tokenId);
        
        // Calculate fees and royalties
        (uint256 platformFee, uint256 royaltyAmount, address royaltyReceiver) = _calculateFees(
            nftContract,
            tokenId,
            offerAmount
        );
        
        uint256 sellerAmount = offerAmount - platformFee - royaltyAmount;
        
        // Transfer NFT to buyer
        IERC721(nftContract).safeTransferFrom(msg.sender, buyer, tokenId);
        
        // Distribute payments
        if (platformFee > 0) {
            (bool success1, ) = payable(owner()).call{value: platformFee}("");
            require(success1, "Platform fee transfer failed");
        }
        
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            (bool success2, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            require(success2, "Royalty transfer failed");
        }
        
        (bool success3, ) = payable(msg.sender).call{value: sellerAmount}("");
        require(success3, "Seller payment failed");
        
        // Cancel all other active offers for this NFT
        for (uint256 i = 0; i < tokenOffers.length; i++) {
            if (i != offerIndex && tokenOffers[i].active) {
                tokenOffers[i].active = false;
                (bool refundSuccess, ) = payable(tokenOffers[i].buyer).call{value: tokenOffers[i].amount}("");
                require(refundSuccess, "Refund failed");
            }
        }
        
        emit OfferAccepted(nftContract, tokenId, buyer, msg.sender, offerAmount);
    }

    // Get active offers for an NFT
    function getActiveOffers(
        address nftContract,
        uint256 tokenId
    ) external view returns (address[] memory buyers, uint256[] memory amounts, uint256[] memory timestamps) {
        Offer[] storage tokenOffers = offers[nftContract][tokenId];
        uint256 activeCount = 0;
        
        // Count active offers
        for (uint256 i = 0; i < tokenOffers.length; i++) {
            if (tokenOffers[i].active) {
                activeCount++;
            }
        }
        
        buyers = new address[](activeCount);
        amounts = new uint256[](activeCount);
        timestamps = new uint256[](activeCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < tokenOffers.length; i++) {
            if (tokenOffers[i].active) {
                buyers[index] = tokenOffers[i].buyer;
                amounts[index] = tokenOffers[i].amount;
                timestamps[index] = tokenOffers[i].timestamp;
                index++;
            }
        }
        
        return (buyers, amounts, timestamps);
    }

    // Get user's listings
    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }

    // Internal function to calculate fees
    function _calculateFees(
        address nftContract,
        uint256 tokenId,
        uint256 salePrice
    ) internal view returns (uint256 platformFee, uint256 royaltyAmount, address royaltyReceiver) {
        platformFee = (salePrice * platformFeeBps) / 10000;
        
        // Check for ERC2981 royalties
        try IERC2981(nftContract).royaltyInfo(tokenId, salePrice) returns (address receiver, uint256 amount) {
            royaltyReceiver = receiver;
            royaltyAmount = amount;
        } catch {
            royaltyAmount = 0;
            royaltyReceiver = address(0);
        }
        
        return (platformFee, royaltyAmount, royaltyReceiver);
    }

    // Internal function to cancel active listings
    function _cancelActiveListings(address nftContract, uint256 tokenId) internal {
        for (uint256 i = 1; i < nextListingId; i++) {
            if (listings[i].active && 
                listings[i].nftContract == nftContract && 
                listings[i].tokenId == tokenId) {
                listings[i].active = false;
                emit ListingCancelled(i);
            }
        }
    }

    // Owner functions
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = newFeeBps;
    }

    function withdrawBalance() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}