from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routes import router

# FastAPI 앱 생성
app = FastAPI(title="Diagrammer API", description="AI 기반 다이어그램 생성 및 편집 API", version="0.1.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경에서는 모든 오리진 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 포함
app.include_router(router, prefix="/api/v1")

@app.get("/healthz")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    print("Starting Diagrammer API server...")
    # 항상 reload=True로 실행되도록 import string 형태로 지정
    # 참고: uvicorn은 reload 사용 시 import string("module:app") 형태를 권장합니다.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
