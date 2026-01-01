# OmerOpsMap 🗺️

A municipal site mapping and management system for the Omer municipality.  
The application displays municipal sites on an interactive map, allows filtering by categories, viewing detailed site information, and direct navigation using **Waze** and **Google Maps**.

---

## ✨ Key Features

- 🗺️ Interactive map (Leaflet + OpenStreetMap)
- 📍 Load municipal sites from an Excel file
- 📑 Detailed site popup including:
  - Site name
  - District
  - Address (street + house number)
  - Contact person and phone (if available)
  - Category and sub-category
  - Site type
  - Coordinates (Latitude / Longitude)
  - General description (via “More Info” button)
- 🧭 Direct navigation:
  - Waze (blue button)
  - Google Maps (white button)
- 🧩 Sidebar with categories and sub-categories
- 🎨 Dark UI with clean white popups
- ⚡ Built with React + Vite for fast performance

---

## 🏗️ Project Structure (Frontend)

```txt
front/
├─ public/
│  ├─ icons/                 # Icons (Waze / Google Maps)
│  └─ sites.xlsx             # Site data (not tracked in git)
│
├─ src/
│  ├─ app/
│  │  └─ App.jsx
│  │
│  ├─ components/
│  │  ├─ Site/
│  │  │  ├─ SitePopup.jsx    # Site popup on the map
│  │  │  └─ SiteActions.jsx  # Navigation buttons (Waze / Google Maps)
│  │  ├─ MapView.jsx
│  │  ├─ SideBar.jsx
│  │  ├─ SearchBar.jsx
│  │  └─ Chat.jsx
│  │
│  ├─ data/
│  │  └─ loadSitesFromExcel.js
│  │
│  ├─ hooks/
│  ├─ lib/
│  └─ styles/
│     ├─ Site.module.css
│     ├─ SiteActions.module.css
│     └─ SideBar.module.css
│
├─ index.html
├─ package.json
├─ vite.config.js
└─ README.md

## 🧩 Components Overview

### App
The main application wrapper.  
Responsible for global layout, state initialization, and connecting all major components (map, sidebar, controls, and chat).

---

### MapView
Displays the interactive map using **Leaflet** and **OpenStreetMap**.  
Responsible for:
- Rendering the map and markers
- Handling map interactions (zoom, center, marker clicks)
- Displaying `SitePopup` when a site marker is selected

---

### SideBar
The main navigation and filtering panel.  
Responsible for:
- Displaying categories and sub-categories
- Allowing users to expand/collapse categories
- Filtering visible sites on the map
- Hiding map controls when opened

---

### SearchBar
Provides text-based search across sites.  
Responsible for:
- Filtering sites by name, category, or other attributes
- Updating visible markers in real time

---

### Chat
A conversational interface for interacting with the system.  
Responsible for:
- Accepting natural language queries
- Displaying system responses
- (Future) Integrating with an AI-powered backend

---

### SitePopup
Displays detailed information about a single site inside a map popup.  
Responsible for:
- Showing site metadata (name, district, address, category, etc.)
- Displaying coordinates and description
- Triggering navigation actions via `SiteActions`

---

### SiteActions
Handles site-related actions.  
Responsible for:
- Generating navigation links for Waze and Google Maps
- Enabling/disabling actions based on available coordinates
- Keeping navigation logic centralized and reusable

---

### loadSitesFromExcel
Data-loading utility responsible for reading and parsing site data.  
Responsible for:
- Loading `sites.xlsx`
- Converting ITM (EPSG:2039) coordinates to WGS84
- Normalizing and preparing site objects for the UI

---

### Styles (CSS Modules)
Component-scoped styles using CSS Modules.  
Responsible for:
- Preventing global style conflicts
- Maintaining consistent UI across components
- Supporting both dark UI and light popups




## Getting Started (After Cloning the Repository)

Follow these steps to run the project locally after cloning the repository.

---

### Clone the Repository

```bash
git clone <repository-url>
cd OmerOpsMap/front
npm install
public/sites.xlsx --> Ask Yehonatan
npm run dev

Then go to:
http://localhost:5173

