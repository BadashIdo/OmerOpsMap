/**
 * useGeoLocation — on-demand GPS location for the map.
 *
 * Gets the user's position once per button press (getCurrentPosition),
 * rather than polling continuously. This means no background GPS ticking
 * and no re-renders unless the user explicitly asks for their location.
 *
 * Pressing the button while the marker is visible hides it (toggle off).
 * Mirrors the last known position into sessionStorage so ChatBot can read it.
 *
 * @param {React.MutableRefObject} mapRef - Ref to the Leaflet map instance
 * @returns {{ userLocation, isTracking, handleLocate }}
 *   userLocation  — { lat, lng } object, or null when hidden
 *   isTracking    — boolean, true while the location marker is visible
 *   handleLocate  — toggle: show location (and fly to it) or hide it
 */

import { useState } from "react";

export function useGeoLocation(mapRef) {
  const [userLocation, setUserLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  function handleLocate() {
    if (isTracking) {
      // Hide the marker
      setIsTracking(false);
      setUserLocation(null);
      sessionStorage.removeItem("user_location");
      sessionStorage.setItem("location_tracking", "false");
      return;
    }

    if (!navigator.geolocation) {
      alert("הדפדפן שלך לא תומך במיקום גיאוגרפי");
      return;
    }

    // Get position once — no continuous background polling
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsTracking(true);
        sessionStorage.setItem("user_location", `${latitude},${longitude}`);
        sessionStorage.setItem("location_tracking", "true");

        if (mapRef?.current) {
          mapRef.current.flyTo([latitude, longitude], 16, { animate: true, duration: 0.8 });
        }
      },
      (error) => {
        console.error("שגיאה בקבלת מיקום:", error);
        alert("לא ניתן לקבל מיקום. אנא אפשר הרשאות מיקום בדפדפן.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return { userLocation, isTracking, handleLocate };
}
