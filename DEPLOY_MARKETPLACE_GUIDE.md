# 🚀 NFT Marketplace Deploy Rehberi

## Önkoşullar

1. **Sepolia ETH Edinin** (Ücretsiz)
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://faucet.quicknode.com/ethereum/sepolia
   - https://sepolia-faucet.pk910.de/ (Mining PoW faucet)

2. **Private Key Alın**
   - MetaMask açın
   - Hesap detayları → Private Key'i dışa aktar
   - ⚠️ SADECE TEST WALLET KULLANIN!

3. **.env Dosyasını Güncelleyin**
   ```bash
   # .env dosyasını düzenleyin
   nano .env
   
   # Şu değerleri güncelleyin:
   SEPOLIA_RPC_URL=https://sepolia.drpc.org
   PRIVATE_KEY=your_actual_private_key_here
   ETHERSCAN_API_KEY=your_etherscan_api_key (opsiyonel)
   ```

## Deploy Adımları

```bash
# 1. Dependencies yükleyin (eğer yüklü değilse)
npm install

# 2. Contract'ları compile edin
npx hardhat compile

# 3. Marketplace'i deploy edin
npx hardhat run deploy-marketplace.js --network sepolia
```

## Deploy Sonrası

1. **Frontend .env.local Güncelleyin**
   ```bash
   cd frontend
   nano .env.local
   
   # Deploy edilen adresi ekleyin:
   NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x_deployed_address_here
   ```

2. **VPS'e Deploy Edin**
   ```bash
   ./deploy.sh
   ```

## Test İşlemleri

Deploy edilen marketplace'i test etmek için:

1. http://195.26.249.142:3000 adresine gidin
2. Wallet bağlayın (MetaMask)
3. Trade/Marketplace sekmesine tıklayın
4. NFT listeleme ve alım-satım özelliklerini test edin

## Sorun Giderme

**"insufficient funds" hatası:**
- Wallet'ınıza Sepolia ETH ekleyin
- En az 0.01 ETH olması önerilir

**"invalid private key" hatası:**
- Private key'in 0x ile başladığından emin olun
- 64 karakter uzunluğunda olmalı (0x hariç)

**"nonce too high" hatası:**
- MetaMask'ta Settings → Advanced → Reset Account

## Güvenlik Notları

⚠️ **ÖNEMLİ:**
- Private key'inizi asla paylaşmayın
- .env dosyasını git'e commit etmeyin
- Sadece testnet wallet'ları kullanın
- Production için ayrı deployment wallet kullanın