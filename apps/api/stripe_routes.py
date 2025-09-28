from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Dict, Any
import logging
from stripe_service import stripe_service
from auth import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/checkout/session")
async def create_checkout_session(
    request: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """체크아웃 세션 생성"""
    try:
        plan = request.get("plan", "pro")
        user_id = current_user["id"]
        user_email = current_user["email"]
        
        result = await stripe_service.create_checkout_session(
            user_id=user_id,
            user_email=user_email,
            plan=plan
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"Checkout session creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/portal/session")
async def create_portal_session(
    request: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """고객 포털 세션 생성"""
    try:
        customer_id = request.get("customer_id")
        if not customer_id:
            raise HTTPException(status_code=400, detail="customer_id is required")
        
        result = await stripe_service.create_portal_session(customer_id)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"Portal session creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Stripe 웹훅 처리"""
    try:
        payload = await request.body()
        signature = request.headers.get("stripe-signature")
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        
        result = await stripe_service.handle_webhook(payload, signature)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"Webhook handling failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
