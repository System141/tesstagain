#!/bin/bash

# 🚀 Simple SSH VPS Deployment Script
# Kullanım: ./deploy.sh

VPS_USER="root"
VPS_HOST="195.26.249.142"
VPS_PASSWORD="10291029aA."

echo "🚀 VPS Deployment başlatılıyor..."

# 1. Local değişiklikleri commit et
echo "📝 Local değişiklikleri commit ediliyor..."
git add .
git commit -m "Cleanup: Remove unused files and optimize codebase for production"

# 2. VPS'e SSH bağlantısı için gerekli komutları hazırla
echo "🔗 VPS deployment komutları:"
echo ""
echo "SSH ile bağlanmak için:"
echo "ssh $VPS_USER@$VPS_HOST"
echo ""
echo "VPS'de çalıştırılacak komutlar:"
echo "================================"
echo "cd /opt/tesstagain || cd /home/system141/tesstagain || cd tesstagain"
echo "git pull origin vpstest"
echo ""
echo "# .env.local'i düzelt:"
echo "cd frontend"
echo "sed -i 's/# NEXT_PUBLIC_MARKETPLACE_ADDRESS=/NEXT_PUBLIC_MARKETPLACE_ADDRESS=/' .env.local"
echo "sed -i 's/your_deployed_marketplace_address_here/0x1622153c03dD0882376A36142664c212f369990a/' .env.local"
echo ""
echo "# Docker'ı yeniden başlat:"
echo "cd .."
echo "docker-compose down"
echo "docker-compose build --no-cache"
echo "docker-compose up -d"
echo ""
echo "# Kontrol et:"
echo "docker ps"
echo "curl -I http://localhost:3000"
echo "================================"
echo ""
echo "💡 Manuel SSH deployment için yukarıdaki komutları VPS'de çalıştırın."

# 3. Sshpass varsa otomatik deployment yap
if command -v sshpass &> /dev/null; then
    echo "🔄 Otomatik deployment başlatılıyor..."
    
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
        # Önce doğru dizini bul
        if [ -d "/root/tesstagain" ]; then
            cd /root/tesstagain
        elif [ -d "/home/system141/tesstagain" ]; then
            cd /home/system141/tesstagain
        elif [ -d "/opt/tesstagain" ]; then
            cd /opt/tesstagain
        else
            echo "❌ Proje dizini bulunamadı!"
            exit 1
        fi
        
        echo "📥 Git pull yapılıyor..."
        git fetch origin
        git checkout vpstest
        git reset --hard origin/vpstest
        
        echo "🔧 .env.local güncelleniyor..."
        cd frontend
        sed -i 's/# NEXT_PUBLIC_MARKETPLACE_ADDRESS=/NEXT_PUBLIC_MARKETPLACE_ADDRESS=/' .env.local
        sed -i 's/your_deployed_marketplace_address_here/0x1622153c03dD0882376A36142664c212f369990a/' .env.local
        
        echo "🏗️ Docker container'ları yeniden build ediliyor..."
        cd ..
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        
        echo "✅ Deployment tamamlandı!"
        docker ps
EOF
    echo "🎉 Otomatik deployment tamamlandı!"
else
    echo "⚠️ sshpass bulunamadı. Manuel SSH deployment gerekiyor."
fi

echo ""
echo "🌐 Test için: http://195.26.249.142:3000"