import React, { useEffect, useRef, useState } from 'react';
import { Trees, Activity, Layers } from 'lucide-react';

// Real-world high-value Carbon & Biodiversity Hotspot Ecosystems
const ECOSYSTEM_SITES = [
  {
    id: 'amazon',
    name: 'Amazon Primary Rainforest',
    type: 'Tropical Forest Carbon Sink',
    lat: -3.46, lon: -62.21,
    carbon: '48.2M tCO₂e',
    carbonValue: 98,
    bioIndex: 98.4,
    speciesCount: '4,280',
    area: '2.4M Hectares',
    status: 'OPTIMAL SINK',
    statusColor: '#10b981',
    description: 'High-density biomass canopy providing global carbon absorption and mega-biodiversity refuge.',
  },
  {
    id: 'congo',
    name: 'Congo Basin Peatland',
    type: 'Peatland & Swamp Forest',
    lat: -0.22, lon: 20.99,
    carbon: '31.5M tCO₂e',
    carbonValue: 94,
    bioIndex: 94.1,
    speciesCount: '2,940',
    area: '1.6M Hectares',
    status: 'PROTECTED',
    statusColor: '#10b981',
    description: 'Critical tropical peat swamp storing dense subterranean carbon deposits.',
  },
  {
    id: 'sundarbans',
    name: 'Sundarbans Blue Carbon',
    type: 'Coastal Mangrove Ecosystem',
    lat: 21.94, lon: 88.90,
    carbon: '18.7M tCO₂e',
    carbonValue: 88,
    bioIndex: 93.5,
    speciesCount: '1,820',
    area: '480K Hectares',
    status: 'HIGH SEQUESTRATION',
    statusColor: '#3b82f6',
    description: 'Coastal blue carbon buffer trapping soil carbon 4x faster than terrestrial forests.',
  },
  {
    id: 'seasia',
    name: 'Sumatran Rainforest Corridor',
    type: 'Biodiversity Hotspot',
    lat: 0.58, lon: 101.44,
    carbon: '16.4M tCO₂e',
    carbonValue: 86,
    bioIndex: 96.8,
    speciesCount: '3,650',
    area: '620K Hectares',
    status: 'CRITICAL HOTSPOT',
    statusColor: '#f59e0b',
    description: 'Key habitat corridor for endangered endemic species and high canopy carbon reserves.',
  },
  {
    id: 'boreal',
    name: 'Scandinavian Boreal Belt',
    type: 'Taiga Carbon Sink',
    lat: 60.12, lon: 18.64,
    carbon: '24.1M tCO₂e',
    carbonValue: 90,
    bioIndex: 88.2,
    speciesCount: '1,240',
    area: '1.1M Hectares',
    status: 'STABLE SINK',
    statusColor: '#10b981',
    description: 'Cold-climate coniferous forest storing organic soil carbon and supporting boreal fauna.',
  },
  {
    id: 'valdivian',
    name: 'Valdivian Temperate Reserve',
    type: 'Ancient Temperate Canopy',
    lat: -39.81, lon: -73.24,
    carbon: '12.8M tCO₂e',
    carbonValue: 84,
    bioIndex: 95.2,
    speciesCount: '2,110',
    area: '340K Hectares',
    status: 'RESTORED',
    statusColor: '#10b981',
    description: 'Temperate evergreen canopy with high endemism and undisturbed soil carbon pools.',
  },
];

const MODES = [
  { id: 'carbon', label: 'Carbon Sequestration Mode', icon: Trees, color: '#10b981', glow: 'rgba(16, 185, 129, 0.15)' },
  { id: 'biodiversity', label: 'Biodiversity Index Mode', icon: Activity, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.15)' },
  { id: 'all', label: 'Combined Telemetry Spectrum', icon: Layers, color: '#a855f7', glow: 'rgba(168, 85, 247, 0.15)' },
];

