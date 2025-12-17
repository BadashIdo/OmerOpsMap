import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
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
import { Plus, Edit2, Trash2, Bell, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const EMPTY_MESSAGE = {
  title: '',
  content: '',
  type: 'info',
  priority: 'medium',
  is_active: true,
  affected_districts: [],
  affected_streets: [],
};

const EMPTY_SITE = {
  name: '',
  type: 'other',
  category: 'community',
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
    queryFn: () => base44.entities.LiveMessage.list('-created_date'),
  });

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list(),
  });

  const createMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.LiveMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveMessages'] });
      setIsMessageDialogOpen(false);
      resetMessageForm();
    },
  });

  const updateMessageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveMessage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveMessages'] });
      setIsMessageDialogOpen(false);
      resetMessageForm();
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id) => base44.entities.LiveMessage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liveMessages'] }),
  });

  const createSiteMutation = useMutation({
    mutationFn: (data) => base44.entities.Site.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsSiteDialogOpen(false);
      resetSiteForm();
    },
  });

  const updateSiteMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Site.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsSiteDialogOpen(false);
      resetSiteForm();
    },
  });

  const deleteSiteMutation = useMutation({
    mutationFn: (id) => base44.entities.Site.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sites'] }),
  });

  const resetMessageForm = () => {
    setFormData(EMPTY_MESSAGE);
    setEditingMessage(null);
  };

  const resetSiteForm = () => {
    setSiteFormData(EMPTY_SITE);
    setEditingSite(null);
  };

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
            <TabsTrigger value="messages" className="gap-2">
              <Bell className="w-4 h-4" />
              הודעות חיות
            </TabsTrigger>
            <TabsTrigger value="sites" className="gap-2">
              <MapPin className="w-4 h-4" />
              אתרים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>הודעות והתראות</CardTitle>
                <Dialog open={isMessageDialogOpen} onOpenChange={(open) => {
                  setIsMessageDialogOpen(open);
                  if (!open) resetMessageForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      הודעה חדשה
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>{editingMessage ? 'עריכת הודעה' : 'הודעה חדשה'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>כותרת</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>תוכן</Label>
                        <Textarea
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>סוג</Label>
                          <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info">מידע</SelectItem>
                              <SelectItem value="warning">אזהרה</SelectItem>
                              <SelectItem value="emergency">חירום</SelectItem>
                              <SelectItem value="event">אירוע</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>עדיפות</Label>
                          <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData({ ...formData, priority: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">נמוכה</SelectItem>
                              <SelectItem value="medium">בינונית</SelectItem>
                              <SelectItem value="high">גבוהה</SelectItem>
                              <SelectItem value="critical">קריטית</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label>הודעה פעילה</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                        ביטול
                      </Button>
                      <Button onClick={handleSubmitMessage} disabled={createMessageMutation.isPending || updateMessageMutation.isPending}>
                        {(createMessageMutation.isPending || updateMessageMutation.isPending) && (
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        )}
                        {editingMessage ? 'עדכון' : 'יצירה'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>כותרת</TableHead>
                        <TableHead>סוג</TableHead>
                        <TableHead>סטטוס</TableHead>
                        <TableHead>נוצר</TableHead>
                        <TableHead>פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((msg) => (
                        <TableRow key={msg.id}>
                          <TableCell className="font-medium">{msg.title}</TableCell>
                          <TableCell>
                            <Badge className={TYPE_COLORS[msg.type]}>
                              {msg.type === 'info' ? 'מידע' : msg.type === 'warning' ? 'אזהרה' : msg.type === 'emergency' ? 'חירום' : 'אירוע'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={msg.is_active ? 'default' : 'secondary'}>
                              {msg.is_active ? 'פעיל' : 'לא פעיל'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {msg.created_date && format(new Date(msg.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditMessage(msg)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => deleteMessageMutation.mutate(msg.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sites">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>ניהול אתרים</CardTitle>
                <Dialog open={isSiteDialogOpen} onOpenChange={(open) => {
                  setIsSiteDialogOpen(open);
                  if (!open) resetSiteForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      אתר חדש
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>{editingSite ? 'עריכת אתר' : 'אתר חדש'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>שם האתר</Label>
                        <Input
                          value={siteFormData.name}
                          onChange={(e) => setSiteFormData({ ...siteFormData, name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>סוג</Label>
                          <Select
                            value={siteFormData.type}
                            onValueChange={(value) => setSiteFormData({ ...siteFormData, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="education">חינוך</SelectItem>
                              <SelectItem value="sports">ספורט</SelectItem>
                              <SelectItem value="culture">תרבות</SelectItem>
                              <SelectItem value="emergency">חירום</SelectItem>
                              <SelectItem value="municipal">מוניציפלי</SelectItem>
                              <SelectItem value="health">בריאות</SelectItem>
                              <SelectItem value="outdoor_gym">מתקן כושר</SelectItem>
                              <SelectItem value="playground">גן משחקים</SelectItem>
                              <SelectItem value="shelter">מקלט</SelectItem>
                              <SelectItem value="synagogue">בית כנסת</SelectItem>
                              <SelectItem value="other">אחר</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>קטגוריה</Label>
                          <Select
                            value={siteFormData.category}
                            onValueChange={(value) => setSiteFormData({ ...siteFormData, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="operations">תפעול</SelectItem>
                              <SelectItem value="community">קהילה</SelectItem>
                              <SelectItem value="emergency">חירום</SelectItem>
                              <SelectItem value="culture">תרבות</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>כתובת</Label>
                        <Input
                          value={siteFormData.address}
                          onChange={(e) => setSiteFormData({ ...siteFormData, address: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>קו רוחב</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={siteFormData.latitude}
                            onChange={(e) => setSiteFormData({ ...siteFormData, latitude: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>קו אורך</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            value={siteFormData.longitude}
                            onChange={(e) => setSiteFormData({ ...siteFormData, longitude: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>טלפון</Label>
                        <Input
                          value={siteFormData.phone}
                          onChange={(e) => setSiteFormData({ ...siteFormData, phone: e.target.value })}
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label>תיאור</Label>
                        <Textarea
                          value={siteFormData.description}
                          onChange={(e) => setSiteFormData({ ...siteFormData, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>סטטוס</Label>
                        <Select
                          value={siteFormData.status}
                          onValueChange={(value) => setSiteFormData({ ...siteFormData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">פעיל</SelectItem>
                            <SelectItem value="inactive">לא פעיל</SelectItem>
                            <SelectItem value="maintenance">בתחזוקה</SelectItem>
                            <SelectItem value="emergency_open">פתוח בחירום</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSiteDialogOpen(false)}>
                        ביטול
                      </Button>
                      <Button onClick={handleSubmitSite} disabled={createSiteMutation.isPending || updateSiteMutation.isPending}>
                        {(createSiteMutation.isPending || updateSiteMutation.isPending) && (
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        )}
                        {editingSite ? 'עדכון' : 'יצירה'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {sitesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>שם</TableHead>
                          <TableHead>סוג</TableHead>
                          <TableHead>כתובת</TableHead>
                          <TableHead>סטטוס</TableHead>
                          <TableHead>פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sites.map((site) => (
                          <TableRow key={site.id}>
                            <TableCell className="font-medium">{site.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{site.type}</Badge>
                            </TableCell>
                            <TableCell className="text-slate-500">{site.address}</TableCell>
                            <TableCell>
                              <Badge variant={site.status === 'active' ? 'default' : 'secondary'}>
                                {site.status === 'active' ? 'פעיל' : site.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditSite(site)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => deleteSiteMutation.mutate(site.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}