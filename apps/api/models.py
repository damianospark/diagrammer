from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    image = Column(Text, default="")
    role = Column(String(50), default="USER")  # USER, ADMIN, OWNER
    plan = Column(String(50), default="free")  # free, pro, team
    status = Column(String(50), default="ACTIVE")  # ACTIVE, SUSPENDED, DELETED
    locale = Column(String(10), default="ko")
    currency = Column(String(3), default="KRW")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("Session", back_populates="user")
    tasks = relationship("Task", back_populates="user")
    diagrams = relationship("Diagram", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")
    payments = relationship("Payment", back_populates="user")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="active")  # active, archived
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    prompts = relationship("Prompt", back_populates="session")
    diagrams = relationship("Diagram", back_populates="session")

class Prompt(Base):
    __tablename__ = "prompts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    content = Column(Text, nullable=False)
    llm_provider = Column(String(100))
    llm_params = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="prompts")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="active")  # active, archived
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="tasks")
    messages = relationship("TaskMessage", back_populates="task")
    versions = relationship("TaskVersion", back_populates="task")
    diagrams = relationship("Diagram", back_populates="task")

class TaskMessage(Base):
    __tablename__ = "task_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    role = Column(String(50), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="messages")

class TaskVersion(Base):
    __tablename__ = "task_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    code = Column(Text, nullable=False)
    engine = Column(String(50), default="mermaid")  # mermaid, visjs
    root_id = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="versions")

class Visitor(Base):
    __tablename__ = "visitors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anon_id = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Diagram(Base):
    __tablename__ = "diagrams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visitor_id = Column(UUID(as_uuid=True), ForeignKey("visitors.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"))
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"))
    engine = Column(String(50), default="mermaid")  # mermaid, visjs
    code = Column(Text, nullable=False)
    render_type = Column(String(50), default="readonly")  # readonly, reactflow
    prompt = Column(Text)
    meta = Column(JSON)
    ttl_expire_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    visitor = relationship("Visitor")
    user = relationship("User", back_populates="diagrams")
    session = relationship("Session", back_populates="diagrams")
    task = relationship("Task", back_populates="diagrams")
    exports = relationship("Export", back_populates="diagram")
    shares = relationship("Share", back_populates="diagram")

class Export(Base):
    __tablename__ = "exports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    diagram_id = Column(UUID(as_uuid=True), ForeignKey("diagrams.id"), nullable=False)
    format = Column(String(50), nullable=False)  # png, pptx, gslides
    storage_key = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    diagram = relationship("Diagram", back_populates="exports")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    provider = Column(String(50), nullable=False)  # stripe, toss
    plan = Column(String(50), nullable=False)  # free, pro, team
    status = Column(String(50), default="active")  # active, canceled, past_due
    current_period_end = Column(DateTime)
    external_id = Column(String(255))  # Stripe subscription ID
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")
    payments = relationship("Payment", back_populates="subscription")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"))
    provider = Column(String(50), nullable=False)  # stripe, toss
    external_id = Column(String(255), nullable=False)  # Payment intent ID
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(String(50), default="pending")  # pending, completed, failed, refunded
    paid_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="payments")
    subscription = relationship("Subscription", back_populates="payments")

class Share(Base):
    __tablename__ = "shares"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    diagram_id = Column(UUID(as_uuid=True), ForeignKey("diagrams.id"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)  # URL token
    pin = Column(String(5), nullable=False)  # 5-digit alphanumeric PIN
    title = Column(String(255), nullable=False)
    expire_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    diagram = relationship("Diagram", back_populates="shares")

class SearchIndex(Base):
    __tablename__ = "search_index"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    entity_type = Column(String(50), nullable=False)  # diagram, prompt, task
    entity_id = Column(String(255), nullable=False)
    title = Column(String(255))
    content = Column(Text, nullable=False)
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