// Continent Point Cloud Generator
function generateLandPoints() {
  const points = [];
  const isLand = (lat, lon) => {
    if (lat >= 15 && lat <= 72 && lon >= -168 && lon <= -52) {
      if (lat < 28 && lon < -105) return false;
      if (lat > 58 && lon > -85 && lon < -45) return true;
      if (lat < 30 && lon > -82) return true;
      return true;
    }
    if (lat >= -56 && lat <= 13 && lon >= -82 && lon <= -34) {
      if (lat < -20 && lon > -60) return lon < -60 + (lat + 20) * 0.75;
      return true;
    }
    if (lat >= 36 && lat <= 71 && lon >= -10 && lon <= 42) {
      if (lat < 42 && lon > 20) return false;
      return true;
    }
    if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 51) {
      if (lat > 18 && lon > 32) return lon < 36;
      if (lat < -10 && lon < 10) return false;
      return true;
    }
    if (lat >= 8 && lat <= 77 && lon >= 42 && lon <= 150) {
      if (lat < 25 && lon < 60) return lon > 44;
      return true;
    }
    if (lat >= -10 && lat <= 46 && lon >= 120 && lon <= 146) return true;
    if (lat >= -44 && lat <= -10 && lon >= 112 && lon <= 178) {
      if (lat >= -47 && lat <= -34 && lon >= 165) return true;
      if (lat < -38 && lon < 140) return false;
      return true;
    }
    return false;
  };

  for (let lat = -80; lat <= 80; lat += 2.2) {
    for (let lon = -180; lon <= 180; lon += 2.2) {
      if (isLand(lat, lon)) {
        points.push({
          lat: lat + (Math.random() - 0.5) * 1.2,
          lon: lon + (Math.random() - 0.5) * 1.2,
          carbonDensity: 0.3 + Math.random() * 0.7,
        });
      }
    }
  }
  return points;
}

const LAND_POINTS = generateLandPoints();

