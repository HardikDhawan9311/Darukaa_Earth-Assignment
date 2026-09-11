import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MapboxContainer = ({
  coords,
  loading,
  fullscreen = false,
  enablePolygonDraw = false,
  onPolygonComplete,
  completeDrawingTrigger = 0,
  onDraftPointCountChange,
  onDrawError,
  persistedSites = [],
  selectedSiteId = null,
  onSiteClick,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const resizeObserverRef = useRef(null);
  const windowResizeHandlerRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  const enablePolygonDrawRef = useRef(enablePolygonDraw);
  const onPolygonCompleteRef = useRef(onPolygonComplete);
  const onDraftPointCountChangeRef = useRef(onDraftPointCountChange);
  const onDrawErrorRef = useRef(onDrawError);
  const onSiteClickRef = useRef(onSiteClick);
  const draftPointsRef = useRef([]);
  const [draftPoints, setDraftPoints] = useState([]);
  const completeDraftRef = useRef(null);
  const initialCoordsRef = useRef(coords);

  const clearDraft = () => {
    draftPointsRef.current = [];
    setDraftPoints([]);
    if (onDraftPointCountChangeRef.current) onDraftPointCountChangeRef.current(0);

    const mapInstance = map.current;
    if (!mapInstance) return;

    // Hide draft layers if they exist.
    const layerVisibility = (layerId, visible) => {
      if (!mapInstance.getLayer(layerId)) return;
      mapInstance.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    };

    layerVisibility('draft-points-layer', false);
    layerVisibility('draft-line-layer', false);
    layerVisibility('draft-fill-layer', false);
    layerVisibility('draft-outline-layer', false);
  };

  const completeDraft = async () => {
    const points = draftPointsRef.current;
    if (!points || points.length < 3) {
      const err = new Error('Polygon needs at least 3 points.');
      if (onDrawErrorRef.current) onDrawErrorRef.current(err.message);
      throw err;
    }

    try {
      if (onPolygonCompleteRef.current) {
        const maybePromise = onPolygonCompleteRef.current(points);
        if (maybePromise && typeof maybePromise.then === 'function') {
          await maybePromise;
        }
      }
      clearDraft();
    } catch (err) {
      const msg = err?.message || 'Failed to save site';
      setError(msg);
      if (onDrawErrorRef.current) onDrawErrorRef.current(msg);
      throw err;
    }
  };

  useEffect(() => {
    enablePolygonDrawRef.current = enablePolygonDraw;
    setError(null);
    if (!enablePolygonDraw) clearDraft();
  }, [enablePolygonDraw]);

  useEffect(() => {
    onPolygonCompleteRef.current = onPolygonComplete;
  }, [onPolygonComplete]);

  useEffect(() => {
    onDraftPointCountChangeRef.current = onDraftPointCountChange;
  }, [onDraftPointCountChange]);

  useEffect(() => {
    onDrawErrorRef.current = onDrawError;
  }, [onDrawError]);

  useEffect(() => {
    onSiteClickRef.current = onSiteClick;
  }, [onSiteClick]);

  useEffect(() => {
    completeDraftRef.current = completeDraft;
  });

  useEffect(() => {
    if (!map.current || !isLoaded) return;
    const mapInstance = map.current;

    // In draw mode we disable navigation interactions so clicks add vertices
    // instead of zooming/panning the map.
    if (enablePolygonDraw) {
      mapInstance.doubleClickZoom.disable();
      mapInstance.scrollZoom.disable();
      mapInstance.boxZoom.disable();
      mapInstance.dragPan.disable();
      mapInstance.dragRotate.disable();
      mapInstance.keyboard.disable();
      mapInstance.touchZoomRotate.disable();

      if (mapInstance.getCanvas()) {
        mapInstance.getCanvas().style.cursor = 'crosshair';
      }
    } else {
      mapInstance.doubleClickZoom.enable();
      mapInstance.scrollZoom.enable();
      mapInstance.boxZoom.enable();
      mapInstance.dragPan.enable();
      mapInstance.dragRotate.enable();
      mapInstance.keyboard.enable();
      mapInstance.touchZoomRotate.enable();

      if (mapInstance.getCanvas()) {
        mapInstance.getCanvas().style.cursor = '';
      }
    }
  }, [enablePolygonDraw, isLoaded]);

  const setupPolygonDraftLayers = (mapInstance) => {
    if (mapInstance.getSource('draft-points')) return;

    // Empty defaults (keeps layer updates safe).
    const emptyPoints = { type: 'FeatureCollection', features: [] };
    const dummyLine = { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] } };
    const dummyPoly = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[0, 0], [0, 0], [0, 0], [0, 0]]] },
    };

    mapInstance.addSource('draft-points', { type: 'geojson', data: emptyPoints });
    mapInstance.addSource('draft-line', { type: 'geojson', data: dummyLine });
    mapInstance.addSource('draft-polygon', { type: 'geojson', data: dummyPoly });

    mapInstance.addLayer({
      id: 'draft-points-layer',
      type: 'circle',
      source: 'draft-points',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': 5,
        'circle-color': '#11ccf5',
        'circle-stroke-color': '#05080a',
        'circle-stroke-width': 2,
      },
    });

    mapInstance.addLayer({
      id: 'draft-line-layer',
      type: 'line',
      source: 'draft-line',
      layout: { visibility: 'none' },
      paint: {
        'line-color': '#11ccf5',
        'line-width': 2,
      },
    });

    mapInstance.addLayer({
      id: 'draft-fill-layer',
      type: 'fill',
      source: 'draft-polygon',
      layout: { visibility: 'none' },
      paint: {
        'fill-color': '#11ccf5',
        'fill-opacity': 0.18,
      },
    });

    mapInstance.addLayer({
      id: 'draft-outline-layer',
      type: 'line',
      source: 'draft-polygon',
      layout: { visibility: 'none' },
      paint: {
        'line-color': '#11ccf5',
        'line-width': 2,
      },
    });
  };

  // 1. ANALYZE WEBGL CAPABILITY IMMEDIATELY
  useLayoutEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const support = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      if (!support) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  useLayoutEffect(() => {
    if (loading || !mapContainer.current || !webglSupported) return;

    let mapInstance;

    try {
      if (map.current) return;

      console.log("Mapbox: Booting Engine...");
      mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        // Satellite with labels (country/state/city names) for easier navigation.
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: initialCoordsRef.current,
        zoom: 12,
        pitch: 45,
        antialias: true
      });

      const handleMapReady = () => {
        setIsLoaded(true);
        map.current = mapInstance;
        setTimeout(() => mapInstance.resize(), 200);

        // Prepare polygon draft layers and click handlers.
        setupPolygonDraftLayers(mapInstance);

        mapInstance.on('click', (e) => {
          if (!enablePolygonDrawRef.current) return;

          const { lng, lat } = e.lngLat || {};
          if (typeof lng !== 'number' || typeof lat !== 'number') return;

          const nextPoints = [...draftPointsRef.current, [lng, lat]];
          draftPointsRef.current = nextPoints;
          setDraftPoints(nextPoints);
          if (onDraftPointCountChangeRef.current) onDraftPointCountChangeRef.current(nextPoints.length);
        });

        // While drawing, we want double-click to finish the polygon, not zoom.
        mapInstance.on('dblclick', async (e) => {
          if (!enablePolygonDrawRef.current) return;
          if (e?.originalEvent?.preventDefault) e.originalEvent.preventDefault();

          try {
            await completeDraftRef.current?.();
          } catch {
            // handled in completeDraft
          }
        });
      };

      // Use both events for reliability across style/network timing.
      mapInstance.on('load', handleMapReady);
      mapInstance.on('style.load', handleMapReady);

      // Keep map canvas synced with dynamic dashboard layout changes.
      const onWindowResize = () => {
        if (map.current) map.current.resize();
      };
      windowResizeHandlerRef.current = onWindowResize;
      window.addEventListener('resize', onWindowResize);

      if (mapContainer.current && 'ResizeObserver' in window) {
        resizeObserverRef.current = new ResizeObserver(() => {
          if (map.current) map.current.resize();
        });
        resizeObserverRef.current.observe(mapContainer.current);
      }

      mapInstance.on('error', (e) => {
        const msg = e?.error?.message || '';
        // Ignore non-fatal sprite/icon misses so map stays usable.
        if (msg.includes('Image "marker-15" could not be loaded')) return;
        setError(msg || "Check Mapbox Token or Network");
      });

    } catch (err) {
      setError(err.message);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (windowResizeHandlerRef.current) {
        window.removeEventListener('resize', windowResizeHandlerRef.current);
        windowResizeHandlerRef.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [loading, webglSupported]);

  useLayoutEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !isLoaded) return;

    // 1. If a specific site is selected, focus on that site
    if (selectedSiteId) {
      const site = (persistedSites || []).find((s) => String(s.id) === String(selectedSiteId));
      if (site && Array.isArray(site.coordinates) && site.coordinates.length >= 3) {
        const bounds = new mapboxgl.LngLatBounds();
        site.coordinates.forEach((pt) => {
          if (Array.isArray(pt) && pt.length >= 2 && !isNaN(pt[0]) && !isNaN(pt[1])) {
            bounds.extend([Number(pt[0]), Number(pt[1])]);
          }
        });
        mapInstance.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          maxZoom: 15,
          duration: 1400,
          essential: true,
        });
        return;
      }
    }

    // 2. If persistedSites has site polygons for the selected project, fit bounds to frame them all
    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;
    (persistedSites || []).forEach((s) => {
      if (Array.isArray(s.coordinates)) {
        s.coordinates.forEach((pt) => {
          if (Array.isArray(pt) && pt.length >= 2 && !isNaN(pt[0]) && !isNaN(pt[1])) {
            bounds.extend([Number(pt[0]), Number(pt[1])]);
            hasPoints = true;
          }
        });
      }
    });

    if (hasPoints) {
      mapInstance.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 14,
        duration: 1600,
        essential: true,
      });
    } else if (coords && Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      // 3. Fallback to center coords with optimal regional zoom
      mapInstance.flyTo({
        center: coords,
        zoom: 11,
        pitch: 45,
        bearing: 0,
        duration: 1600,
        essential: true,
      });
    }
  }, [persistedSites, selectedSiteId, coords, isLoaded]);

  useLayoutEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !isLoaded) return;
    if (!enablePolygonDrawRef.current) return;

    const pts = draftPointsRef.current;

    const pointsGeo = {
      type: 'FeatureCollection',
      features: pts.map(([lng, lat]) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {},
      })),
    };

    const hasLine = pts.length >= 2;
    const lineGeo = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: hasLine ? pts : [[0, 0], [0, 0]] },
    };

    const hasPoly = pts.length >= 3;
    const ringClosed = hasPoly ? [...pts, [pts[0][0], pts[0][1]]] : [[0, 0], [0, 0], [0, 0], [0, 0]];
    const polyGeo = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ringClosed] },
    };

    const pointsSource = mapInstance.getSource('draft-points');
    const lineSource = mapInstance.getSource('draft-line');
    const polySource = mapInstance.getSource('draft-polygon');

    if (pointsSource) pointsSource.setData(pointsGeo);
    if (lineSource) lineSource.setData(lineGeo);
    if (polySource) polySource.setData(polyGeo);

    if (mapInstance.getLayer('draft-points-layer')) {
      mapInstance.setLayoutProperty('draft-points-layer', 'visibility', pts.length >= 1 ? 'visible' : 'none');
    }
    if (mapInstance.getLayer('draft-line-layer')) {
      mapInstance.setLayoutProperty('draft-line-layer', 'visibility', hasLine ? 'visible' : 'none');
    }
    if (mapInstance.getLayer('draft-fill-layer')) {
      mapInstance.setLayoutProperty('draft-fill-layer', 'visibility', hasPoly ? 'visible' : 'none');
    }
    if (mapInstance.getLayer('draft-outline-layer')) {
      mapInstance.setLayoutProperty('draft-outline-layer', 'visibility', hasPoly ? 'visible' : 'none');
    }
  }, [draftPoints, isLoaded]);

  useEffect(() => {
    if (!enablePolygonDrawRef.current) return;
    if (!completeDrawingTrigger) return;
    completeDraft().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeDrawingTrigger]);

  useLayoutEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !isLoaded) return;

    if (!mapInstance.getSource('persisted-sites')) {
      mapInstance.addSource('persisted-sites', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      mapInstance.addLayer({
        id: 'persisted-sites-fill',
        type: 'fill',
        source: 'persisted-sites',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'id'], selectedSiteId ?? -1],
            '#ff3d5f',
            '#11ccf5',
          ],
          'fill-opacity': 0.2,
        },
      });

      mapInstance.addLayer({
        id: 'persisted-sites-outline',
        type: 'line',
        source: 'persisted-sites',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'id'], selectedSiteId ?? -1],
            '#ff3d5f',
            '#11ccf5',
          ],
          'line-width': [
            'case',
            ['==', ['get', 'id'], selectedSiteId ?? -1],
            3,
            2,
          ],
        },
      });

      mapInstance.addLayer({
        id: 'persisted-sites-centers',
        type: 'circle',
        source: 'persisted-sites',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 9,
          'circle-color': '#11ccf5',
          'circle-opacity': 0.95,
          'circle-stroke-color': 'rgba(255,255,255,0.9)',
          'circle-stroke-width': 3,
        },
      });

      mapInstance.on('click', 'persisted-sites-fill', (e) => {
        const feature = e?.features?.[0];
        if (!feature) return;
        const clickedId = feature?.properties?.id;
        if (onSiteClickRef.current) onSiteClickRef.current(Number(clickedId));
      });
    }

    const fc = {
      type: 'FeatureCollection',
      features: (persistedSites || [])
        .filter((s) => Array.isArray(s.coordinates) && s.coordinates.length >= 4)
        .map((s) => ({
          type: 'Feature',
          properties: {
            id: s.id,
            name: s.name,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [s.coordinates],
          },
        })),
    };

    // Transform polygon features to center-point features for marker layer.
    const centerFeatures = (persistedSites || [])
      .filter((s) => Array.isArray(s.coordinates) && s.coordinates.length >= 4)
      .map((s) => {
        const sum = s.coordinates.reduce(
          (acc, p) => [acc[0] + Number(p[0] || 0), acc[1] + Number(p[1] || 0)],
          [0, 0]
        );
        const n = s.coordinates.length || 1;
        return {
          type: 'Feature',
          properties: { id: s.id, name: s.name },
          geometry: {
            type: 'Point',
            coordinates: [sum[0] / n, sum[1] / n],
          },
        };
      });
    const combined = {
      type: 'FeatureCollection',
      features: [...fc.features, ...centerFeatures],
    };

    const src = mapInstance.getSource('persisted-sites');
    if (src) src.setData(combined);

    if (mapInstance.getLayer('persisted-sites-fill')) {
      mapInstance.setPaintProperty('persisted-sites-fill', 'fill-color', [
        'case',
        ['==', ['get', 'id'], selectedSiteId ?? -1],
        '#ff3d5f',
        '#11ccf5',
      ]);
    }
    if (mapInstance.getLayer('persisted-sites-outline')) {
      mapInstance.setPaintProperty('persisted-sites-outline', 'line-color', [
        'case',
        ['==', ['get', 'id'], selectedSiteId ?? -1],
        '#ff3d5f',
        '#11ccf5',
      ]);
      mapInstance.setPaintProperty('persisted-sites-outline', 'line-width', [
        'case',
        ['==', ['get', 'id'], selectedSiteId ?? -1],
        3,
        2,
      ]);
    }

    // Show site markers for existing sites, hide them while focusing one site.
    if (mapInstance.getLayer('persisted-sites-centers')) {
      mapInstance.setLayoutProperty(
        'persisted-sites-centers',
        'visibility',
        selectedSiteId ? 'none' : 'visible'
      );
    }
  }, [persistedSites, selectedSiteId, onSiteClick, isLoaded]);

  // UI RENDERING
  return (
    <div className={fullscreen
      ? 'absolute inset-0 bg-[#05080a]'
      : 'h-full w-full bg-[#05080a] rounded-[32px] border border-white/5 relative overflow-hidden shadow-2xl min-h-[500px]'
    }>
      
      {/* WEBGL ERROR PANEL */}
      {!webglSupported && (
        <div className="absolute inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-8 text-center">
           <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 border border-red-500/30">
              <span className="text-red-500 text-2xl font-bold">!</span>
           </div>
           <h4 className="text-white font-black text-xl mb-4">Graphics Engine Halted</h4>
           <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
             WebGL is not supported or disabled in your browser. <br/>
             <span className="text-cyan-400">Please enable Hardware Acceleration</span> in browser settings to view 3D maps.
           </p>
        </div>
      )}

      {/* MAP CANVAS */}
      <div 
        ref={mapContainer} 
        className="w-full h-full absolute inset-0"
        style={{ zIndex: 10 }}
      />

      {/* LOADING */}
      {!isLoaded && !error && webglSupported && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#000306] z-50">
          <div className="w-12 h-12 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mb-4" />
          <p className="text-cyan-500 font-mono text-[10px] uppercase tracking-[0.2em] animate-pulse">Syncing Orbital Data</p>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 p-8 text-center">
          <div className="max-w-xs p-6 border border-red-500/20 rounded-2xl bg-red-500/10">
            <p className="text-red-500 font-mono text-xs">{error}</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default MapboxContainer;
