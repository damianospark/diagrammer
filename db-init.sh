#!/bin/bash

echo "🚀 Diagrammer Database Setup 문제 해결 시작..."

# 1. 환경변수 파일 생성
echo "🔧 환경변수 파일 생성 중..."
echo "DATABASE_URL=postgresql://diagrammer:diagrammer123@localhost:5432/diagrammer" > apps/web/.env

# 2. Prisma 마이그레이션 리셋
echo "🗑️ 기존 데이터베이스 스키마 리셋 중..."
cd apps/web
npx prisma migrate reset --force

# 3. 새로운 마이그레이션 생성 및 적용
echo "🔄 새로운 마이그레이션 생성 및 적용 중..."
npx prisma migrate dev --name init_schema --skip-generate

# 4. 클라이언트 생성
echo "🔨 Prisma 클라이언트 생성 중..."
npx prisma generate

# 5. 연결 테스트
echo "✅ 데이터베이스 연결 테스트 중..."
npx prisma studio &

echo "🎉 데이터베이스 설정이 완료되었습니다!"
echo "📊 Prisma Studio가 http://localhost:5555 에서 실행 중입니다."