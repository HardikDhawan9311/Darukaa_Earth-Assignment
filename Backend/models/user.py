from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from config.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="user") # 'user', 'admin', etc.
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User(full_name={self.full_name}, email={self.email})>"
