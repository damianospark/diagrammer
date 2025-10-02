from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import traceback
from routes import router
from auth_routes import router as auth_router
from stripe_routes import router as stripe_router
from admin_routes import router as admin_router
from session_routes import router as session_router
from task_routes import router as task_router
from user_routes import router as user_router
from search_routes import router as search_router
# 로깅 설정 추가
from logging_config import logger
# print 함수 로깅 추가
import console_logger

# FastAPI 앱 생성
app = FastAPI(title="Diagrammer API", description="AI 기반 다이어그램 생성 및 편집 API", version="0.1.0")

# 예외 처리 미들웨어
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception on {request.method} {request.url}: {str(exc)}")
    logger.error(f"Exception traceback: {traceback.format_exc()}")
    
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# 요청 로깅 미들웨어
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"Response: {request.method} {request.url} - Status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {request.method} {request.url} - Error: {str(e)}")
        raise

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
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(stripe_router, prefix="/api/stripe", tags=["stripe"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(session_router, prefix="/api/sessions", tags=["sessions"])
app.include_router(task_router, prefix="/api/tasks", tags=["tasks"])
app.include_router(user_router, prefix="/api/users", tags=["users"])
app.include_router(search_router, prefix="/api/search", tags=["search"])

@app.get("/healthz")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "healthy"}

if __name__ == "__main__":
    logger.info("Starting Diagrammer API server...")
    try:
        # uv 환경에서 실행되도록 설정
        # 참고: uvicorn은 reload 사용 시 import string("module:app") 형태를 권장합니다.
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        logger.error(f"Server startup traceback: {traceback.format_exc()}")
        raise
