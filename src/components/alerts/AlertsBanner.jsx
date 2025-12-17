import React, { useState } from 'react';
import { X, AlertTriangle, Info, Bell, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const TYPE_CONFIG = {
  emergency: { 
    icon: AlertTriangle, 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    label: 'חירום'
  },
  warning: { 
    icon: AlertTriangle, 
    bgColor: 'bg-amber-50', 
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    label: 'אזהרה'
  },
  info: { 
    icon: Info, 
    bgColor: 'bg-blue-50', 
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    label: 'מידע'
  },
  event: { 
    icon: Calendar, 
    bgColor: 'bg-purple-50', 
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600',
    label: 'אירוע'
  },
};

export default function AlertsBanner({ alerts, onDismiss }) {
  const [expandedId, setExpandedId] = useState(null);
  
  if (!alerts || alerts.length === 0) return null;

  // Sort by priority
  const sortedAlerts = [...alerts].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });

  return (
    <div className="space-y-2 p-3">
      {sortedAlerts.map(alert => {
        const config = TYPE_CONFIG[alert.type] || TYPE_CONFIG.info;
        const Icon = config.icon;
        const isExpanded = expandedId === alert.id;

        return (
          <div
            key={alert.id}
            className={cn(
              'rounded-xl border-2 transition-all duration-200',
              config.bgColor,
              config.borderColor,
              isExpanded && 'shadow-md'
            )}
          >
            <div className="p-3">
              <div className="flex items-start gap-3">
                <div className={cn('p-1.5 rounded-lg', config.bgColor)}>
                  <Icon className={cn('w-5 h-5', config.iconColor)} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-slate-800">{alert.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {config.label}
                    </Badge>
                    {alert.priority === 'critical' && (
                      <Badge className="bg-red-500 text-white text-xs animate-pulse">
                        דחוף
                      </Badge>
                    )}
                  </div>
                  
                  <p className={cn(
                    'text-sm text-slate-600 mt-1',
                    !isExpanded && 'line-clamp-2'
                  )}>
                    {alert.content}
                  </p>
                  
                  {alert.content.length > 100 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-xs"
                      onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                    >
                      {isExpanded ? 'הצג פחות' : 'קרא עוד'}
                    </Button>
                  )}
                  
                  {alert.affected_streets?.length > 0 && isExpanded && (
                    <div className="mt-2 text-xs text-slate-500">
                      <span className="font-medium">רחובות מושפעים: </span>
                      {alert.affected_streets.join(', ')}
                    </div>
                  )}
                </div>
                
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={() => onDismiss(alert.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}