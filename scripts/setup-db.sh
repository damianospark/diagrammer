#!/bin/bash

# Diagrammer Database Setup Script

set -e

echo "🚀 Diagrammer Database Setup 시작..."

# Docker Compose로 PostgreSQL과 Redis 시작
echo "📦 Docker 컨테이너 시작 중..."
docker-compose up -d

# 컨테이너가 준비될 때까지 대기
echo "⏳ PostgreSQL 컨테이너 준비 대기 중..."
until docker exec diagrammer-postgres pg_isready -U diagrammer -d diagrammer; do
  echo "PostgreSQL이 아직 준비되지 않았습니다. 5초 후 다시 시도합니다..."
  sleep 5
done

echo "✅ PostgreSQL이 준비되었습니다!"

# Redis 컨테이너 준비 대기
echo "⏳ Redis 컨테이너 준비 대기 중..."
until docker exec diagrammer-redis redis-cli ping; do
  echo "Redis가 아직 준비되지 않았습니다. 5초 후 다시 시도합니다..."
  sleep 5
done

echo "✅ Redis가 준비되었습니다!"

# Prisma 마이그레이션 실행
echo "🔄 Prisma 마이그레이션 실행 중..."
cd apps/web
npx prisma migrate dev --name init
npx prisma generate

echo "🎉 데이터베이스 설정이 완료되었습니다!"
echo ""
echo "📊 데이터베이스 정보:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Database: diagrammer"
echo "  - Username: diagrammer"
echo "  - Password: diagrammer123"
echo ""
echo "🔗 Redis 정보:"
echo "  - Redis: localhost:6379"
echo ""
echo "💡 다음 단계:"
echo "  1. apps/web/.env.local 파일을 생성하고 DATABASE_URL을 설정하세요"
echo "  2. npm run dev:web으로 개발 서버를 시작하세요"
