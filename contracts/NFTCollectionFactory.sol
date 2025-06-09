// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

// NFT Collection contract template
contract NFTCollection is ERC721, Ownable, IERC2981 {
    using Strings for uint256;
    
    string public baseURI;
    uint256 public maxSupply;
    uint256 public mintPrice; // Public mint price
    uint256 public maxPerWallet;
    uint256 public totalSupply;
    bool public isRevealed;

    // Allowlist Stage
    uint256 public allowlistMintPrice;
    uint256 public allowlistEndTime;
    mapping(address => bool) public isAllowlisted;
    mapping(address => uint256) public allowlistClaimed;
    uint256 public maxPerAllowlistWallet; // Can be different from general maxPerWallet
    bool public allowlistActive;
    
    // Royalty Info (EIP-2981)
    address private _royaltyRecipient;
    uint96 private _royaltyBps; // Basis points (örn: %5 için 500)
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initialBaseURI,
        uint256 _maxSupply,
        uint256 _publicMintPrice, // Renamed for clarity
        uint256 _maxPerWallet,
        address initialOwner,
        // Allowlist parameters
        uint256 _allowlistMintPrice,
        uint256 _allowlistDurationSeconds,
        address[] memory _allowlistedAddresses,
        uint256 _maxPerAllowlistWallet,
        address royaltyRecipientAddress, // Royalty alıcısı
        uint96 royaltyBpsValue          // Royalty oranı (basis points)
    ) ERC721(_name, _symbol) Ownable(initialOwner) {
        baseURI = _initialBaseURI;
        maxSupply = _maxSupply;
        mintPrice = _publicMintPrice;
        maxPerWallet = _maxPerWallet;

        if (_allowlistDurationSeconds > 0 && _allowlistedAddresses.length > 0) {
            allowlistActive = true;
            allowlistMintPrice = _allowlistMintPrice;
            allowlistEndTime = block.timestamp + _allowlistDurationSeconds;
            maxPerAllowlistWallet = _maxPerAllowlistWallet;
            for (uint256 i = 0; i < _allowlistedAddresses.length; i++) {
                isAllowlisted[_allowlistedAddresses[i]] = true;
            }
        }

        _royaltyRecipient = royaltyRecipientAddress;
        _royaltyBps = royaltyBpsValue;
    }
    
    function mint(uint256 quantity) external payable {
        require(totalSupply + quantity <= maxSupply, "Exceeds max supply");

        if (allowlistActive && block.timestamp < allowlistEndTime) {
            // Allowlist Minting
            require(isAllowlisted[msg.sender], "Not on allowlist");
            require(msg.value >= allowlistMintPrice * quantity, "Insufficient payment for allowlist");
            require(allowlistClaimed[msg.sender] + quantity <= maxPerAllowlistWallet, "Exceeds max per allowlist wallet");
            
            allowlistClaimed[msg.sender] += quantity;
        } else {
            // Public Minting
            if (allowlistActive && block.timestamp >= allowlistEndTime) {
                // Allowlist period has ended, transition to public.
                // Consider if allowlistActive should be set to false here or by owner.
                // For now, it just means allowlist price/rules no longer apply.
            }
            require(msg.value >= mintPrice * quantity, "Insufficient payment for public mint");
            require(balanceOf(msg.sender) + quantity <= maxPerWallet, "Exceeds max per wallet for public mint");
        }
        
        for(uint256 i = 0; i < quantity; i++) {
            _safeMint(msg.sender, totalSupply + i + 1); 
        }
        totalSupply += quantity;
    }
    
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }
    
    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    function contractURI() public view returns (string memory) {
        // Consider if baseURI should end with '/' for concatenation
        return string(abi.encodePacked(baseURI, "collection.json")); // Common practice for collection metadata
    }

    // --- Allowlist Management Functions (Owner only) ---
    function updateAllowlist(address[] calldata _addresses, bool[] calldata _isAllowed) external onlyOwner {
        require(_addresses.length == _isAllowed.length, "Array lengths mismatch");
        for (uint i = 0; i < _addresses.length; i++) {
            isAllowlisted[_addresses[i]] = _isAllowed[i];
        }
    }

    function setAllowlistEndTime(uint256 _newEndTime) external onlyOwner {
        allowlistEndTime = _newEndTime;
    }

    function toggleAllowlist(bool _active) external onlyOwner {
        allowlistActive = _active;
    }
     function setAllowlistMintPrice(uint256 _newPrice) external onlyOwner {
        allowlistMintPrice = _newPrice;
    }

    function setMaxPerAllowlistWallet(uint256 _max) external onlyOwner {
        maxPerAllowlistWallet = _max;
    }

    // --- EIP-2981 Royalty Standard --- 
    function royaltyInfo(
        uint256, /*tokenId*/
        uint256 _salePrice
    ) external view override returns (address receiver, uint256 royaltyAmount) {
        if (_royaltyRecipient == address(0) || _royaltyBps == 0) {
            return (address(0), 0);
        }
        receiver = _royaltyRecipient;
        royaltyAmount = (_salePrice * _royaltyBps) / 10000;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}

// Factory contract to create new NFT collections
contract NFTCollectionFactory {
    event CollectionCreated(address indexed collectionAddress, string name, string symbol, address indexed owner);
    
    function createCollection(
        string memory name,
        string memory symbol,
        string memory baseURI,
        uint256 maxSupply,
        uint256 publicMintPrice, // Renamed for clarity
        uint256 maxPerWallet,
        uint256 allowlistMintPrice,
        uint256 allowlistDurationSeconds,
        address[] memory allowlistedAddresses,
        uint256 maxPerAllowlistWallet,
        uint96 royaltyBps // Yeni royalty parametresi
    ) external returns (address) {
        NFTCollection newCollection = new NFTCollection(
            name,
            symbol,
            baseURI,
            maxSupply,
            publicMintPrice,
            maxPerWallet,
            msg.sender, // initialOwner
            allowlistMintPrice,
            allowlistDurationSeconds,
            allowlistedAddresses,
            maxPerAllowlistWallet,
            msg.sender, // royaltyRecipientAddress (koleksiyon sahibi)
            royaltyBps  // royaltyBpsValue
        );
        
        emit CollectionCreated(address(newCollection), name, symbol, msg.sender);
        return address(newCollection);
    }
} 