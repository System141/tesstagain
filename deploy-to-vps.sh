#!/bin/bash

# VPS'e deployment script
VPS_USER="system141"
VPS_HOST="195.26.249.12"
VPS_PASSWORD="261195"

echo "🚀 VPS'e deployment başlatılıyor..."

# 1. Lokal değişiklikleri commit et
echo "📝 Değişiklikleri commit ediliyor..."
git add .
git commit -m "Fix marketplace environment variables and deployment"

# 2. VPS'e bağlan ve deployment yap
echo "🔗 VPS'e bağlanılıyor..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
    cd /opt/tesstagain || cd /home/system141/tesstagain || cd tesstagain
    
    echo "📥 Son değişiklikleri çekiliyor..."
    git pull origin vpstest || git pull origin master || git pull
    
    echo "🔧 .env.local dosyasını güncelliyoring..."
    cd frontend
    
    # Marketplace address'i uncomment et
    sed -i 's/# NEXT_PUBLIC_MARKETPLACE_ADDRESS=/NEXT_PUBLIC_MARKETPLACE_ADDRESS=/' .env.local
    sed -i 's/your_deployed_marketplace_address_here/0xe553934B8AD246a45785Ea080d53024aAbd39189/' .env.local
    
    echo "🏗️ Docker container'ları yeniden build ediliyor..."
    cd ..
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    echo "✅ Deployment tamamlandı!"
    echo "🌐 Uygulama http://195.26.249.142:3000 adresinde aktif"
    
    # Container durumunu kontrol et
    docker ps
EOF

echo "🎉 VPS deployment tamamlandı!"