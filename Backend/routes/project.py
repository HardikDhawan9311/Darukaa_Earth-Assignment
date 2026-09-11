import json
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from shapely.geometry import Polygon
# pyrefly: ignore [missing-import]
from sqlalchemy import select, text
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession

from config.database import get_db
from models.project import Analytics, Project, Site
from schemas.project import (
    AnalyticsCreate,
    AnalyticsOut,
    ProjectCreate,
    ProjectOut,
    ProjectUpdate,
    MessageOut,
    SiteCreate,
    SiteOut,
)

router = APIRouter(prefix="/api", tags=["Project"])


def geojson_polygon_to_ring_coords(geojson_value: Any) -> List[List[float]]:
    """
    Convert PostGIS GeoJSON polygon/multipolygon to frontend-friendly polygon ring coords.

    Returns the outer ring only: [[lon, lat], ...] (ring is guaranteed closed).
    """
    if not geojson_value:
        return []

    geojson_obj = json.loads(geojson_value) if isinstance(geojson_value, str) else geojson_value
    geometry_type = geojson_obj.get("type")
    coordinates = geojson_obj.get("coordinates")

    if geometry_type == "Polygon":
        ring = coordinates[0]
    elif geometry_type == "MultiPolygon":
        ring = coordinates[0][0]
    else:
        raise ValueError(f"Unsupported geometry type: {geometry_type}")

    ring = [[float(pt[0]), float(pt[1])] for pt in ring]

    # Ensure closure for map renderers.
    if (
        abs(ring[0][0] - ring[-1][0]) > 1e-9
        or abs(ring[0][1] - ring[-1][1]) > 1e-9
    ):
        ring.append([ring[0][0], ring[0][1]])

    return ring


# ---------------- PROJECT ----------------
@router.post("/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate, db: AsyncSession = Depends(get_db)):
    new_project = Project(
        name=project.name,
        description=project.description,
        status=project.status or "Active",
    )
    db.add(new_project)

    try:
        await db.commit()
        await db.refresh(new_project)
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project",
        )

    return ProjectOut(
        id=new_project.id,
        name=new_project.name,
        description=new_project.description,
        status=new_project.status or "Active",
        created_at=new_project.created_at,
    )


# ---------------- GET PROJECTS ----------------
@router.get("/projects", response_model=List[ProjectOut])
async def get_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project))
    projects = result.scalars().all()

    return [
        ProjectOut(
            id=p.id,
            name=p.name,
            description=p.description,
            status=p.status or "Active",
            created_at=p.created_at,
        )
        for p in projects
    ]


# ---------------- UPDATE PROJECT (STATUS/NAME/DESC) ----------------
@router.patch("/projects/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: int, data: ProjectUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.status is not None:
        project.status = data.status

    try:
        await db.commit()
        await db.refresh(project)
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project",
        )

    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status or "Active",
        created_at=project.created_at,
    )


# ---------------- DELETE PROJECT ----------------
@router.delete("/projects/{project_id}", response_model=MessageOut)
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    await db.delete(project)

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete project",
        )

    return MessageOut(message="Project deleted successfully")


# ---------------- SITE (POLYGON) ----------------
@router.post("/sites", response_model=SiteOut, status_code=status.HTTP_201_CREATED)
async def create_site(site: SiteCreate, db: AsyncSession = Depends(get_db)):
    # Check project exists
    result = await db.execute(select(Project).where(Project.id == site.project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    try:
        polygon = Polygon(site.coordinates)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid polygon coordinates",
        )

    if not polygon.is_valid or polygon.area == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Polygon geometry is invalid",
        )

    new_site = Site(
        project_id=site.project_id,
        name=site.name,
        geometry=f"SRID=4326;{polygon.wkt}",
    )

    db.add(new_site)

    try:
        await db.commit()
        await db.refresh(new_site)
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create site",
        )

    # Return frontend-friendly coords (ring is normalized to be closed by SiteCreate validator).
    return SiteOut(
        id=new_site.id,
        project_id=new_site.project_id,
        name=new_site.name,
        created_at=new_site.created_at,
        coordinates=site.coordinates,
    )


# ---------------- GET SITES (MAP DATA) ----------------
@router.get("/sites", response_model=List[SiteOut])
async def get_sites(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            """
            SELECT id, name, project_id, created_at, ST_AsGeoJSON(geometry) as geometry
            FROM sites
            """
        )
    )

    sites_out: List[SiteOut] = []
    for row in result:
        mapping = row._mapping
        try:
            coords = geojson_polygon_to_ring_coords(mapping["geometry"])
        except Exception:
            # Prefer to keep the endpoint usable even if a single row is malformed.
            coords = []

        sites_out.append(
            SiteOut(
                id=mapping["id"],
                name=mapping["name"],
                project_id=mapping["project_id"],
                created_at=mapping["created_at"],
                coordinates=coords,
            )
        )

    return sites_out


# ---------------- ANALYTICS ----------------
@router.post("/analytics", response_model=AnalyticsOut, status_code=status.HTTP_201_CREATED)
async def add_analytics(data: AnalyticsCreate, db: AsyncSession = Depends(get_db)):
    # Check site exists
    result = await db.execute(select(Site).where(Site.id == data.site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    new_data = Analytics(
        site_id=data.site_id,
        carbon_score=data.carbon_score,
        biodiversity_index=data.biodiversity_index,
    )

    db.add(new_data)

    try:
        await db.commit()
        await db.refresh(new_data)
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add analytics",
        )

    return AnalyticsOut(
        id=new_data.id,
        site_id=new_data.site_id,
        carbon_score=new_data.carbon_score,
        biodiversity_index=new_data.biodiversity_index,
        recorded_at=new_data.recorded_at,
    )


# ---------------- GET ANALYTICS BY SITE ----------------
@router.get("/analytics/{site_id}", response_model=List[AnalyticsOut])
async def get_analytics(site_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Analytics).where(Analytics.site_id == site_id))
    items = result.scalars().all()

    return [
        AnalyticsOut(
            id=a.id,
            site_id=a.site_id,
            carbon_score=a.carbon_score,
            biodiversity_index=a.biodiversity_index,
            recorded_at=a.recorded_at,
        )
        for a in items
    ]


# ---------------- DELETE SITE ----------------
@router.delete("/sites/{site_id}", response_model=MessageOut)
async def delete_site(site_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()

    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    await db.delete(site)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete site",
        )

    return MessageOut(message="Site deleted successfully")