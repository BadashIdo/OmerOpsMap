import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Navigation, Phone, Clock, MapPin, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORY_LABELS = {
  operations: 'תפעול',
  community: 'קהילה',
  emergency: 'חירום',
  culture: 'תרבות',
};

const TYPE_LABELS = {
  education: 'חינוך',
  sports: 'ספורט',
  culture: 'תרבות',
  emergency: 'חירום',
  municipal: 'מוניציפלי',
  health: 'בריאות',
  outdoor_gym: 'מתקן כושר',
  playground: 'גן משחקים',
  shelter: 'מקלט',
  synagogue: 'בית כנסת',
  other: 'אחר',
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  emergency_open: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  active: 'פעיל',
  inactive: 'לא פעיל',
  maintenance: 'בתחזוקה',
  emergency_open: 'פתוח בחירום',
};

export default function SiteCard({ site, onClose, onDelete }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
  }, []);

  if (!site) return null;

  const canDelete = currentUser && site.is_user_report && site.created_by === currentUser.email;

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הדיווח הזה?')) return;
    
    setIsDeleting(true);
    try {
      await base44.entities.Site.delete(site.id);
      if (onDelete) onDelete(site.id);
      onClose();
    } catch (error) {
      alert('אירעה שגיאה במחיקת הדיווח');
      setIsDeleting(false);
    }
  };

  const openNavigation = (app) => {
    const { latitude, longitude, name } = site;
    let url;
    
    if (app === 'waze') {
      url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes&z=17`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(name)}`;
    }
    
    window.open(url, '_blank');
  };

  return (
    <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/95 backdrop-blur-sm shadow-2xl border-0 z-10 animate-in slide-in-from-bottom-4 duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-slate-800">
              {site.name}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {TYPE_LABELS[site.type] || site.type}
              </Badge>
              <Badge className={STATUS_COLORS[site.status] || STATUS_COLORS.active}>
                {STATUS_LABELS[site.status] || 'פעיל'}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {site.address && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{site.address}</span>
          </div>
        )}
        
        {site.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-slate-500" />
            <a href={`tel:${site.phone}`} className="text-blue-600 hover:underline" dir="ltr">
              {site.phone}
            </a>
          </div>
        )}
        
        {site.opening_hours && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{site.opening_hours}</span>
          </div>
        )}
        
        {site.description && (
          <p className="text-sm text-slate-600 border-t pt-3">
            {site.description}
          </p>
        )}
        

        
        {canDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full gap-2"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting ? 'מוחק...' : 'מחק דיווח'}
                      </Button>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => openNavigation('google')}
                      >
                        <Navigation className="w-4 h-4" />
                        Google Maps
                      </Button>
                      <Button
                        className="flex-1 gap-2 bg-[#33CCFF] hover:bg-[#00AADD] text-white"
                        onClick={() => openNavigation('waze')}
                      >
                        <Navigation className="w-4 h-4" />
                        Waze
                      </Button>
                    </div>
      </CardContent>
    </Card>
  );
}