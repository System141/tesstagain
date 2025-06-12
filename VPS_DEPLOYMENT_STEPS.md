# 🚀 VPS Manual Deployment Adımları

## Marketplace "Contract Not Deployed" Hatası Çözümü

### 1. VPS'e SSH ile Bağlanın
```bash
ssh system141@195.26.249.12
# Şifre: 261195
```

### 2. Proje Dizinine Gidin
```bash
cd /opt/tesstagain || cd /home/system141/tesstagain || cd tesstagain
```

### 3. Son Değişiklikleri Çekin
```bash
git pull origin vpstest
# veya
git pull origin master
```

### 4. .env.local Dosyasını Düzenleyin
```bash
cd frontend
nano .env.local
```

**Bu satırı bulun:**
```bash
# NEXT_PUBLIC_MARKETPLACE_ADDRESS=your_deployed_marketplace_address_here
```

**Şu şekilde değiştirin:**
```bash
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0xe553934B8AD246a45785Ea080d53024aAbd39189
```

### 5. Docker Container'ları Yeniden Build Edin
```bash
cd ..  # Ana proje dizinine dönün
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 6. Deployment'ı Doğrulayın
```bash
docker ps
curl -I http://localhost:3000
```

### 7. Tarayıcıda Test Edin
- http://195.26.249.142:3000 adresine gidin
- Trade sekmesine tıklayın
- "Marketplace Contract Not Deployed" hatası kaybolmalı

## Alternatif Hızlı Çözüm

Eğer yukarıdaki adımlar çalışmazsa:

```bash
# Tek komutla .env.local'i güncelle
cd frontend
sed -i 's/# NEXT_PUBLIC_MARKETPLACE_ADDRESS=/NEXT_PUBLIC_MARKETPLACE_ADDRESS=/' .env.local
sed -i 's/your_deployed_marketplace_address_here/0xe553934B8AD246a45785Ea080d53024aAbd39189/' .env.local

# Docker'ı yeniden başlat
cd ..
docker-compose restart
```

## Kontrol Komutları

```bash
# Environment değişkeninin yüklendiğini kontrol et
docker exec -it tesstagain-frontend-1 env | grep MARKETPLACE

# Container loglarını kontrol et
docker logs tesstagain-frontend-1

# Uygulama durumunu kontrol et
curl http://localhost:3000/api/health
```