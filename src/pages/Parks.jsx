import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Dumbbell, Baby, TreePine, Map } from "lucide-react";
import ParksMap from "../components/ParksMap";

export default function ParksPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const { data: parks, isLoading } = useQuery({
        queryKey: ['parks'],
        queryFn: () => base44.entities.Park.list(),
        initialData: [],
    });

    const filteredParks = parks.filter(park =>
        park.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        park.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const fitnessParks = filteredParks.filter(p => p.category === "גינת כושר");
    const childrenParks = filteredParks.filter(p => p.category === "גן ילדים");
    const publicParks = filteredParks.filter(p => p.category === "שטח ציבורי");

    const getCategoryIcon = (category) => {
        switch (category) {
            case "גינת כושר":
                return <Dumbbell className="w-5 h-5" />;
            case "גן ילדים":
                return <Baby className="w-5 h-5" />;
            case "שטח ציבורי":
                return <TreePine className="w-5 h-5" />;
            default:
                return null;
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case "גינת כושר":
                return "bg-blue-100 text-blue-800";
            case "גן ילדים":
                return "bg-pink-100 text-pink-800";
            case "שטח ציבורי":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const ParkCard = ({ park }) => (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{park.name}</CardTitle>
                        <Badge className={getCategoryColor(park.category)}>
                            <span className="flex items-center gap-1">
                                {getCategoryIcon(park.category)}
                                {park.category}
                            </span>
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {park.symbol && (
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">סמל:</span> {park.symbol}
                        </p>
                    )}
                    <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 text-gray-500 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{park.address}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const ParksList = ({ parks, emptyMessage }) => (
        parks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
                {emptyMessage}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parks.map((park) => (
                    <ParkCard key={park.id} park={park} />
                ))}
            </div>
        )
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6 flex items-center justify-center">
                <div className="text-xl">טוען...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">גנים ושטחים ציבוריים בעומר</h1>
                    <p className="text-gray-600">מידע על כל הגנים והשטחים הציבוריים ביישוב</p>
                </div>

                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="חיפוש לפי שם או כתובת..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10 text-right"
                        />
                    </div>
                </div>

                <Tabs defaultValue="map" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-6">
                        <TabsTrigger value="map">
                            <Map className="w-4 h-4 ml-2" />
                            מפה
                        </TabsTrigger>
                        <TabsTrigger value="all">
                            הכל ({filteredParks.length})
                        </TabsTrigger>
                        <TabsTrigger value="fitness">
                            <Dumbbell className="w-4 h-4 ml-2" />
                            גינות כושר ({fitnessParks.length})
                        </TabsTrigger>
                        <TabsTrigger value="children">
                            <Baby className="w-4 h-4 ml-2" />
                            גני ילדים ({childrenParks.length})
                        </TabsTrigger>
                        <TabsTrigger value="public">
                            <TreePine className="w-4 h-4 ml-2" />
                            שטחים ציבוריים ({publicParks.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="map">
                        <ParksMap parks={filteredParks} />
                    </TabsContent>

                    <TabsContent value="all">
                        <ParksList 
                            parks={filteredParks} 
                            emptyMessage="לא נמצאו תוצאות"
                        />
                    </TabsContent>

                    <TabsContent value="fitness">
                        <ParksList 
                            parks={fitnessParks} 
                            emptyMessage="לא נמצאו גינות כושר"
                        />
                    </TabsContent>

                    <TabsContent value="children">
                        <ParksList 
                            parks={childrenParks} 
                            emptyMessage="לא נמצאו גני ילדים"
                        />
                    </TabsContent>

                    <TabsContent value="public">
                        <ParksList 
                            parks={publicParks} 
                            emptyMessage="לא נמצאו שטחים ציבוריים"
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}