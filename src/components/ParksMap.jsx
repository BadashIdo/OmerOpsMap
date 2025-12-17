import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Dumbbell, Baby, TreePine } from "lucide-react";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Create custom icons for different categories
const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [25, 25],
        iconAnchor: [12, 12],
    });
};

const fitnessIcon = createCustomIcon('#3b82f6');
const childrenIcon = createCustomIcon('#ec4899');
const publicIcon = createCustomIcon('#22c55e');

export default function ParksMap({ parks }) {
    // Parse coordinates from address field
    const parksWithCoords = parks.map(park => {
        const coordMatch = park.address.match(/^(\d+\.\d+),\s*(\d+\.\d+)$/);
        if (coordMatch) {
            return {
                ...park,
                lat: parseFloat(coordMatch[1]),
                lng: parseFloat(coordMatch[2]),
            };
        }
        return park;
    }).filter(park => park.lat && park.lng);

    if (parksWithCoords.length === 0) {
        return (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                לא נמצאו גנים עם קואורדינטות למפה
            </div>
        );
    }

    // Center map on Omer (average of all coordinates)
    const centerLat = parksWithCoords.reduce((sum, p) => sum + p.lat, 0) / parksWithCoords.length;
    const centerLng = parksWithCoords.reduce((sum, p) => sum + p.lng, 0) / parksWithCoords.length;

    const getIcon = (category) => {
        switch (category) {
            case "גינת כושר":
                return fitnessIcon;
            case "גן ילדים":
                return childrenIcon;
            case "שטח ציבורי":
                return publicIcon;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
            <MapContainer
                center={[centerLat, centerLng]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {parksWithCoords.map((park) => (
                    <Marker
                        key={park.id}
                        position={[park.lat, park.lng]}
                        icon={getIcon(park.category)}
                    >
                        <Popup>
                            <div className="text-right" dir="rtl">
                                <h3 className="font-bold text-lg mb-2">{park.name}</h3>
                                <p className="text-sm text-gray-600 mb-1">
                                    <span className="font-semibold">קטגוריה:</span> {park.category}
                                </p>
                                {park.symbol && (
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">סמל:</span> {park.symbol}
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}