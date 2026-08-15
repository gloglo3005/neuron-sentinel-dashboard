import { Fragment } from 'react';
import { MapContainer, TileLayer, Circle, Polygon, Tooltip } from 'react-leaflet';
import { levelOf, riskColor, zones as mockZones } from '../data/zones';

const LOME_CENTER = [6.155, 1.235];

// GeoJSON stores coordinates as [lng, lat]; Leaflet wants [lat, lng].
// Handles both Polygon (single ring array) and MultiPolygon (array of
// Polygons) — react-leaflet's <Polygon> accepts either a single ring or an
// array of rings/polygons via nested arrays.
function geoJsonToLeaflet(geometry) {
  if (!geometry) return null;
  const toLatLng = (ring) => ring.map(([lng, lat]) => [lat, lng]);
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(toLatLng);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((polygon) => polygon.map(toLatLng));
  }
  return null;
}

/**
 * Interactive Leaflet map of Lomé's monitored neighborhoods.
 * Circle size = flood risk severity, color = risk level.
 * Optional layers: population (outer ring) and drainage (small badge, via tooltip).
 *
 * `zones` should come from the useZones() hook (mock or real API) so this
 * component never has to know its data source. It still defaults to the
 * bundled mock so any older/ad-hoc usage keeps working.
 *
 * Architecture note (spec section 6): the layer control panel lives in
 * RiskMap.jsx. Layers backed by real data today (risk, population, rain)
 * are toggleable `show*` props rendered as sibling <Fragment> blocks below.
 * Layers with no real data source yet (signalements, infrastructures,
 * interventions) are listed in the panel but disabled — add them here the
 * same way once their APIs exist, without touching the risk-zone rendering.
 */
export default function ZoneMap({
  zones = mockZones,
  horizonIdx = 0,
  selectedZone,
  onSelect,
  height = 320,
  showPopulation = false,
  showRain = false,
  zoom = 12,
  filter = null,
}) {
  return (
    <MapContainer
      center={LOME_CENTER}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height, width: '100%', borderRadius: 12 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {Object.entries(zones).map(([name, z]) => {
        const val = z.series[horizonIdx];
        const level = levelOf(val);
        const isSelected = selectedZone === name;
        const matches = !filter || name.toLowerCase().includes(filter.toLowerCase());
        const positions = geoJsonToLeaflet(z.geometry);

        const shapeProps = {
          eventHandlers: { click: () => onSelect && onSelect(name) },
          pathOptions: {
            color: isSelected ? '#141B2C' : '#fff',
            weight: isSelected ? 2.5 : 1.5,
            fillColor: riskColor[level],
            fillOpacity: matches ? 0.75 : 0.15,
            opacity: matches ? 1 : 0.2,
          },
        };

        return (
          <Fragment key={name}>
            {showPopulation && (
              <Circle
                center={[z.lat, z.lng]}
                radius={200 + (z.pop / 21000) * 700}
                pathOptions={{ color: '#141B2C', weight: 1, fillColor: '#141B2C', fillOpacity: matches ? 0.06 : 0.02, opacity: matches ? 0.15 : 0.05 }}
              />
            )}
            {showRain && (
              <Circle
                center={[z.lat, z.lng]}
                radius={150 + (z.rain / 100) * 900}
                pathOptions={{ color: '#2E6FDE', weight: 1, fillColor: '#2E6FDE', fillOpacity: matches ? 0.08 : 0.02, opacity: matches ? 0.2 : 0.05, dashArray: '4 4' }}
              />
            )}
            {/* Real OpenStreetMap boundary once synced (see geoService.js /
               POST /zones/sync-geometry) — falls back to the mock circle
               placeholder (z.radius) otherwise. */}
            {positions ? (
              <Polygon positions={positions} {...shapeProps}>
                <Tooltip direction="top" offset={[0, -8]}>
                  <div className="text-xs font-semibold">{name} — {val}%</div>
                </Tooltip>
              </Polygon>
            ) : (
              <Circle center={[z.lat, z.lng]} radius={z.radius} {...shapeProps}>
                <Tooltip direction="top" offset={[0, -8]}>
                  <div className="text-xs font-semibold">{name} — {val}%</div>
                </Tooltip>
              </Circle>
            )}
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
