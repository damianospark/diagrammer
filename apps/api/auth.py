from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv

load_dotenv()

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 설정
SECRET_KEY = os.getenv("AUTH_SECRET", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30일

# HTTP Bearer 토큰
security = HTTPBearer()

# 테스트 모드 사용자 데이터
TEST_USERS = {
    "user@test.com": {
        "id": "test-user-001",
        "email": "user@test.com",
        "name": "테스트 사용자",
        "image": "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
        "role": "USER",
        "plan": "free",
        "status": "ACTIVE"
    },
    "pro@test.com": {
        "id": "test-user-002",
        "email": "pro@test.com",
        "name": "Pro 사용자",
        "image": "https://api.dicebear.com/7.x/avataaars/svg?seed=pro",
        "role": "USER",
        "plan": "pro",
        "status": "ACTIVE"
    },
    "admin@test.com": {
        "id": "test-admin-001",
        "email": "admin@test.com",
        "name": "관리자",
        "image": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
        "role": "ADMIN",
        "plan": "pro",
        "status": "ACTIVE"
    },
    "owner@test.com": {
        "id": "test-owner-001",
        "email": "owner@test.com",
        "name": "소유자",
        "image": "https://api.dicebear.com/7.x/avataaars/svg?seed=owner",
        "role": "OWNER",
        "plan": "team",
        "status": "ACTIVE"
    }
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """비밀번호 해싱"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """JWT 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """JWT 토큰 검증"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """현재 사용자 정보 반환"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 테스트 모드에서 사용자 정보 반환
    user = TEST_USERS.get(email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def get_current_active_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """활성 사용자만 반환"""
    if current_user.get("status") != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def require_role(required_role: str):
    """역할 기반 접근 제어"""
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_active_user)) -> Dict[str, Any]:
        user_role = current_user.get("role")
        
        # 역할 계층: OWNER > ADMIN > USER
        role_hierarchy = {"USER": 1, "ADMIN": 2, "OWNER": 3}
        user_level = role_hierarchy.get(user_role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        return current_user
    
    return role_checker

# 편의 함수들
require_admin = require_role("ADMIN")
require_owner = require_role("OWNER")
