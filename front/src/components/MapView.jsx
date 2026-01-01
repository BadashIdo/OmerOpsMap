import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { userIcon } from "../lib/leafletIcons";
import SitePopup from "./Site/SitePopup";


export default function MapView({ center, mapRef, markerRefs, userLocation, points, onMarkerClick }) {
  return (
    <MapContainer center={center} zoom={15} zoomControl={false} style={{ height: "100%", width: "100%" }} ref={mapRef}>
      <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>אתה כאן</Popup>
        </Marker>
      )}

      {points.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          ref={(el) => (markerRefs.current[p.id] = el)}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              onMarkerClick(p);
            },
          }}
        >
        <Popup>
            <SitePopup site={p} />
        </Popup>
        </Marker>
      ))}
    </MapContainer>
    
  );
}
