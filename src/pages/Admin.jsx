
import React, { useState } from 'react';
import apiClient from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit2, Trash2, Bell, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const transformSiteData = (rawSite) => {
  if (!rawSite) return null;
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

  const subCategoryMap = {
    'מתקני ספורט': 'sports',
    'מוסדות חינוך': 'education',
    'פנאי': 'leisure',
  };

  return {
    id: rawSite.site_symbol,
    name: rawSite.site_name,
    category: rawSite.category,
    sub_category: subCategoryMap[rawSite.sub_category] || rawSite.sub_category,
    description: rawSite.description,
    address: rawSite.address,
    latitude: latitude || rawSite.latitude,
    longitude: longitude || rawSite.longitude,
    ...rawSite,
  };
};

const reverseTransformSiteData = (formData) => {
  const reverseSubCategoryMap = {
    'sports': 'מתקני ספורט',
    'education': 'מוסדות חינוך',
    'leisure': 'פנאי',
  };

  const payload = {
    site_name: formData.name,
    site_symbol: formData.id,
    category: formData.category, 
    sub_category: reverseSubCategoryMap[formData.sub_category] || formData.sub_category,
    description: formData.description,
    address: formData.address,
    latitude: formData.latitude,
    longitude: formData.longitude,
    status: formData.status,
    phone: formData.phone,
  };
  
  Object.keys(payload).forEach(key => {
    if (payload[key] === null || payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

const EMPTY_MESSAGE = {
  title: '',
  content: '',
  type: 'info',
  priority: 'medium',
  is_active: true,
};

const EMPTY_SITE = {
  name: '',
  sub_category: 'other',
  category: 'קהילה',
  address: '',
  latitude: 31.2647,
  longitude: 34.8497,
  status: 'active',
  phone: '',
  description: '',
};

export default function Admin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('messages');
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isSiteDialogOpen, setIsSiteDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editingSite, setEditingSite] = useState(null);
  const [formData, setFormData] = useState(EMPTY_MESSAGE);
  const [siteFormData, setSiteFormData] = useState(EMPTY_SITE);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['liveMessages'],
    queryFn: async () => (await apiClient.get('/live-messages', { params: { sort: '-created_date' } })).data,
  });

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
        const response = await apiClient.get('/sites');
        const rawData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        return rawData.map(transformSiteData).filter(Boolean);
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: (data) => apiClient.post('/live-messages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveMessages'] });
      setIsMessageDialogOpen(false);
    },
  });

  const updateMessageMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.patch(`/live-messages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveMessages'] });
      setIsMessageDialogOpen(false);
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/live-messages/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liveMessages'] }),
  });

  const createSiteMutation = useMutation({
    mutationFn: (data) => apiClient.post('/sites', reverseTransformSiteData(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsSiteDialogOpen(false);
    },
  });

  const updateSiteMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.patch(`/sites/${id}`, reverseTransformSiteData(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsSiteDialogOpen(false);
    },
  });

  const deleteSiteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/sites/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sites'] }),
  });

  const handleOpenNewMessageDialog = () => {
    setEditingMessage(null);
    setFormData(EMPTY_MESSAGE);
    setIsMessageDialogOpen(true);
  }

  const handleOpenNewSiteDialog = () => {
    setEditingSite(null);
    setSiteFormData(EMPTY_SITE);
    setIsSiteDialogOpen(true);
  }

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setFormData(message);
    setIsMessageDialogOpen(true);
  };

  const handleEditSite = (site) => {
    setEditingSite(site);
    setSiteFormData(site);
    setIsSiteDialogOpen(true);
  };

  const handleSubmitMessage = () => {
    if (editingMessage) {
      updateMessageMutation.mutate({ id: editingMessage.id, data: formData });
    } else {
      createMessageMutation.mutate(formData);
    }
  };

  const handleSubmitSite = () => {
    if (editingSite) {
      updateSiteMutation.mutate({ id: editingSite.id, data: siteFormData });
    } else {
      createSiteMutation.mutate(siteFormData);
    }
  };

  const TYPE_COLORS = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-amber-100 text-amber-800',
    emergency: 'bg-red-100 text-red-800',
    event: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">ניהול עומר על המפה</h1>
                    <p className="text-sm text-slate-500">פאנל ניהול למנהלי המועצה</p>
                </div>
                <Link to={createPageUrl('Home')}>
                    <Button variant="outline">חזרה למפה</Button>
                </Link>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="messages"><Bell className="w-4 h-4 ml-2" />הודעות חיות</TabsTrigger>
                    <TabsTrigger value="sites"><MapPin className="w-4 h-4 ml-2" />אתרים</TabsTrigger>
                </TabsList>

                <TabsContent value="messages">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>הודעות והתראות</CardTitle>
                            <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                                <DialogTrigger asChild><Button onClick={handleOpenNewMessageDialog}><Plus className="w-4 h-4 ml-2" />הודעה חדשה</Button></DialogTrigger>
                                <DialogContent className="max-w-lg" dir="rtl">
                                    <DialogHeader><DialogTitle>{editingMessage ? 'עריכת הודעה' : 'הודעה חדשה'}</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div><Label htmlFor="msg-title">כותרת</Label><Input id="msg-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
                                        <div><Label htmlFor="msg-content">תוכן</Label><Textarea id="msg-content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={3} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label>סוג</Label><Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="info">מידע</SelectItem><SelectItem value="warning">אזהרה</SelectItem><SelectItem value="emergency">חירום</SelectItem><SelectItem value="event">אירוע</SelectItem></SelectContent></Select></div>
                                            <div><Label>עדיפות</Label><Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">נמוכה</SelectItem><SelectItem value="medium">בינונית</SelectItem><SelectItem value="high">גבוהה</SelectItem><SelectItem value="critical">קריטית</SelectItem></SelectContent></Select></div>
                                        </div>
                                        <div className="flex items-center gap-2"><Switch id="msg-active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} /><Label htmlFor="msg-active">הודעה פעילה</Label></div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>ביטול</Button>
                                        <Button onClick={handleSubmitMessage} disabled={createMessageMutation.isPending || updateMessageMutation.isPending}>
                                            {(createMessageMutation.isPending || updateMessageMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                            {editingMessage ? 'עדכון' : 'יצירה'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {messagesLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> : <Table><TableHeader><TableRow><TableHead>כותרת</TableHead><TableHead>סוג</TableHead><TableHead>סטטוס</TableHead><TableHead>נוצר</TableHead><TableHead>פעולות</TableHead></TableRow></TableHeader><TableBody>{messages.map((msg) => (<TableRow key={msg.id}><TableCell className="font-medium">{msg.title}</TableCell><TableCell><Badge className={TYPE_COLORS[msg.type]}>{msg.type}</Badge></TableCell><TableCell><Badge variant={msg.is_active ? 'default' : 'secondary'}>{msg.is_active ? 'פעיל' : 'לא פעיל'}</Badge></TableCell><TableCell className="text-slate-500 text-sm">{msg.created_date && format(new Date(msg.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => handleEditMessage(msg)}><Edit2 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => deleteMessageMutation.mutate(msg.id)}><Trash2 className="w-4 h-4" /></Button></div></TableCell></TableRow>))}</TableBody></Table>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sites">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>ניהול אתרים</CardTitle>
                            <Dialog open={isSiteDialogOpen} onOpenChange={setIsSiteDialogOpen}>
                                <DialogTrigger asChild><Button onClick={handleOpenNewSiteDialog}><Plus className="w-4 h-4 ml-2" />אתר חדש</Button></DialogTrigger>
                                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
                                    <DialogHeader><DialogTitle>{editingSite ? 'עריכת אתר' : 'אתר חדש'}</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div><Label htmlFor="site-name">שם האתר</Label><Input id="site-name" value={siteFormData.name || ''} onChange={(e) => setSiteFormData({ ...siteFormData, name: e.target.value })} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label>תת-קטגוריה</Label><Select value={siteFormData.sub_category || ''} onValueChange={(value) => setSiteFormData({ ...siteFormData, sub_category: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sports">מתקני ספורט</SelectItem><SelectItem value="education">מוסדות חינוך</SelectItem><SelectItem value="leisure">פנאי</SelectItem><SelectItem value="other">אחר</SelectItem></SelectContent></Select></div>
                                            <div><Label>קטגוריה</Label><Select value={siteFormData.category || ''} onValueChange={(value) => setSiteFormData({ ...siteFormData, category: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="תפעול">תפעול</SelectItem><SelectItem value="קהילה">קהילה</SelectItem></SelectContent></Select></div>
                                        </div>
                                        <div><Label htmlFor="site-address">כתובת</Label><Input id="site-address" value={siteFormData.address || ''} onChange={(e) => setSiteFormData({ ...siteFormData, address: e.target.value })} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label htmlFor="site-lat">קו רוחב</Label><Input id="site-lat" type="number" step="any" value={siteFormData.latitude || ''} onChange={(e) => setSiteFormData({ ...siteFormData, latitude: parseFloat(e.target.value) || null })} /></div>
                                            <div><Label htmlFor="site-lon">קו אורך</Label><Input id="site-lon" type="number" step="any" value={siteFormData.longitude || ''} onChange={(e) => setSiteFormData({ ...siteFormData, longitude: parseFloat(e.target.value) || null })} /></div>
                                        </div>
                                        <div><Label htmlFor="site-phone">טלפון</Label><Input id="site-phone" value={siteFormData.phone || ''} onChange={(e) => setSiteFormData({ ...siteFormData, phone: e.target.value })} dir="ltr" /></div>
                                        <div><Label htmlFor="site-desc">תיאור</Label><Textarea id="site-desc" value={siteFormData.description || ''} onChange={(e) => setSiteFormData({ ...siteFormData, description: e.target.value })} /></div>
                                        <div><Label>סטטוס</Label><Select value={siteFormData.status || ''} onValueChange={(value) => setSiteFormData({ ...siteFormData, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">פעיל</SelectItem><SelectItem value="inactive">לא פעיל</SelectItem><SelectItem value="maintenance">בתחזוקה</SelectItem><SelectItem value="emergency_open">פתוח בחירום</SelectItem></SelectContent></Select></div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsSiteDialogOpen(false)}>ביטול</Button>
                                        <Button onClick={handleSubmitSite} disabled={createSiteMutation.isPending || updateSiteMutation.isPending}>
                                            {(createSiteMutation.isPending || updateSiteMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                            {editingSite ? 'עדכון' : 'יצירה'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {sitesLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>שם</TableHead><TableHead>קטגוריה</TableHead><TableHead>כתובת</TableHead><TableHead>סטטוס</TableHead><TableHead>פעולות</TableHead></TableRow></TableHeader><TableBody>{sites.map((site) => (<TableRow key={site.id || site.name}><TableCell className="font-medium">{site.name}</TableCell><TableCell><Badge variant="secondary">{site.sub_category}</Badge></TableCell><TableCell className="text-slate-500">{site.address}</TableCell><TableCell><Badge variant={site.status === 'active' ? 'default' : 'secondary'}>{site.status || 'לא ידוע'}</Badge></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => handleEditSite(site)} disabled={!site.id}><Edit2 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => deleteSiteMutation.mutate(site.id)} disabled={!site.id}><Trash2 className="w-4 h-4" /></Button></div></TableCell></TableRow>))}</TableBody></Table></div>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    </div>
  );
}
