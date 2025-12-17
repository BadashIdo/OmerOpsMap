import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Wrench, Users, AlertTriangle, 
  Trash2, Recycle, Route, TreeDeciduous,
  Palmtree, Calendar, GraduationCap, Dumbbell,
  Shield, Bell,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  {
    id: 'operations',
    label: 'תפעול',
    icon: Wrench,
    color: 'bg-blue-500',
    activeColor: 'bg-blue-600',
    subLayers: [
      { id: 'waste_centers', label: 'ריכוזי אשפה', icon: Trash2 },
      { id: 'recycling', label: 'כלי מחזור', icon: Recycle },
      { id: 'sweeping_routes', label: 'מסלולי טיאוט', icon: Route },
      { id: 'pruning_stations', label: 'עמדות גזם', icon: TreeDeciduous },
      { id: 'leisure', label: 'פנאי', icon: Palmtree },
    ]
  },
  {
    id: 'community',
    label: 'קהילה ותרבות',
    icon: Users,
    color: 'bg-green-500',
    activeColor: 'bg-green-600',
    subLayers: [
      { id: 'upcoming_events', label: 'אירועים קרובים', icon: Calendar },
      { id: 'education', label: 'מוסדות חינוך', icon: GraduationCap },
      { id: 'sports', label: 'מתקני ספורט ופנאי', icon: Dumbbell },
    ]
  },
  {
    id: 'emergency',
    label: 'חירום וביטחון',
    icon: AlertTriangle,
    color: 'bg-red-500',
    activeColor: 'bg-red-600',
    subLayers: [
      { id: 'public_shelters', label: 'מקלטים ציבוריים', icon: Shield },
      { id: 'emergency_alerts', label: 'התראות חירום', icon: Bell },
    ]
  },
];

export default function LayerToggle({ selectedLayers, onLayerToggle }) {
  const [notification, setNotification] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(['operations', 'community', 'emergency']);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLayerToggle = (layerId, label) => {
    const willBeActive = !selectedLayers.includes(layerId);
    setNotification({
      layerId: layerId,
      status: willBeActive ? 'דולק' : 'כבוי',
      label: label
    });
    onLayerToggle(layerId);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleAllSubLayers = (category) => {
    const subLayerIds = category.subLayers.map(s => s.id);
    const allActive = subLayerIds.every(id => selectedLayers.includes(id));
    
    subLayerIds.forEach(id => {
      if (allActive && selectedLayers.includes(id)) {
        onLayerToggle(id);
      } else if (!allActive && !selectedLayers.includes(id)) {
        onLayerToggle(id);
      }
    });
  };

  return (
    <div className="relative">
      <div className="flex flex-col gap-1 p-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 max-h-[70vh] overflow-y-auto">
        {CATEGORIES.map(category => {
          const Icon = category.icon;
          const isExpanded = expandedCategories.includes(category.id);
          const activeSubCount = category.subLayers.filter(s => selectedLayers.includes(s.id)).length;
          
          return (
            <div key={category.id} className="relative">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                  category.color,
                  'text-white hover:opacity-90'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium flex-1 text-right">{category.label}</span>
                {activeSubCount > 0 && (
                  <span className="bg-white/30 text-xs px-1.5 py-0.5 rounded-full">
                    {activeSubCount}
                  </span>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {/* Sub Layers */}
              {isExpanded && (
                <div className="mt-1 mr-2 space-y-1">
                  {category.subLayers.map(subLayer => {
                    const SubIcon = subLayer.icon;
                    const isActive = selectedLayers.includes(subLayer.id);
                    
                    return (
                      <button
                        key={subLayer.id}
                        onClick={() => handleLayerToggle(subLayer.id, subLayer.label)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200',
                          isActive 
                            ? 'bg-slate-100 text-slate-800 font-medium' 
                            : 'text-slate-500 hover:bg-slate-50'
                        )}
                      >
                        <SubIcon className="w-4 h-4" />
                        <span className="flex-1 text-right">{subLayer.label}</span>
                        <div className={cn(
                          'w-3 h-3 rounded-full border-2',
                          isActive 
                            ? `${category.color} border-transparent` 
                            : 'border-slate-300'
                        )} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Notification Toast */}
      {notification && (
        <div className="absolute right-full mr-2 top-4 bg-slate-800 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm whitespace-nowrap animate-in fade-in slide-in-from-right-2 z-50">
          {notification.label} • {notification.status}
        </div>
      )}
    </div>
  );
}