from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import timedelta
from auth import (
    create_access_token, 
    verify_token, 
    get_current_user, 
    get_current_active_user,
    TEST_USERS
)

router = APIRouter()
security = HTTPBearer()

class LoginRequest(BaseModel):
    email: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    image: Optional[str]
    role: str
    plan: str
    status: str

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """테스트 모드 로그인"""
    email = request.email
    
    # 테스트 사용자 확인
    user = TEST_USERS.get(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test user not found"
        )
    
    # 비활성 사용자 확인
    if user.get("status") != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active"
        )
    
    # JWT 토큰 생성
    access_token_expires = timedelta(days=30)
    access_token = create_access_token(
        data={"sub": email}, expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_active_user)):
    """현재 사용자 정보 조회"""
    return UserResponse(**current_user)

@router.put("/me", response_model=UserResponse)
async def update_current_user_info(
    request: dict,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """현재 사용자 정보 업데이트"""
    # TODO: 실제 데이터베이스 업데이트 로직 구현
    # 현재는 테스트용으로 사용자 정보를 그대로 반환
    updated_user = current_user.copy()
    
    if "name" in request and request["name"] is not None:
        updated_user["name"] = request["name"]
    if "image" in request and request["image"] is not None:
        updated_user["image"] = request["image"]
    
    return UserResponse(**updated_user)

@router.get("/users")
async def get_test_users():
    """테스트 사용자 목록 조회"""
    return {
        "success": True,
        "users": list(TEST_USERS.values()),
        "total": len(TEST_USERS)
    }

@router.post("/logout")
async def logout():
    """로그아웃 (클라이언트에서 토큰 삭제)"""
    return {"message": "Logged out successfully"}

@router.get("/verify")
async def verify_token_endpoint(current_user: Dict[str, Any] = Depends(get_current_active_user)):
    """토큰 검증"""
    return {
        "valid": True,
        "user": current_user
    }
