
import React, { useState, useCallback } from 'react';
import apiClient from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MapContainer from '@/components/map/MapContainer';
import LayerToggle from '@/components/map/LayerToggle';
import SiteCard from '@/components/map/SiteCard';
import AlertsBanner from '@/components/alerts/AlertsBanner';
import SearchBar from '@/components/search/SearchBar';
import ChatBot from '@/components/chat/ChatBot';
import ReportDialog from '@/components/map/ReportDialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bell, MessageCircle, Menu, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const transformSiteData = (rawSite) => {
  let latitude = null;
  let longitude = null;

  if (typeof rawSite.address === 'string' && rawSite.address.includes(',')) {
    const parts = rawSite.address.split(',');
    const lat = parseFloat(parts[0].trim());
    const lon = parseFloat(parts[1].trim());
    if (!isNaN(lat) && !isNaN(lon)) {
      latitude = lat;
      longitude = lon;
    }
  }

  let type = 'general';
  if (rawSite.category === 'קהילה') type = 'community';
  if (rawSite.category === 'תפעול') type = 'operations';

  const subCategoryMap = {
    'מתקני ספורט': 'sports',
    'מוסדות חינוך': 'education',
    'פנאי': 'leisure',
  };
  const sub_category_id = subCategoryMap[rawSite.sub_category] || rawSite.sub_category;

  return {
    id: rawSite.site_symbol || `generated-${Math.random()}`,
    name: rawSite.site_name,
    symbol: rawSite.site_symbol,
    type: type,
    sub_category: sub_category_id,
    description: rawSite.description,
    address: rawSite.address,
    latitude,
    longitude,
    ...rawSite,
  };
};

export default function Home() {
  const [selectedLayers, setSelectedLayers] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [reportLocation, setReportLocation] = useState(null);

  const queryClient = useQueryClient();

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await apiClient.get('/sites');
      const rawData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      return rawData.map(transformSiteData);
    },
  });

  const { data: streets = [] } = useQuery({
    queryKey: ['streets'],
    queryFn: async () => (await apiClient.get('/streets')).data,
  });

  const { data: liveMessages = [] } = useQuery({
    queryKey: ['liveMessages'],
    queryFn: async () => (await apiClient.get('/live-messages', { params: { is_active: true } })).data,
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
  }, []);

  const handleDismissAlert = useCallback((alertId) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  }, []);

  const handleMapClick = useCallback((latlng) => {
    setReportLocation(latlng);
  }, []);

  const createSiteMutation = useMutation({
    mutationFn: (siteData) => apiClient.post('/sites', siteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setReportLocation(null);
    },
  });

  const handleReportSubmit = async (reportData) => {
    await createSiteMutation.mutateAsync({
      ...reportData,
      status: 'active',
      is_user_report: true,
    });
    if (reportData.sub_category && !selectedLayers.includes(reportData.sub_category)) {
      setSelectedLayers(prev => [...prev, reportData.sub_category]);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-100" dir="rtl">
      <header className="bg-gradient-to-l from-blue-700 via-blue-600 to-blue-700 text-white shadow-lg z-20 shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><span className="text-xl font-bold">ע</span></div>
              <div>
                <h1 className="text-lg font-bold">עומר על המפה</h1>
                <p className="text-xs text-blue-100">המועצה המקומית עומר</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 relative" onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}>
                <Bell className="w-5 h-5" />
                {criticalAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center animate-pulse">
                    {criticalAlerts.length}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsChatOpen(true)}><MessageCircle className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>
      </header>

      {activeAlerts.length > 0 && (
        <div className="bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
          <button className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>הודעות והתראות</span>
              <Badge variant="secondary" className="mr-1">{activeAlerts.length}</Badge>
            </div>
            {isAlertsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {isAlertsExpanded && (
            <div className="max-h-48 overflow-y-auto">
              <AlertsBanner alerts={activeAlerts} onDismiss={handleDismissAlert}/>
            </div>
          )}
        </div>
      )}

      <main className="flex-1 relative overflow-hidden">
        <div className="absolute top-4 right-4 left-4 z-10 flex justify-center md:right-20">
          <SearchBar sites={sites} streets={streets} onSiteSelect={handleMarkerClick} onOpenChat={() => setIsChatOpen(true)} />
        </div>

        <div className="absolute bottom-4 right-4 z-10">
            <LayerToggle selectedLayers={selectedLayers} onLayerToggle={handleLayerToggle} siteCounts={sites.reduce((acc, site) => { if (site.sub_category) { acc[site.sub_category] = (acc[site.sub_category] || 0) + 1; } return acc; }, {})} />
        </div>

        <MapContainer sites={sites} selectedLayers={selectedLayers} onMarkerClick={handleMarkerClick} selectedSite={selectedSite} onMapClick={handleMapClick} />

        {selectedSite && <SiteCard site={selectedSite} onClose={() => setSelectedSite(null)} onDelete={() => queryClient.invalidateQueries({ queryKey: ['sites'] })} />}

        {!isChatOpen && <Button className="fixed bottom-4 left-4 w-14 h-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 z-10" onClick={() => setIsChatOpen(true)}><MessageCircle className="w-6 h-6" /></Button>}

        <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} initialMessage={null} />

        <ReportDialog isOpen={!!reportLocation} onClose={() => setReportLocation(null)} location={reportLocation || { lat: 0, lng: 0 }} onSubmit={handleReportSubmit} />
      </main>
    </div>
  );
}
