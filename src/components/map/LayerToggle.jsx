import React from 'react';
import { Button } from '@/components/ui/button';
import { Wrench, Users, AlertTriangle, Palette, TreePine } from 'lucide-react';
import { cn } from '@/lib/utils';

const LAYERS = [
  { id: 'operations', label: 'תפעול', icon: Wrench, color: 'bg-blue-500', activeColor: 'bg-blue-600' },
  { id: 'community', label: 'קהילה', icon: Users, color: 'bg-green-500', activeColor: 'bg-green-600' },
  { id: 'emergency', label: 'חירום', icon: AlertTriangle, color: 'bg-red-500', activeColor: 'bg-red-600' },
  { id: 'culture', label: 'תרבות', icon: Palette, color: 'bg-purple-500', activeColor: 'bg-purple-600' },
  { id: 'parks', label: 'גנים', icon: TreePine, color: 'bg-green-500', activeColor: 'bg-green-600' },
];

export default function LayerToggle({ selectedLayers, onLayerToggle }) {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200">
      {LAYERS.map(layer => {
        const Icon = layer.icon;
        const isActive = selectedLayers.includes(layer.id);
        
        return (
          <Button
            key={layer.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onLayerToggle(layer.id)}
            className={cn(
              'gap-2 transition-all duration-200',
              isActive && layer.activeColor,
              isActive && 'text-white shadow-md',
              !isActive && 'hover:bg-slate-100'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{layer.label}</span>
          </Button>
        );
      })}
    </div>
  );
}