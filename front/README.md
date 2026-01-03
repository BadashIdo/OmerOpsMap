# OmerOpsMap Frontend

Interactive map application for managing municipal sites and temporary events in Omer.

## Features

- 🗺️ Interactive map with permanent sites
- ⚡ Real-time temporary events display
- 🔄 Live WebSocket updates
- 🔍 Advanced search and filtering
- 📱 Responsive design
- 🤖 AI chat assistant

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env if needed
```

### 3. Start development server
```bash
npm run dev
```

Application will be available at http://localhost:5173

## Prerequisites

- Node.js 16+
- Data Server running at http://localhost:8001

## Environment Variables

Create a `.env` file with:

```env
VITE_API_URL=http://localhost:8001
```

## Project Structure

```
front/
├── src/
│   ├── api/              # API client
│   ├── app/              # Main App component
│   ├── assets/           # Static assets
│   ├── components/       # React components
│   │   ├── Site/         # Site-related components
│   │   ├── MapView.jsx
│   │   ├── SearchBar.jsx
│   │   ├── SideBar.jsx
│   │   ├── Chat.jsx
│   │   ├── TemporaryEventsPanel.jsx
│   │   └── NotificationToast.jsx
│   ├── data/             # Data loading utilities
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   └── styles/           # CSS modules
├── public/               # Public assets
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Components

### MapView
Main map component displaying permanent and temporary sites.

### SideBar
Filterable categories for sites and temporary events.

### TemporaryEventsPanel
Panel showing all active temporary events with details.

### NotificationToast
Real-time notifications for data changes.

## API Integration

The frontend communicates with the Data Server via:

- REST API for fetching sites
- WebSocket for real-time updates

See `src/api/dataService.js` for API methods.

## Development

### Adding New Features

1. Create component in `src/components/`
2. Add styles in `src/styles/`
3. Integrate in `App.jsx`

### State Management

Uses React hooks for state management:
- `useSites` - Permanent sites
- `useTemporarySites` - Temporary events
- `useWebSocket` - Real-time updates

## Building for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Deployment

See main project [SETUP_GUIDE.md](../SETUP_GUIDE.md) for deployment instructions.
