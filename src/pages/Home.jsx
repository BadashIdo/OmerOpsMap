import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MapContainer from '@/components/map/MapContainer';
import LayerToggle from '@/components/map/LayerToggle';
import SiteCard from '@/components/map/SiteCard';
import ParkCard from '@/components/map/ParkCard';
import AlertsBanner from '@/components/alerts/AlertsBanner';
import SearchBar from '@/components/search/SearchBar';
import ChatBot from '@/components/chat/ChatBot';
import ReportDialog from '@/components/map/ReportDialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bell, MessageCircle, Menu, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const [selectedLayers, setSelectedLayers] = useState(['operations', 'community', 'emergency', 'culture', 'park-fitness', 'park-children', 'park-public']);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedPark, setSelectedPark] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [reportLocation, setReportLocation] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list(),
  });

  const { data: streets = [] } = useQuery({
    queryKey: ['streets'],
    queryFn: () => base44.entities.Street.list(),
  });

  const { data: liveMessages = [] } = useQuery({
    queryKey: ['liveMessages'],
    queryFn: () => base44.entities.LiveMessage.filter({ is_active: true }),
  });

  const { data: parks = [] } = useQuery({
    queryKey: ['parks'],
    queryFn: () => base44.entities.Park.list(),
  });

  const activeAlerts = liveMessages.filter(msg => !dismissedAlerts.includes(msg.id));
  const criticalAlerts = activeAlerts.filter(a => a.priority === 'critical' || a.type === 'emergency');

  const handleLayerToggle = useCallback((layerId) => {
    setSelectedLayers(prev => 
      prev.includes(layerId)
        ? prev.filter(l => l !== layerId)
        : [...prev, layerId]
    );
  }, []);

  const handleMarkerClick = useCallback((site) => {
    setSelectedSite(site);
    setSelectedPark(null);
  }, []);

  const handleParkClick = useCallback((park) => {
    setSelectedPark(park);
    setSelectedSite(null);
  }, []);

  const handleDismissAlert = useCallback((alertId) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  }, []);

  const handleMapClick = useCallback((latlng) => {
    setReportLocation(latlng);
  }, []);

  const createSiteMutation = useMutation({
    mutationFn: (siteData) => base44.entities.Site.create(siteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setReportLocation(null);
    },
  });

  const handleReportSubmit = async (reportData) => {
    await createSiteMutation.mutateAsync({
      ...reportData,
      type: 'other',
      status: 'active',
    });
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-l from-blue-700 via-blue-600 to-blue-700 text-white shadow-lg z-20 shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold">ע</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">עומר על המפה</h1>
                <p className="text-xs text-blue-100">המועצה המקומית עומר</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 relative"
                onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
              >
                <Bell className="w-5 h-5" />
                {criticalAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center animate-pulse">
                    {criticalAlerts.length}
                  </span>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        <div className="bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
          <button
            className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>הודעות והתראות</span>
              <Badge variant="secondary">{activeAlerts.length}</Badge>
            </div>
            {isAlertsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {isAlertsExpanded && (
            <div className="max-h-48 overflow-y-auto">
              <AlertsBanner 
                alerts={activeAlerts} 
                onDismiss={handleDismissAlert}
              />
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {/* Search Bar */}
        <div className="absolute top-4 right-4 left-4 z-10 flex justify-center md:right-20">
          <SearchBar
            sites={sites}
            streets={streets}
            parks={parks}
            onSiteSelect={handleMarkerClick}
            onParkSelect={handleParkClick}
            onOpenChat={() => setIsChatOpen(true)}
          />
        </div>

        {/* Layer Toggle - Sidebar */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-10">
          <LayerToggle
            selectedLayers={selectedLayers}
            onLayerToggle={handleLayerToggle}
          />
        </div>

        {/* Map */}
        <MapContainer
          sites={sites}
          parks={parks}
          selectedLayers={selectedLayers}
          onMarkerClick={handleMarkerClick}
          onParkClick={handleParkClick}
          selectedSite={selectedSite}
          onMapClick={handleMapClick}
        />

        {/* Site Card */}
        {selectedSite && (
          <SiteCard
            site={selectedSite}
            onClose={() => setSelectedSite(null)}
            onDelete={() => {
              queryClient.invalidateQueries({ queryKey: ['sites'] });
              setSelectedSite(null);
            }}
          />
        )}

        {/* Park Card */}
        {selectedPark && (
          <ParkCard
            park={selectedPark}
            onClose={() => setSelectedPark(null)}
          />
        )}

        {/* Chat FAB */}
        {!isChatOpen && (
          <Button
            className="fixed bottom-4 left-4 w-14 h-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 z-10"
            onClick={() => setIsChatOpen(true)}
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        )}

        {/* Chat Bot */}
        <ChatBot
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />

        {/* Report Dialog */}
        <ReportDialog
          isOpen={!!reportLocation}
          onClose={() => setReportLocation(null)}
          location={reportLocation || { lat: 0, lng: 0 }}
          onSubmit={handleReportSubmit}
        />
      </main>
    </div>
  );
}