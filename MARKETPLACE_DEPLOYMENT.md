# 🚀 Marketplace Contract Deployment Guide

Bu guide, NFT Marketplace contract'ını Sepolia testnet'e deploy etmenize yardımcı olacak.

## 📋 Önkoşullar

### 1. Sepolia ETH Edinin
- [Sepolia Faucet](https://sepoliafaucet.com/) adresinden test ETH alın
- En az 0.01 ETH'niz olması yeterli

### 2. RPC URL Alın
**Ücretsiz Seçenekler:**
- **Infura**: https://infura.io/ (hesap oluşturun, proje oluşturun)
- **Alchemy**: https://alchemy.com/ (hesap oluşturun, app oluşturun)  
- **Public RPC**: `https://sepolia.drpc.org` (hesap gerektirmez)

### 3. Private Key'inizi Alın
- MetaMask → Hesap → Account details → Export private key
- ⚠️ **DİKKAT**: Sadece test wallet kullanın, asla mainnet wallet'ınızın private key'ini kullanmayın!

## 🔧 Deployment Adımları

### Adım 1: Environment Dosyasını Güncelleyin
`.env` dosyasını düzenleyin:

```bash
# Gerçek değerlerle değiştirin
SEPOLIA_RPC_URL=https://sepolia.drpc.org  # veya kendi RPC URL'niz
PRIVATE_KEY=0x_your_private_key_here      # 0x ile başlamalı
ETHERSCAN_API_KEY=your_etherscan_api_key  # (opsiyonel)
```

### Adım 2: Contract'ı Deploy Edin

```bash
# Proje klasöründe
cd /path/to/tesstagain

# Deploy işlemini başlatın (Ethers v6 uyumlu)
npx hardhat run scripts/deploy-marketplace-v6.js --network sepolia

# Alternatif olarak (legacy script)
npx hardhat run scripts/deploy-marketplace-legacy.js --network sepolia
```

### Adım 3: Deployment Çıktısını Kaydedin
Deploy başarılı olursa şu şekilde bir çıktı alacaksınız:

```
NFT Marketplace deployed to: 0x1234567890123456789012345678901234567890
=============================================================
IMPORTANT: Save this address!
Add this to your frontend/.env.local:
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x1234567890123456789012345678901234567890
=============================================================
```

### Adım 4: Frontend'i Güncelleyin
`frontend/.env.local` dosyasına deploy edilen adresi ekleyin:

```bash
# Deploy edilen gerçek adresi kullanın
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x1234567890123456789012345678901234567890
```

### Adım 5: Uygulamayı Yeniden Başlatın

```bash
# Development için
npm run dev

# Veya production build
npm run build && npm start
```

## 🎯 Alternatif Deployment Yöntemleri

### Yöntem 1: Remix IDE (Kolay)
1. [Remix Ethereum IDE](https://remix.ethereum.org/) açın
2. `contracts/NFTMarketplace.sol` dosyasını upload edin
3. Solidity derleyici ile compile edin (0.8.20)
4. "Deploy & Run" sekmesinde:
   - Environment: "Injected Provider - MetaMask"
   - Network: Sepolia seçin
   - Deploy butonuna tıklayın
5. Deploy edilen contract adresini kopyalayın

### Yöntem 2: Hardhat Console
```bash
npx hardhat console --network sepolia
> const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
> const marketplace = await NFTMarketplace.deploy();
> await marketplace.deployed();
> console.log("Deployed to:", marketplace.address);
```

## 🔍 Deploy Doğrulama

Deploy başarılı olduktan sonra:

1. **Etherscan'da Kontrol Edin**:
   - https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

2. **Uygulama'da Test Edin**:
   - Marketplace sekmesine gidin
   - "Marketplace Contract Not Deployed" hatası kaybolmalı
   - NFT listing/trading özellikleri aktif olmalı

## ❗ Sorun Giderme

### "Insufficient funds" Hatası
```
💡 Çözüm: Sepolia ETH edinin
   → https://sepoliafaucet.com/
```

### "Invalid project id" Hatası  
```
💡 Çözüm: RPC URL'nizi kontrol edin
   → .env dosyasındaki SEPOLIA_RPC_URL doğru mu?
```

### "Nonce too high" Hatası
```
💡 Çözüm: MetaMask'ı reset edin
   → Settings → Advanced → Reset Account
```

### "Gas estimation failed" Hatası
```
💡 Çözüm: Gas limit artırın
   → hardhat.config.js'de gas: 3000000 ekleyin
```

## 📞 Yardım

Sorunlarınız için:
- GitHub Issues: Project repository
- Documentation: DEPLOYMENT.md
- Marketplace Guide: Bu dosya

Deploy işlemi tamamlandıktan sonra Jugiter NFT Marketplace tam olarak çalışacak! 🎉