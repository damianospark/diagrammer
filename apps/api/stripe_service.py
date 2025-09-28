import logging
from typing import Dict, Any, Optional
from datetime import datetime
import stripe
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Stripe 설정
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_...")

class StripeService:
    """Stripe 결제 서비스"""
    
    def __init__(self):
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_...")
        self.price_pro_monthly = os.getenv("STRIPE_PRICE_PRO_MONTHLY", "price_...")
        self.price_team_monthly = os.getenv("STRIPE_PRICE_TEAM_MONTHLY", "price_...")
        self.portal_return_url = os.getenv("STRIPE_PORTAL_RETURN_URL", "https://diagrammer.realstory.blog/settings")
    
    async def create_checkout_session(self, user_id: str, user_email: str, 
                                    plan: str = "pro") -> Dict[str, Any]:
        """체크아웃 세션 생성"""
        try:
            # 플랜별 가격 ID 선택
            price_id = self.price_pro_monthly if plan == "pro" else self.price_team_monthly
            
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{self.portal_return_url}?success=true",
                cancel_url=f"{self.portal_return_url}?canceled=true",
                customer_email=user_email,
                client_reference_id=user_id,
                metadata={
                    'user_id': user_id,
                    'plan': plan
                }
            )
            
            return {
                "success": True,
                "session_id": session.id,
                "url": session.url
            }
            
        except Exception as e:
            logger.error(f"Stripe checkout session creation failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def create_portal_session(self, customer_id: str) -> Dict[str, Any]:
        """고객 포털 세션 생성"""
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=self.portal_return_url
            )
            
            return {
                "success": True,
                "url": session.url
            }
            
        except Exception as e:
            logger.error(f"Stripe portal session creation failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_webhook(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """웹훅 이벤트 처리"""
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            
            if event['type'] == 'checkout.session.completed':
                return await self._handle_checkout_completed(event['data']['object'])
            elif event['type'] == 'customer.subscription.updated':
                return await self._handle_subscription_updated(event['data']['object'])
            elif event['type'] == 'customer.subscription.deleted':
                return await self._handle_subscription_deleted(event['data']['object'])
            else:
                return {
                    "success": True,
                    "message": f"Unhandled event type: {event['type']}"
                }
                
        except Exception as e:
            logger.error(f"Webhook handling failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _handle_checkout_completed(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """체크아웃 완료 처리"""
        try:
            user_id = session.get('client_reference_id')
            customer_id = session.get('customer')
            plan = session.get('metadata', {}).get('plan', 'pro')
            
            # TODO: 사용자 구독 정보 업데이트
            logger.info(f"Checkout completed: user_id={user_id}, customer_id={customer_id}, plan={plan}")
            
            return {
                "success": True,
                "message": "Checkout completed",
                "user_id": user_id,
                "customer_id": customer_id,
                "plan": plan
            }
            
        except Exception as e:
            logger.error(f"Checkout completion handling failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _handle_subscription_updated(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """구독 업데이트 처리"""
        try:
            customer_id = subscription.get('customer')
            status = subscription.get('status')
            plan = subscription.get('items', {}).get('data', [{}])[0].get('price', {}).get('id')
            
            # TODO: 구독 상태 업데이트
            logger.info(f"Subscription updated: customer_id={customer_id}, status={status}, plan={plan}")
            
            return {
                "success": True,
                "message": "Subscription updated",
                "customer_id": customer_id,
                "status": status,
                "plan": plan
            }
            
        except Exception as e:
            logger.error(f"Subscription update handling failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _handle_subscription_deleted(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """구독 삭제 처리"""
        try:
            customer_id = subscription.get('customer')
            
            # TODO: 구독 취소 처리
            logger.info(f"Subscription deleted: customer_id={customer_id}")
            
            return {
                "success": True,
                "message": "Subscription deleted",
                "customer_id": customer_id
            }
            
        except Exception as e:
            logger.error(f"Subscription deletion handling failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

# 전역 Stripe 서비스 인스턴스
stripe_service = StripeService()
