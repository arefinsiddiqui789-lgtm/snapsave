'use client';

import { useState, useCallback, useRef } from 'react';
import { useNoteStore } from '@/store/note-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function CreateNoteDialog() {
  const createNoteDialogOpen = useNoteStore((s) => s.createNoteDialogOpen);
  const setCreateNoteDialogOpen = useNoteStore((s) => s.setCreateNoteDialogOpen);
  const createNote = useNoteStore((s) => s.createNote);

  const [noteName, setNoteName] = useState('');
  const [noteDetails, setNoteDetails] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        // Reset form when dialog opens
        setNoteName('');
        setNoteDetails('');
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
      setCreateNoteDialogOpen(open);
    },
    [setCreateNoteDialogOpen]
  );

  const handleSave = useCallback(() => {
    const name = noteName.trim();
    const details = noteDetails.trim();

    if (!name) {
      toast.error('Please enter a note name');
      nameInputRef.current?.focus();
      return;
    }

    createNote(name, details);
    toast.success('Note created successfully!');
  }, [noteName, noteDetails, createNote]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  return (
    <Dialog open={createNoteDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold font-[family-name:var(--font-title)]">
                  Create New Note
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Fill in the details below. You can edit anytime later.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4" onKeyDown={handleKeyDown}>
          {/* Note Name */}
          <div className="space-y-2">
            <Label htmlFor="note-name" className="text-sm font-semibold text-foreground/90">
              <FileText className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5 text-primary" />
              Note Name
            </Label>
            <Input
              id="note-name"
              ref={nameInputRef}
              placeholder="e.g. Meeting Notes, Project Ideas…"
              className="h-10 text-sm border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all"
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
              maxLength={120}
            />
          </div>

          {/* Note Details */}
          <div className="space-y-2">
            <Label htmlFor="note-details" className="text-sm font-semibold text-foreground/90">
              <Plus className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5 text-primary" />
              Note Details
            </Label>
            <Textarea
              id="note-details"
              placeholder="Write your note content here…"
              className="min-h-[140px] text-sm border-border/60 focus:border-primary/50 focus:ring-primary/20 transition-all resize-none"
              value={noteDetails}
              onChange={(e) => setNoteDetails(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground/50">
              You can always edit and add more details later
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-5 pt-2 flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="flex-1 h-9 text-sm"
            onClick={() => setCreateNoteDialogOpen(false)}
          >
            Cancel
          </Button>
          <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
            <Button
              className="w-full h-9 text-sm gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              onClick={handleSave}
              disabled={!noteName.trim()}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Save Note
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
