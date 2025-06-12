# 🚀 NFT Marketplace Deploy - Basit Rehber

## Adım 1: Sepolia ETH Alın (Ücretsiz)

Bu sitelerden birinden test ETH alın:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

## Adım 2: Private Key'inizi Alın

1. MetaMask açın
2. Üç nokta → Hesap detayları → Özel anahtarı dışa aktar
3. Şifrenizi girin ve kopyalayın

⚠️ **UYARI**: Sadece test wallet kullanın!

## Adım 3: .env Dosyasını Güncelleyin

```bash
# .env dosyasını açın
nano .env

# Bu satırı bulun ve güncelleyin:
PRIVATE_KEY=buraya_private_key_yazin
```

## Adım 4: Deploy Edin

```bash
# Option A: Interaktif deployment (kolay)
npx hardhat run deploy-marketplace-interactive.js

# Option B: Direkt deployment
npx hardhat run deploy-marketplace.js --network sepolia
```

## Adım 5: VPS'i Güncelleyin

Deploy başarılı olduktan sonra verilen adresi kopyalayın ve:

```bash
# frontend/.env.local dosyasını güncelleyin
NEXT_PUBLIC_MARKETPLACE_ADDRESS=yeni_adres_buraya

# VPS'e deploy edin
./deploy.sh
```

## 🎉 Tamamlandı!

Marketplace'iniz artık çalışıyor. Test etmek için:
1. http://195.26.249.142:3000 adresine gidin
2. Wallet bağlayın
3. NFT alım-satım yapın

## Sorun mu var?

**"insufficient funds" hatası:**
→ Wallet'ınıza Sepolia ETH ekleyin

**"invalid private key" hatası:**
→ Private key'in 0x ile başladığından emin olun

**Başka sorun:**
→ deploy-marketplace-interactive.js kullanın, size yardımcı olacak