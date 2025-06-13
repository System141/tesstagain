# URGENT: VPS Marketplace Contract Fix

## Problem
"Marketplace Contract Not Deployed" hatası devam ediyor.

## Çözüm Adımları

VPS'e SSH ile bağlanın ve aşağıdaki komutları sırayla çalıştırın:

```bash
# 1. Proje dizinine gidin
cd /root/tesstagain

# 2. Son güncellemeleri çekin
git pull origin vpstest

# 3. Frontend .env.local dosyasını kontrol edin
cat frontend/.env.local

# 4. Marketplace adresini güncelleyin (eğer hala eski adres varsa)
cd frontend
nano .env.local
# NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x1622153c03dD0882376A36142664c212f369990a
# olarak güncelleyin

# 5. Docker container'ları yeniden başlatın
cd ..
docker-compose down
docker-compose up -d --build

# 6. Container loglarını kontrol edin
docker logs tesstagain-frontend-1

# 7. Test edin
curl -I http://localhost:3000
```

## Önemli Bilgiler

- **Yeni Marketplace Contract Adresi**: `0x1622153c03dD0882376A36142664c212f369990a`
- **Eski (yanlış) adres**: `0x5FbDB2315678afecb367f032d93F642f64180aa3` veya `0xe553934B8AD246a45785Ea080d53024aAbd39189`

## Alternatif Çözüm

Eğer yukarıdaki adımlar işe yaramazsa:

```bash
# Docker image'ı tamamen temizleyin ve yeniden build edin
docker-compose down
docker system prune -af
docker-compose build --no-cache
docker-compose up -d
```

## Kontrol

Deploy sonrası http://195.26.249.142:3000 adresinde "Marketplace Contract Not Deployed" hatası görünmemelidir.