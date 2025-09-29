from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import uuid
import logging
import os
from models import (
    Base, User, Session as DBSession, Prompt, Task, TaskMessage, TaskVersion,
    Visitor, Diagram, Export, Subscription, Payment, Share, SearchIndex
)

logger = logging.getLogger(__name__)

class PostgreSQLDatabase:
    def __init__(self, database_url: str = None):
        if database_url is None:
            database_url = os.getenv(
                "DATABASE_URL", 
                "postgresql://diagrammer:diagrammer123@localhost:5432/diagrammer"
            )
        
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # 테이블 생성
        Base.metadata.create_all(bind=self.engine)
        logger.info("PostgreSQL database initialized")

    def get_db(self) -> Session:
        """데이터베이스 세션 반환"""
        db = self.SessionLocal()
        try:
            return db
        finally:
            pass

    # User methods
    async def create_user(self, email: str, name: str, image: str = "", 
                         role: str = "USER", plan: str = "free", 
                         status: str = "ACTIVE", locale: str = "ko", 
                         currency: str = "KRW") -> User:
        """새 사용자 생성"""
        db = self.get_db()
        try:
            user = User(
                email=email,
                name=name,
                image=image,
                role=role,
                plan=plan,
                status=status,
                locale=locale,
                currency=currency
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Created user: {user.id}")
            return user
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to create user: {e}")
            raise
        finally:
            db.close()

    async def get_user(self, user_id: str) -> Optional[User]:
        """사용자 조회"""
        db = self.get_db()
        try:
            return db.query(User).filter(User.id == user_id).first()
        finally:
            db.close()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """이메일로 사용자 조회"""
        db = self.get_db()
        try:
            return db.query(User).filter(User.email == email).first()
        finally:
            db.close()

    async def update_user(self, user_id: str, **updates) -> Optional[User]:
        """사용자 업데이트"""
        db = self.get_db()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                for key, value in updates.items():
                    if hasattr(user, key) and value is not None:
                        setattr(user, key, value)
                user.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(user)
            return user
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to update user: {e}")
            raise
        finally:
            db.close()

    # Session methods
    async def create_session(self, user_id: str, title: str = "새 세션") -> DBSession:
        """새 세션 생성"""
        db = self.get_db()
        try:
            # user_id를 UUID로 변환
            import uuid
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            
            # 사용자가 존재하는지 확인하고 없으면 생성
            user = db.query(User).filter(User.id == user_uuid).first()
            if not user:
                # 테스트 사용자 생성
                user = User(
                    id=user_uuid,
                    email="user@test.com",
                    name="테스트 사용자",
                    role="USER",
                    plan="free",
                    status="ACTIVE"
                )
                db.add(user)
                db.commit()
            
            session = DBSession(
                user_id=user_uuid,
                title=title,
                status='active'
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            logger.info(f"Created session: {session.id}")
            return session
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to create session: {e}")
            raise
        finally:
            db.close()

    async def get_session(self, session_id: str) -> Optional[DBSession]:
        """세션 조회"""
        db = self.get_db()
        try:
            return db.query(DBSession).filter(DBSession.id == session_id).first()
        finally:
            db.close()

    async def get_user_sessions(self, user_id: str) -> List[DBSession]:
        """사용자의 모든 세션 조회"""
        db = self.get_db()
        try:
            return db.query(DBSession).filter(DBSession.user_id == user_id).all()
        finally:
            db.close()

    async def update_session(self, session_id: str, title: Optional[str] = None, 
                           status: Optional[str] = None) -> Optional[DBSession]:
        """세션 업데이트"""
        db = self.get_db()
        try:
            session = db.query(DBSession).filter(DBSession.id == session_id).first()
            if session:
                if title is not None:
                    session.title = title
                if status is not None:
                    session.status = status
                session.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(session)
            return session
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to update session: {e}")
            raise
        finally:
            db.close()

    # Prompt methods
    async def create_prompt(self, session_id: str, content: str, 
                          llm_provider: Optional[str] = None,
                          llm_params: Optional[Dict[str, Any]] = None) -> Prompt:
        """새 프롬프트 생성"""
        db = self.get_db()
        try:
            prompt = Prompt(
                session_id=session_id,
                content=content,
                llm_provider=llm_provider,
                llm_params=llm_params or {}
            )
            db.add(prompt)
            db.commit()
            db.refresh(prompt)
            logger.info(f"Created prompt: {prompt.id}")
            return prompt
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to create prompt: {e}")
            raise
        finally:
            db.close()

    async def get_session_prompts(self, session_id: str) -> List[Prompt]:
        """세션의 모든 프롬프트 조회"""
        db = self.get_db()
        try:
            return db.query(Prompt).filter(Prompt.session_id == session_id).all()
        finally:
            db.close()

    # Task methods
    async def create_task(self, user_id: str, title: str = "새 작업") -> Task:
        """새 태스크 생성"""
        db = self.get_db()
        try:
            task = Task(
                user_id=user_id,
                title=title,
                status='active'
            )
            db.add(task)
            db.commit()
            db.refresh(task)
            logger.info(f"Created task: {task.id}")
            return task
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to create task: {e}")
            raise
        finally:
            db.close()

    async def get_task(self, task_id: str) -> Optional[Task]:
        """태스크 조회"""
        db = self.get_db()
        try:
            return db.query(Task).filter(Task.id == task_id).first()
        finally:
            db.close()

    async def get_user_tasks(self, user_id: str) -> List[Task]:
        """사용자의 모든 태스크 조회"""
        db = self.get_db()
        try:
            return db.query(Task).filter(Task.user_id == user_id).all()
        finally:
            db.close()

    async def update_task(self, task_id: str, title: Optional[str] = None,
                         status: Optional[str] = None) -> Optional[Task]:
        """태스크 업데이트"""
        db = self.get_db()
        try:
            task = db.query(Task).filter(Task.id == task_id).first()
            if task:
                if title is not None:
                    task.title = title
                if status is not None:
                    task.status = status
                task.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(task)
            return task
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to update task: {e}")
            raise
        finally:
            db.close()

    # TaskMessage methods
    async def create_task_message(self, task_id: str, role: str, content: str) -> TaskMessage:
        """새 태스크 메시지 생성"""
        db = self.get_db()
        try:
            message = TaskMessage(
                task_id=task_id,
                role=role,
                content=content
            )
            db.add(message)
            db.commit()
            db.refresh(message)
            logger.info(f"Created task message: {message.id}")
            return message
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to create task message: {e}")
            raise
        finally:
            db.close()

    async def get_task_messages(self, task_id: str) -> List[TaskMessage]:
        """태스크의 모든 메시지 조회"""
        db = self.get_db()
        try:
            return db.query(TaskMessage).filter(TaskMessage.task_id == task_id).all()
        finally:
            db.close()

    # TaskVersion methods
    async def create_task_version(self, task_id: str, code: str, engine: str = 'mermaid',
                                 root_id: Optional[str] = None) -> TaskVersion:
        """새 태스크 버전 생성"""
        db = self.get_db()
        try:
            version = TaskVersion(
                task_id=task_id,
                code=code,
                engine=engine,
                root_id=root_id
            )
            db.add(version)
            db.commit()
            db.refresh(version)
            logger.info(f"Created task version: {version.id}")
            return version
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to create task version: {e}")
            raise
        finally:
            db.close()

    async def get_task_versions(self, task_id: str) -> List[TaskVersion]:
        """태스크의 모든 버전 조회"""
        db = self.get_db()
        try:
            return db.query(TaskVersion).filter(TaskVersion.task_id == task_id).all()
        finally:
            db.close()

    async def get_task_version(self, version_id: str) -> Optional[TaskVersion]:
        """태스크 버전 조회"""
        db = self.get_db()
        try:
            return db.query(TaskVersion).filter(TaskVersion.id == version_id).first()
        finally:
            db.close()

    # Diagram methods
    async def create_diagram(self, visitor_id: Optional[str] = None,
                           user_id: Optional[str] = None,
                           session_id: Optional[str] = None,
                           task_id: Optional[str] = None,
                           engine: str = 'mermaid',
                           code: str = '',
                           render_type: str = 'readonly',
                           prompt: Optional[str] = None,
                           meta: Optional[Dict[str, Any]] = None,
                           ttl_hours: Optional[int] = None) -> Diagram:
        """새 다이어그램 생성"""
        db = self.get_db()
        try:
            ttl_expire_at = None
            if ttl_hours:
                ttl_expire_at = datetime.utcnow() + timedelta(hours=ttl_hours)

            diagram = Diagram(
                visitor_id=visitor_id,
                user_id=user_id,
                session_id=session_id,
                task_id=task_id,
                engine=engine,
                code=code,
                render_type=render_type,
                prompt=prompt,
                meta=meta or {},
                ttl_expire_at=ttl_expire_at
            )
            db.add(diagram)
            db.commit()
            db.refresh(diagram)
            logger.info(f"Created diagram: {diagram.id}")
            return diagram
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to create diagram: {e}")
            raise
        finally:
            db.close()

    async def get_diagram(self, diagram_id: str) -> Optional[Diagram]:
        """다이어그램 조회"""
        db = self.get_db()
        try:
            return db.query(Diagram).filter(Diagram.id == diagram_id).first()
        finally:
            db.close()

    async def get_user_diagrams(self, user_id: str) -> List[Diagram]:
        """사용자의 모든 다이어그램 조회"""
        db = self.get_db()
        try:
            return db.query(Diagram).filter(Diagram.user_id == user_id).all()
        finally:
            db.close()

    # Export methods
    async def create_export(self, diagram_id: str, format: str = 'png',
                          storage_key: Optional[str] = None) -> Export:
        """새 익스포트 생성"""
        db = self.get_db()
        try:
            export = Export(
                diagram_id=diagram_id,
                format=format,
                storage_key=storage_key
            )
            db.add(export)
            db.commit()
            db.refresh(export)
            logger.info(f"Created export: {export.id}")
            return export
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to create export: {e}")
            raise
        finally:
            db.close()

    async def get_user_exports(self, user_id: str) -> List[Export]:
        """사용자의 모든 익스포트 조회"""
        db = self.get_db()
        try:
            return db.query(Export).join(Diagram).filter(Diagram.user_id == user_id).all()
        finally:
            db.close()

    # Subscription methods
    async def create_subscription(self, user_id: str, provider: str, plan: str,
                                 status: str = "active", external_id: Optional[str] = None,
                                 current_period_end: Optional[datetime] = None) -> Subscription:
        """새 구독 생성"""
        db = self.get_db()
        try:
            subscription = Subscription(
                user_id=user_id,
                provider=provider,
                plan=plan,
                status=status,
                current_period_end=current_period_end,
                external_id=external_id
            )
            db.add(subscription)
            db.commit()
            db.refresh(subscription)
            logger.info(f"Created subscription: {subscription.id}")
            return subscription
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to create subscription: {e}")
            raise
        finally:
            db.close()

    async def get_user_subscription(self, user_id: str) -> Optional[Subscription]:
        """사용자의 활성 구독 조회"""
        db = self.get_db()
        try:
            return db.query(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.status == 'active'
            ).first()
        finally:
            db.close()

    # Share methods
    async def create_share(self, diagram_id: str, token: str, pin: str, title: str,
                          expire_at: Optional[datetime] = None) -> Share:
        """새 공유 생성"""
        db = self.get_db()
        try:
            share = Share(
                diagram_id=diagram_id,
                token=token,
                pin=pin,
                title=title,
                expire_at=expire_at
            )
            db.add(share)
            db.commit()
            db.refresh(share)
            logger.info(f"Created share: {share.id}")
            return share
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to create share: {e}")
            raise
        finally:
            db.close()

    async def get_share_by_token(self, token: str) -> Optional[Share]:
        """토큰으로 공유 조회"""
        db = self.get_db()
        try:
            return db.query(Share).filter(Share.token == token).first()
        finally:
            db.close()

    # Search methods
    async def create_search_index(self, user_id: str, entity_type: str, entity_id: str,
                                 title: Optional[str], content: str,
                                 metadata: Optional[Dict[str, Any]] = None) -> SearchIndex:
        """새 검색 인덱스 생성"""
        db = self.get_db()
        try:
            index = SearchIndex(
                user_id=user_id,
                entity_type=entity_type,
                entity_id=entity_id,
                title=title,
                content=content,
                meta_data=metadata or {}
            )
            db.add(index)
            db.commit()
            db.refresh(index)
            logger.info(f"Created search index: {index.id}")
            return index
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to create search index: {e}")
            raise
        finally:
            db.close()

    async def search_content(self, user_id: str, query: str, entity_types: Optional[List[str]] = None) -> List[SearchIndex]:
        """콘텐츠 검색"""
        db = self.get_db()
        try:
            q = db.query(SearchIndex).filter(SearchIndex.user_id == user_id)
            
            if entity_types:
                q = q.filter(SearchIndex.entity_type.in_(entity_types))
            
            # 제목이나 내용에서 검색
            search_filter = (
                SearchIndex.title.ilike(f"%{query}%") |
                SearchIndex.content.ilike(f"%{query}%")
            )
            q = q.filter(search_filter)
            
            return q.all()
        finally:
            db.close()

    # Visitor methods
    async def create_visitor(self, anon_id: str) -> Visitor:
        """새 방문자 생성"""
        db = self.get_db()
        try:
            visitor = Visitor(anon_id=anon_id)
            db.add(visitor)
            db.commit()
            db.refresh(visitor)
            logger.info(f"Created visitor: {visitor.id}")
            return visitor
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Failed to create visitor: {e}")
            raise
        finally:
            db.close()

    async def get_visitor_by_anon_id(self, anon_id: str) -> Optional[Visitor]:
        """익명 ID로 방문자 조회"""
        db = self.get_db()
        try:
            return db.query(Visitor).filter(Visitor.anon_id == anon_id).first()
        finally:
            db.close()

# 전역 데이터베이스 인스턴스
db = PostgreSQLDatabase()
