import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wrench, Users, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  { 
    id: 'operations', 
    label: 'תפעול', 
    icon: Wrench,
    subCategories: [
      { id: 'waste_centers', label: 'ריכוזי אשפה' },
      { id: 'recycling', label: 'כלי מחזור' },
      { id: 'sweeping_routes', label: 'מסלולי טיאוט' },
      { id: 'pruning_stations', label: 'עמדות גזם' },
      { id: 'leisure', label: 'פנאי' },
    ]
  },
  { 
    id: 'community', 
    label: 'קהילה ותרבות', 
    icon: Users,
    subCategories: [
      { id: 'upcoming_events', label: 'אירועים קרובים' },
      { id: 'education', label: 'מוסדות חינוך' },
      { id: 'sports', label: 'מתקני ספורט ופנאי' },
    ]
  },
  { 
    id: 'emergency', 
    label: 'חירום וביטחון', 
    icon: AlertTriangle,
    subCategories: [
      { id: 'public_shelters', label: 'מקלטים ציבוריים' },
      { id: 'emergency_alerts', label: 'התראות חירום' },
    ]
  },
];

export default function ReportDialog({ isOpen, onClose, location, onSubmit }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCategory = CATEGORIES.find(c => c.id === category);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !category || !subCategory) return;

    setIsSubmitting(true);
    await onSubmit({
      name,
      category,
      sub_category: subCategory,
      description,
      latitude: location.lat,
      longitude: location.lng,
    });
    
    // Reset form
    setName('');
    setCategory('');
    setSubCategory('');
    setDescription('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setName('');
    setCategory('');
    setSubCategory('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>דיווח על נקודת עניין חדשה</DialogTitle>
          <DialogDescription>
            האם תרצה לדווח על נקודת עניין במיקום זה?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם המקום *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: גן משחקים חדש"
              required
            />
          </div>

          <div className="space-y-2">
                          <Label htmlFor="category">קטגוריה *</Label>
                          <Select value={category} onValueChange={(val) => { setCategory(val); setSubCategory(''); }} required>
                            <SelectTrigger id="category">
                              <SelectValue placeholder="בחר קטגוריה" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                return (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="w-4 h-4" />
                                      {cat.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedCategory && (
                          <div className="space-y-2">
                            <Label htmlFor="subCategory">תת קטגוריה *</Label>
                            <Select value={subCategory} onValueChange={setSubCategory} required>
                              <SelectTrigger id="subCategory">
                                <SelectValue placeholder="בחר תת קטגוריה" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedCategory.subCategories.map((sub) => (
                                  <SelectItem key={sub.id} value={sub.id}>
                                    {sub.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="הוסף פרטים נוספים..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={!name || !category || !subCategory || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'שולח...' : 'שלח דיווח'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}