const InteractiveGlobe = () => {
  const canvasRef = useRef(null);
  const [modeIndex, setModeIndex] = useState(0);
  const [selectedSite, setSelectedSite] = useState(ECOSYSTEM_SITES[0]);
  const [hoveredSite, setHoveredSite] = useState(null);

  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0.0025 });
  const rotation = useRef({ x: 0.25, y: 0 });

  const currentMode = MODES[modeIndex];

  // Auto-transition Modes every 6 seconds
  useEffect(() => {
    const modeInterval = setInterval(() => {
      setModeIndex((prev) => (prev + 1) % MODES.length);
    }, 6000);
    return () => clearInterval(modeInterval);
  }, []);

  // Auto-cycle ecosystem sites every 4.5 seconds
  useEffect(() => {
    const siteInterval = setInterval(() => {
      if (!isDragging.current) {
        setSelectedSite((prev) => {
          const idx = ECOSYSTEM_SITES.findIndex((s) => s.id === prev.id);
          return ECOSYSTEM_SITES[(idx + 1) % ECOSYSTEM_SITES.length];
        });
      }
    }, 4500);
    return () => clearInterval(siteInterval);
  }, []);

  useEffect(() => {
    let animationFrameId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height, 620);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.scale(dpr, dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const render = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const radius = width * 0.36;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Auto-rotation physics
      if (!isDragging.current) {
        rotation.current.y += velocity.current.y;
        rotation.current.x += velocity.current.x;
        velocity.current.x *= 0.96;
      }

      const rotX = rotation.current.x;
      const rotY = rotation.current.y;
      const time = Date.now() * 0.0015;

      // ── 1. Atmosphere Radial Glow (Crossfading based on Active Mode) ──
      let glowRgb;
      if (currentMode.id === 'carbon') glowRgb = '16, 185, 129';
      else if (currentMode.id === 'biodiversity') glowRgb = '59, 130, 246';
      else glowRgb = '168, 85, 247';

      const outerGlow = ctx.createRadialGradient(
        centerX, centerY, radius * 0.8,
        centerX, centerY, radius * 1.45
      );
      outerGlow.addColorStop(0, `rgba(${glowRgb}, 0.22)`);
      outerGlow.addColorStop(0.5, `rgba(${glowRgb}, 0.08)`);
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.45, 0, Math.PI * 2);
      ctx.fill();

      // ── 2. Base Globe Sphere ──
      const sphereGradient = ctx.createRadialGradient(
        centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.1,
        centerX, centerY, radius
      );
      sphereGradient.addColorStop(0, '#111827');
      sphereGradient.addColorStop(0.7, '#0b0f19');
      sphereGradient.addColorStop(1, '#05070c');

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGradient;
      ctx.fill();

      // Sphere Outer Boundary Line
      ctx.strokeStyle = `rgba(${glowRgb}, 0.4)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.clip(); // Clip contents inside Earth sphere

      // ── 3. Latitude / Longitude Grid Lines ──
      ctx.strokeStyle = `rgba(${glowRgb}, 0.06)`;
      ctx.lineWidth = 1;

      for (let lat = -60; lat <= 60; lat += 30) {
        const phi = (lat * Math.PI) / 180;
        const rLat = radius * Math.cos(phi);
        const yLat = centerY - radius * Math.sin(phi) * Math.cos(rotX);
        const scaleY = Math.sin(rotX);

        ctx.beginPath();
        ctx.ellipse(centerX, yLat, rLat, Math.abs(rLat * scaleY * 0.35), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3D Projection Math Helper
      const project3D = (lat, lon, altMultiplier = 1.0) => {
        const phi = (lat * Math.PI) / 180;
        const lambda = (lon * Math.PI) / 180 + rotY;

        const r = radius * altMultiplier;
        const x3d = Math.cos(phi) * Math.sin(lambda);
        const y3d = Math.sin(phi);
        const z3d = Math.cos(phi) * Math.cos(lambda);

        const yRot = y3d * Math.cos(rotX) - z3d * Math.sin(rotX);
        const zRot = y3d * Math.sin(rotX) + z3d * Math.cos(rotX);

        return {
          x: centerX + x3d * r,
          y: centerY - yRot * r,
          z: zRot,
        };
      };

      // ── 4. Landmass Point Cloud (Color Coded by Active Auto-Mode) ──
      for (let i = 0; i < LAND_POINTS.length; i++) {
        const pt = project3D(LAND_POINTS[i].lat, LAND_POINTS[i].lon);
        if (pt.z > -0.05) {
          const alpha = Math.min(1, (pt.z + 0.05) * 1.3);
          const size = 1.1 + pt.z * 0.7;

          let colorStr;
          if (currentMode.id === 'carbon') {
            colorStr = `rgba(16, 185, 129, ${LAND_POINTS[i].carbonDensity * 0.75 * alpha})`;
          } else if (currentMode.id === 'biodiversity') {
            colorStr = `rgba(59, 130, 246, ${LAND_POINTS[i].carbonDensity * 0.75 * alpha})`;
          } else {
            colorStr = `rgba(168, 85, 247, ${LAND_POINTS[i].carbonDensity * 0.75 * alpha})`;
          }

          ctx.fillStyle = colorStr;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── 5. Data Flow Arcs Between Ecosystem Sinks ──
      for (let i = 0; i < ECOSYSTEM_SITES.length; i++) {
        const siteA = ECOSYSTEM_SITES[i];
        const siteB = ECOSYSTEM_SITES[(i + 1) % ECOSYSTEM_SITES.length];
        const pA = project3D(siteA.lat, siteA.lon);
        const pB = project3D(siteB.lat, siteB.lon);

        if (pA.z > -0.2 && pB.z > -0.2) {
          const midX = (pA.x + pB.x) / 2;
          const midY = (pA.y + pB.y) / 2 - radius * 0.26;

          ctx.strokeStyle = `rgba(${glowRgb}, 0.22)`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(pA.x, pA.y);
          ctx.quadraticCurveTo(midX, midY, pB.x, pB.y);
          ctx.stroke();

          // Traveling photon pulse
          const pulseT = ((time * 0.6 + i * 0.25) % 1);
          const px = (1 - pulseT) * (1 - pulseT) * pA.x + 2 * (1 - pulseT) * pulseT * midX + pulseT * pulseT * pB.x;
          const py = (1 - pulseT) * (1 - pulseT) * pA.y + 2 * (1 - pulseT) * pulseT * midY + pulseT * pulseT * pB.y;

          ctx.fillStyle = currentMode.color;
          ctx.shadowColor = currentMode.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // ── 6. Ecosystem Hotspot Nodes with Pulsing Canopy Rings ──
      ECOSYSTEM_SITES.forEach((site) => {
        const pt = project3D(site.lat, site.lon);
        if (pt.z > 0.05) {
          const isSelected = selectedSite.id === site.id;
          const isHovered = hoveredSite?.id === site.id;
          const pulse = (Math.sin(time * 4.5) + 1) * 0.5;

          // Canopy Ring Pulse Animation
          ctx.strokeStyle = currentMode.color;
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, (isSelected ? 9 : 6) + pulse * 6, 0, Math.PI * 2);
          ctx.stroke();

          if (isSelected || isHovered) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 11px "Space Grotesk", sans-serif';
            ctx.fillText(site.name, pt.x + 14, pt.y + 4);
          }

          ctx.fillStyle = isSelected ? currentMode.color : isHovered ? '#60a5fa' : '#34d399';
          ctx.shadowColor = currentMode.color;
          ctx.shadowBlur = isSelected ? 16 : 8;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, isSelected ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      ctx.restore(); // Restore clip

      // Specular Edge Atmosphere Glow
      const edgeHighlight = ctx.createRadialGradient(
        centerX, centerY, radius * 0.93,
        centerX, centerY, radius
      );
      edgeHighlight.addColorStop(0, 'rgba(0,0,0,0)');
      edgeHighlight.addColorStop(1, `rgba(${glowRgb}, 0.35)`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = edgeHighlight;
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Mouse Listeners
    const onMouseDown = (e) => {
      isDragging.current = true;
      previousMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDragging.current) {
        const deltaX = e.clientX - previousMouse.current.x;
        const deltaY = e.clientY - previousMouse.current.y;

        velocity.current = { x: deltaY * 0.004, y: deltaX * 0.004 };
        rotation.current.y += velocity.current.y;
        rotation.current.x += velocity.current.x;
        rotation.current.x = Math.max(-0.85, Math.min(0.85, rotation.current.x));

        previousMouse.current = { x: e.clientX, y: e.clientY };
      } else {
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        const radius = width * 0.36;
        const centerX = width / 2;
        const centerY = height / 2;

        const phi = (lat) => (lat * Math.PI) / 180;
        const lambda = (lon) => (lon * Math.PI) / 180 + rotation.current.y;

        let found = null;
        ECOSYSTEM_SITES.forEach((site) => {
          const x3d = Math.cos(phi(site.lat)) * Math.sin(lambda(site.lon));
          const y3d = Math.sin(phi(site.lat));
          const z3d = Math.cos(phi(site.lat)) * Math.cos(lambda(site.lon));

          const yRot = y3d * Math.cos(rotation.current.x) - z3d * Math.sin(rotation.current.x);
          const zRot = y3d * Math.sin(rotation.current.x) + z3d * Math.cos(rotation.current.x);

          if (zRot > 0.05) {
            const hX = centerX + x3d * radius;
            const hY = centerY - yRot * radius;
            if (Math.hypot(mouseX - hX, mouseY - hY) < 16) found = site;
          }
        });
        setHoveredSite(found);
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onClick = () => {
      if (hoveredSite) setSelectedSite(hoveredSite);
    };

    const domCanvas = canvasRef.current;
    domCanvas.addEventListener('mousedown', onMouseDown);
    domCanvas.addEventListener('mousemove', onMouseMove);
    domCanvas.addEventListener('click', onClick);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
      if (domCanvas) {
        domCanvas.removeEventListener('mousedown', onMouseDown);
        domCanvas.removeEventListener('mousemove', onMouseMove);
        domCanvas.removeEventListener('click', onClick);
      }
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [selectedSite, hoveredSite, currentMode]);

  const ModeIcon = currentMode.icon;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Sleek Automated Telemetry Mode Badge */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15, 20, 32, 0.88)',
        backdropFilter: 'blur(14px)',
        border: `1px solid ${currentMode.color}55`,
        borderRadius: 20,
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: `0 8px 24px ${currentMode.color}22`,
        transition: 'all 0.6s ease',
        zIndex: 10,
      }}>
        <ModeIcon size={14} color={currentMode.color} />
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: currentMode.color,
          fontFamily: 'Space Grotesk, sans-serif',
          letterSpacing: '0.02em',
        }}>
          {currentMode.label}
        </span>
        <div style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: currentMode.color,
          boxShadow: `0 0 8px ${currentMode.color}`,
        }} />
      </div>

      {/* 3D Globe Canvas */}
      <canvas
        ref={canvasRef}
        style={{ cursor: hoveredSite ? 'pointer' : 'grab', userSelect: 'none' }}
      />

      {/* Floating Carbon & Biodiversity Telemetry HUD */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15, 20, 32, 0.92)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${currentMode.color}44`,
        borderRadius: 14,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        width: 360,
        maxWidth: '90%',
        transition: 'border 0.6s ease',
      }}>
        {/* Ecosystem Icon */}
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: currentMode.glow,
          border: `1px solid ${currentMode.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.6s ease',
        }}>
          <ModeIcon size={18} color={currentMode.color} />
        </div>

        {/* Ecosystem Metadata */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            color: selectedSite.statusColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>● {selectedSite.status}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{selectedSite.area}</span>
          </div>

          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            fontFamily: 'Space Grotesk, sans-serif',
            marginTop: 2,
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {selectedSite.name}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
          }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Carbon: <strong style={{ color: 'var(--color-green)' }}>{selectedSite.carbon}</strong>
            </span>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Bio Index: <strong style={{ color: '#60a5fa' }}>{selectedSite.bioIndex}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveGlobe;
