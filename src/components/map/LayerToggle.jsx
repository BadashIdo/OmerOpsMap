import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Wrench, Users, AlertTriangle, 
  Trash2, Recycle, Route, TreeDeciduous,
  Palmtree, Calendar, GraduationCap, Dumbbell,
  Shield, Bell,
  ChevronDown, ChevronUp,
  Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const CATEGORIES = [
  {
    id: 'operations',
    label: 'תפעול',
    icon: Wrench,
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500',
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
    textColor: 'text-green-600',
    borderColor: 'border-green-500',
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
    textColor: 'text-red-600',
    borderColor: 'border-red-500',
    subLayers: [
      { id: 'public_shelters', label: 'מקלטים ציבוריים', icon: Shield },
      { id: 'emergency_alerts', label: 'התראות חירום', icon: Bell },
    ]
  },
];

export default function LayerToggle({ selectedLayers, onLayerToggle, siteCounts = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(['operations', 'community', 'emergency']);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const totalActive = selectedLayers.length;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="w-12 h-12 rounded-full bg-white shadow-lg border border-slate-200 hover:bg-slate-50"
          >
            <Menu className="w-6 h-6 text-slate-700" />
            {totalActive > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full text-xs text-white flex items-center justify-center font-medium">
                {totalActive}
              </span>
            )}
          </Button>
        </SheetTrigger>
        
        <SheetContent side="right" className="w-80 p-0">
          <SheetHeader className="p-4 border-b bg-gradient-to-l from-blue-600 to-blue-700">
            <SheetTitle className="text-white text-right flex items-center gap-2">
              <span>שכבות מפה</span>
            </SheetTitle>
          </SheetHeader>
          
          <div className="overflow-y-auto h-[calc(100vh-80px)]">
            {CATEGORIES.map(category => {
              const Icon = category.icon;
              const isExpanded = expandedCategories.includes(category.id);
              const activeSubCount = category.subLayers.filter(s => selectedLayers.includes(s.id)).length;
              const totalSubCount = category.subLayers.reduce((sum, s) => sum + (siteCounts[s.id] || 0), 0);
              
              return (
                <div key={category.id} className="border-b border-slate-100">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-slate-50',
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', category.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-slate-800">{category.label}</p>
                      <p className="text-xs text-slate-500">
                        {activeSubCount}/{category.subLayers.length} שכבות פעילות
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  
                  {/* Sub Layers */}
                  {isExpanded && (
                    <div className="bg-slate-50 py-2">
                      {category.subLayers.map(subLayer => {
                        const SubIcon = subLayer.icon;
                        const isActive = selectedLayers.includes(subLayer.id);
                        const count = siteCounts[subLayer.id] || 0;
                        
                        return (
                          <button
                            key={subLayer.id}
                            onClick={() => onLayerToggle(subLayer.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-200',
                              isActive ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                            )}
                          >
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                              isActive ? category.color : 'bg-slate-200'
                            )}>
                              <SubIcon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-500')} />
                            </div>
                            <div className="flex-1 text-right">
                              <p className={cn(
                                'text-sm transition-all',
                                isActive ? 'font-medium text-slate-800' : 'text-slate-600'
                              )}>
                                {subLayer.label}
                              </p>
                            </div>
                            <div className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              isActive ? `${category.color} text-white` : 'bg-slate-200 text-slate-600'
                            )}>
                              {count}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}