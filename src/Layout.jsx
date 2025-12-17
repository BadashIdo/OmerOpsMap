import React from 'react';

export default function Layout({ children, currentPageName }) {
  return (
    <>
      <style>{`
        :root {
          --color-operations: #3B82F6;
          --color-community: #22C55E;
          --color-emergency: #EF4444;
          --color-culture: #A855F7;
        }
        
        html, body, #root {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        
        * {
          font-family: 'Heebo', 'Inter', sans-serif;
        }
        
        /* RTL Support */
        [dir="rtl"] {
          text-align: right;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* Animation for alerts */
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        
        /* Leaflet Map Styles */
        .leaflet-container {
          font-family: 'Heebo', 'Inter', sans-serif;
        }

        .custom-marker {
          background: transparent !important;
          border: none !important;
        }

        /* Move zoom controls up */
        .leaflet-bottom.leaflet-left {
          bottom: 80px !important;
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      {children}
    </>
  );
}