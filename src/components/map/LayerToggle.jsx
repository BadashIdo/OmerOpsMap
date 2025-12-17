import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wrench, Users, AlertTriangle, Palette, Dumbbell, Baby, TreePine } from 'lucide-react';
import { cn } from '@/lib/utils';

const LAYERS = [
  { id: 'operations', label: 'תפעול', icon: Wrench, color: 'bg-blue-500', activeColor: 'bg-blue-600' },
  { id: 'community', label: 'קהילה', icon: Users, color: 'bg-green-500', activeColor: 'bg-green-600' },
  { id: 'emergency', label: 'חירום', icon: AlertTriangle, color: 'bg-red-500', activeColor: 'bg-red-600' },
  { id: 'culture', label: 'תרבות', icon: Palette, color: 'bg-purple-500', activeColor: 'bg-purple-600' },
  { id: 'park-fitness', label: 'גינות כושר', icon: Dumbbell, color: 'bg-blue-400', activeColor: 'bg-blue-500' },
  { id: 'park-children', label: 'גני ילדים', icon: Baby, color: 'bg-pink-400', activeColor: 'bg-pink-500' },
  { id: 'park-public', label: 'שטחים ציבוריים', icon: TreePine, color: 'bg-green-400', activeColor: 'bg-green-500' },
];

export default function LayerToggle({ selectedLayers, onLayerToggle }) {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLayerToggle = (layerId) => {
    const layer = LAYERS.find(l => l.id === layerId);
    const willBeActive = !selectedLayers.includes(layerId);
    setNotification({
      label: layer.label,
      status: willBeActive ? 'דולק' : 'כבוי'
    });
    onLayerToggle(layerId);
  };

  return (
    <div className="relative h-full">
      <div className="h-full flex flex-col gap-2 p-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 overflow-y-auto">
      {LAYERS.map(layer => {
        const Icon = layer.icon;
        const isActive = selectedLayers.includes(layer.id);
        
        return (
          <Button
            key={layer.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleLayerToggle(layer.id)}
            className={cn(
              'w-full justify-start gap-2 transition-all duration-200',
              isActive && layer.activeColor,
              isActive && 'text-white shadow-md',
              !isActive && 'hover:bg-slate-100'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{layer.label}</span>
          </Button>
        );
      })}
      </div>
      
      {notification && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
          {notification.label} • {notification.status}
        </div>
      )}
    </div>
  );
}