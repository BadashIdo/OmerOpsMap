import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Navigation, MapPin, Dumbbell, Baby, TreePine } from 'lucide-react';

export default function ParkCard({ park, onClose }) {
  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${park.latitude},${park.longitude}`;
    window.open(url, '_blank');
  };

  const openWaze = () => {
    const url = `https://www.waze.com/ul?ll=${park.latitude},${park.longitude}&navigate=yes`;
    window.open(url, '_blank');
  };

  const getCategoryIcon = () => {
    if (park.category === 'גינת כושר') return <Dumbbell className="w-5 h-5" />;
    if (park.category === 'גן ילדים') return <Baby className="w-5 h-5" />;
    if (park.category === 'שטח ציבורי') return <TreePine className="w-5 h-5" />;
    return null;
  };

  const getCategoryColor = () => {
    if (park.category === 'גינת כושר') return 'bg-blue-100 text-blue-800';
    if (park.category === 'גן ילדים') return 'bg-pink-100 text-pink-800';
    if (park.category === 'שטח ציבורי') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="absolute bottom-4 right-4 left-4 z-20 md:left-auto md:w-96">
      <Card className="shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{park.name}</CardTitle>
              <Badge className={getCategoryColor()}>
                <span className="flex items-center gap-1">
                  {getCategoryIcon()}
                  {park.category}
                </span>
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {park.symbol && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">סמל: {park.symbol}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={openGoogleMaps}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Navigation className="w-4 h-4 ml-2" />
              Google Maps
            </Button>
            <Button
              onClick={openWaze}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600"
            >
              <Navigation className="w-4 h-4 ml-2" />
              Waze
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}