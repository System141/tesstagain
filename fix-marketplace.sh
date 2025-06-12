#!/bin/bash

# Fix Marketplace Contract Address on VPS

echo "🔧 Marketplace Contract Fix Script"
echo "================================"
echo ""
echo "VPS üzerinde çalıştırılacak komutlar:"
echo ""

cat << 'COMMANDS'
# 1. SSH ile bağlan:
ssh system141@195.26.249.142
# Şifre: 261195

# 2. Proje dizinine git:
cd /home/system141/tesstagain/frontend

# 3. .env.local dosyasını kontrol et:
cat .env.local

# 4. .env.local dosyasını düzenle:
sudo nano .env.local

# Aşağıdaki satırları ekle/düzenle (# işaretini kaldır):
NEXT_PUBLIC_PINATA_API_KEY=dummy_key_for_testing
NEXT_PUBLIC_PINATA_SECRET_KEY=dummy_secret_for_testing  
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0xe553934B8AD246a45785Ea080d53024aAbd39189

# Ctrl+X, Y, Enter ile kaydet

# 5. Alternatif: Otomatik düzenleme
sudo bash -c 'cat > .env.local << EOF
# Pinata IPFS Configuration
NEXT_PUBLIC_PINATA_API_KEY=dummy_key_for_testing
NEXT_PUBLIC_PINATA_SECRET_KEY=dummy_secret_for_testing

# Marketplace Contract Address
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0xe553934B8AD246a45785Ea080d53024aAbd39189
EOF'

# 6. Dosya içeriğini kontrol et:
cat .env.local

# 7. Docker container'ları yeniden başlat:
cd ..
sudo docker-compose down
sudo docker-compose up -d --build

# 8. Container loglarını kontrol et:
sudo docker logs jugiter-frontend --tail 50

# 9. Container'a gir ve environment değişkenlerini kontrol et:
sudo docker exec jugiter-frontend env | grep MARKETPLACE

# 10. Tarayıcıda test et:
# http://195.26.249.142:3000
COMMANDS

echo ""
echo "================================"
echo "Bu komutları sırayla VPS'de çalıştırın."