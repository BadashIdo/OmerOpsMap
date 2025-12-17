
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// NOTE: The user activity logging functionality has been temporarily removed.
// It was previously using the base44 SDK. To re-enable it, a new API endpoint
// for logging user activity needs to be provided and integrated using the apiClient.

export default function NavigationTracker() {
    const location = useLocation();

    // Post navigation changes to parent window
    useEffect(() => {
        window.parent?.postMessage({
            type: "app_changed_url",
            url: window.location.href
        }, '*');
    }, [location]);

    // The user activity logging `useEffect` block that used base44 has been removed.

    return null;
}
