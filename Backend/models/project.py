from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, CheckConstraint
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from datetime import datetime
from config.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    sites = relationship("Site", back_populates="project", cascade="all, delete-orphan")


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)

    geometry = Column(
        Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True)
    )

    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="sites")
    analytics = relationship("Analytics", back_populates="site", cascade="all, delete-orphan")


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)

    carbon_score = Column(Float)
    biodiversity_index = Column(Float)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('carbon_score >= 0 AND carbon_score <= 1', name='carbon_range'),
        CheckConstraint('biodiversity_index >= 0 AND biodiversity_index <= 1', name='biodiversity_range'),
    )

    site = relationship("Site", back_populates="analytics")