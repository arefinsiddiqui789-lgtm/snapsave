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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

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
    toast.success('Note created!');
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
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden">
        {/* Header — simple, no decoration */}
        <div className="px-5 pt-5 pb-3">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-[family-name:var(--font-title)]">
              New Note
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Give it a name and add some details. You can edit anytime.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <div className="px-5 py-3 space-y-4" onKeyDown={handleKeyDown}>
          <div className="space-y-1.5">
            <Label htmlFor="note-name" className="text-xs font-semibold text-foreground">
              Note Name <span className="text-destructive/70">*</span>
            </Label>
            <Input
              id="note-name"
              ref={nameInputRef}
              placeholder="e.g. Meeting Notes, Project Ideas…"
              className="h-9 text-sm border-border/50 focus:border-primary/40 transition-colors placeholder:text-muted-foreground"
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-details" className="text-xs font-semibold text-foreground">
              Note Details
            </Label>
            <Textarea
              id="note-details"
              placeholder="Write your note content here…"
              className="min-h-[120px] text-sm border-border/50 focus:border-primary/40 transition-colors resize-none placeholder:text-muted-foreground"
              value={noteDetails}
              onChange={(e) => setNoteDetails(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Optional — you can always add more later
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 pb-5 pt-1 flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="flex-1 h-9 text-sm border-border/50"
            onClick={() => setCreateNoteDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-9 text-sm gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground transition-all active:scale-[0.97] rounded-md"
            onClick={handleSave}
            disabled={!noteName.trim()}
          >
            <Plus className="h-3.5 w-3.5" />
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
