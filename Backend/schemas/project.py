import math
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

# ------------------------
# Input Schemas
# ------------------------

class AnalyticsBase(BaseModel):
    carbon_score: float
    biodiversity_index: float

class AnalyticsCreate(AnalyticsBase):
    site_id: int


class SiteBase(BaseModel):
    name: str


class SiteCreate(SiteBase):
    project_id: int
    # List of [longitude, latitude] pairs. Ring is normalized to be closed.
    coordinates: List[List[float]] = Field(..., description="Polygon ring coordinates as [lon, lat] pairs")

    @field_validator("coordinates")
    @classmethod
    def validate_polygon_input(cls, v: List[List[float]]) -> List[List[float]]:
        if len(v) < 3:
            raise ValueError("Polygon needs at least 3 coordinate points.")

        points: List[List[float]] = []
        for idx, pt in enumerate(v):
            if not isinstance(pt, (list, tuple)) or len(pt) != 2:
                raise ValueError(f"Point at index {idx} must be a [lon, lat] pair.")

            lon = float(pt[0])
            lat = float(pt[1])

            if not math.isfinite(lon) or not math.isfinite(lat):
                raise ValueError(f"Point at index {idx} contains non-finite values.")

            # EPSG:4326 bounds checks
            if lon < -180 or lon > 180 or lat < -90 or lat > 90:
                raise ValueError(f"Point at index {idx} is out of EPSG:4326 bounds.")

            points.append([lon, lat])

        # Normalize closure: if first != last, close the ring by appending first point.
        if (
            abs(points[0][0] - points[-1][0]) > 1e-9
            or abs(points[0][1] - points[-1][1]) > 1e-9
        ):
            points.append([points[0][0], points[0][1]])

        if len(points) < 4:
            raise ValueError("Polygon must have at least 4 points after ensuring the ring is closed.")

        # Reject degenerate polygons (all points the same / collinear-like degeneracy handled later via Shapely).
        unique_points = {(round(p[0], 7), round(p[1], 7)) for p in points}
        if len(unique_points) < 3:
            raise ValueError("Polygon must have at least 3 unique vertices.")

        return points


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "Active"


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


# ------------------------
# Response Schemas
# ------------------------

class AnalyticsOut(AnalyticsBase):
    id: int
    site_id: int
    recorded_at: datetime


class SiteOut(SiteBase):
    id: int
    project_id: int
    created_at: datetime
    # Frontend-friendly polygon ring coordinates as [lon, lat]
    coordinates: List[List[float]]


class ProjectOut(ProjectBase):
    id: int
    created_at: datetime


class MessageOut(BaseModel):
    message: str


# ------------------------
# Legacy/compat schemas (may be unused by routes)
# ------------------------

class Analytics(AnalyticsBase):
    id: int
    site_id: int
    recorded_at: datetime

    class Config:
        from_attributes = True


class Site(SiteBase):
    id: int
    project_id: int
    created_at: datetime
    coordinates: Optional[List[List[float]]] = None
    analytics: List[Analytics] = []

    class Config:
        from_attributes = True


class Project(ProjectBase):
    id: int
    created_at: datetime
    sites: List[Site] = []

    class Config:
        from_attributes = True