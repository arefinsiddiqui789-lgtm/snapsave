'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { useNoteStore } from '@/store/note-store';
import { formatDateTime, formatDate } from '@/types/note';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pin,
  Flame,
  Clock,
  Copy,
  Trash2,
  Maximize2,
  Check,
  Tags,
  Loader2,
  Wand2,
  ImageIcon,
  X,
  AlignLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

function getWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function getCharCount(text: string): number {
  return text.length;
}

function getReadTime(words: number): string {
  const minutes = Math.ceil(words / 200);
  if (minutes <= 1) return '< 1 min read';
  return `${minutes} min read`;
}

/** Compress image client-side: max 1200px width, quality 0.7 JPEG */
function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_WIDTH = 1200;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        'image/jpeg',
        0.7
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export function Editor() {
  const activeNoteId = useNoteStore((s) => s.activeNoteId);
  const activeNote = useNoteStore((s) => s.notes.find((n) => n.id === s.activeNoteId));
  const updateNote = useNoteStore((s) => s.updateNote);
  const deleteNote = useNoteStore((s) => s.deleteNote);
  const togglePin = useNoteStore((s) => s.togglePin);
  const toggleHighPriority = useNoteStore((s) => s.toggleHighPriority);
  const setCreateNoteDialogOpen = useNoteStore((s) => s.setCreateNoteDialogOpen);
  const setIsAiLoading = useNoteStore((s) => s.setIsAiLoading);
  const isAiLoading = useNoteStore((s) => s.isAiLoading);
  const addImage = useNoteStore((s) => s.addImage);
  const removeImage = useNoteStore((s) => s.removeImage);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [localTitle, setLocalTitle] = useState('');
  const [localContent, setLocalContent] = useState('');
  const isLocalEdit = useRef(false);

  useEffect(() => {
    if (activeNote) {
      if (!isLocalEdit.current) {
        setLocalTitle(activeNote.title);
        setLocalContent(activeNote.content);
      }
      setLastSavedAt(activeNote.updatedAt);
      if (!activeNote.content.trim() && !activeNote.title.trim()) {
        setTimeout(() => titleRef.current?.focus(), 150);
      }
    }
    isLocalEdit.current = false;
  }, [activeNoteId]);

  const flushAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (activeNoteId) {
      isLocalEdit.current = true;
      updateNote(activeNoteId, { title: localTitle, content: localContent });
      setLastSavedAt(Date.now());
    }
  }, [activeNoteId, localTitle, localContent, updateNote]);

  const triggerAutoSave = useCallback(
    (field: 'title' | 'content', value: string) => {
      if (!activeNoteId) return;
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        isLocalEdit.current = true;
        updateNote(activeNoteId, { [field]: value });
        const now = Date.now();
        setLastSavedAt(now);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      }, 300);
    },
    [activeNoteId, updateNote]
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setLocalTitle(val);
      triggerAutoSave('title', val);
      const target = e.target;
      target.style.height = 'auto';
      target.style.height = target.scrollHeight + 'px';
    },
    [triggerAutoSave]
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setLocalContent(val);
      triggerAutoSave('content', val);
    },
    [triggerAutoSave]
  );

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (titleRef.current && activeNote) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [activeNoteId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  const handleCopy = useCallback(async () => {
    if (!activeNote) return;
    const text = `${activeNote.title}\n\n${activeNote.content}`;
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, [activeNote]);

  const handleDelete = useCallback(() => {
    if (!activeNoteId) return;
    deleteNote(activeNoteId);
    toast.success('Note deleted');
  }, [activeNoteId, deleteNote]);

  const handleSummarize = useCallback(async () => {
    if (!localContent.trim()) {
      toast.error('Write something first');
      return;
    }
    flushAutoSave();
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: localContent }),
      });
      if (!res.ok) {
        toast.error('Failed to reach AI. Please try again.');
        return;
      }
      const data = await res.json();
      if (data.summary) {
        const newContent = `${localContent}\n\n---\n✨ Summary:\n${data.summary}`;
        isLocalEdit.current = true;
        setLocalContent(newContent);
        updateNote(activeNoteId!, { content: newContent });
        toast.success('Summary added!');
      } else {
        toast.error(data.error || 'Failed to summarize');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  }, [localContent, activeNoteId, updateNote, setIsAiLoading, flushAutoSave]);

  const handleSuggestTags = useCallback(async () => {
    if (!localContent.trim()) {
      toast.error('Write something first');
      return;
    }
    flushAutoSave();
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: localContent }),
      });
      if (!res.ok) {
        toast.error('Failed to reach AI. Please try again.');
        return;
      }
      const data = await res.json();
      if (data.tags && Array.isArray(data.tags)) {
        const { addTag: addTagAction } = useNoteStore.getState();
        const currentNote = useNoteStore.getState().notes.find((n) => n.id === activeNoteId);
        let added = 0;
        data.tags.forEach((tag: string) => {
          if (currentNote && !currentNote.tags.includes(tag)) {
            addTagAction(activeNoteId!, tag);
            added++;
          }
        });
        toast.success(`Added ${added} tag${added !== 1 ? 's' : ''}`);
      } else {
        toast.error(data.error || 'Failed to suggest tags');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  }, [localContent, activeNoteId, setIsAiLoading, flushAutoSave]);

  /** Upload a file: compress → POST → addImage */
  const uploadFile = useCallback(
    async (file: File) => {
      if (!activeNoteId) {
        toast.error('Select a note first');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, GIF, WebP images are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }

      setIsUploading(true);
      try {
        // Compress client-side
        const compressed = await compressImage(file);

        const formData = new FormData();
        formData.append('file', compressed);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Upload failed');
          return;
        }

        const data = await res.json();
        if (data.url) {
          addImage(activeNoteId, data.url);
          toast.success('Image added');
        } else {
          toast.error('Upload failed');
        }
      } catch {
        toast.error('Failed to upload image');
      } finally {
        setIsUploading(false);
      }
    },
    [activeNoteId, addImage]
  );

  const handleImageButton = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [uploadFile]
  );

  const handleRemoveImage = useCallback(
    (imageUrl: string) => {
      if (!activeNoteId) return;
      removeImage(activeNoteId, imageUrl);
      toast.success('Image removed');
    },
    [activeNoteId, removeImage]
  );

  // Paste from clipboard support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!activeNoteId) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            uploadFile(file);
          }
          break;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [activeNoteId, uploadFile]);

  // Drag and drop support
  useEffect(() => {
    const editorArea = document.getElementById('editor-area');
    if (!editorArea) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set to false if we're leaving the editor area entirely
      const rect = editorArea.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setIsDragOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        for (const file of files) {
          if (file.type.startsWith('image/')) {
            uploadFile(file);
            break;
          }
        }
      }
    };

    editorArea.addEventListener('dragover', handleDragOver);
    editorArea.addEventListener('dragleave', handleDragLeave);
    editorArea.addEventListener('drop', handleDrop);

    return () => {
      editorArea.removeEventListener('dragover', handleDragOver);
      editorArea.removeEventListener('dragleave', handleDragLeave);
      editorArea.removeEventListener('drop', handleDrop);
    };
  }, [uploadFile]);

  const wordCount = getWordCount(localContent);
  const charCount = getCharCount(localContent);

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-sm px-6">
          <div className="text-5xl mb-5 opacity-70">📝</div>
          <h2 className="text-xl font-bold text-foreground font-[family-name:var(--font-title)]">
            Start writing
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Create a note and let your thoughts flow. Simple, fast, and always saved.
          </p>
          <Button
            onClick={() => setCreateNoteDialogOpen(true)}
            className="mt-5 gap-2 bg-primary/90 hover:bg-primary text-primary-foreground transition-all active:scale-[0.97] rounded-md"
          >
            <span className="text-lg leading-none">+</span>
            New Note
          </Button>
          <div className="mt-6 flex items-center justify-center gap-5 text-[11px] text-muted-foreground">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono">Ctrl+N</kbd>
              {' '}new
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono">Ctrl+F</kbd>
              {' '}search
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full bg-background ${isFocusMode ? 'focus-mode' : ''}`}>
      {/* Toolbar — minimal, like a real editor */}
      {!isFocusMode && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40">
          <div className="flex items-center gap-0.5">
            <ToolBtn
              icon={<Pin className={`h-3.5 w-3.5 ${activeNote.isPinned ? 'text-amber-500 fill-amber-500' : ''}`} />}
              onClick={() => togglePin(activeNote.id)}
              title={activeNote.isPinned ? 'Unpin' : 'Pin'}
              active={activeNote.isPinned}
            />
            <ToolBtn
              icon={<Flame className={`h-3.5 w-3.5 ${activeNote.isHighPriority ? 'text-red-500' : ''}`} />}
              onClick={() => toggleHighPriority(activeNote.id)}
              title="Priority"
              active={activeNote.isHighPriority}
            />
            <div className="w-px h-3.5 bg-border/40 mx-1.5" />
            <ToolBtn
              icon={<ImageIcon className="h-3.5 w-3.5" />}
              onClick={handleImageButton}
              title="Add Image"
              disabled={isUploading}
            />
            <ToolBtn icon={<Copy className="h-3.5 w-3.5" />} onClick={handleCopy} title="Copy" />
            <ToolBtn icon={<Trash2 className="h-3.5 w-3.5" />} onClick={handleDelete} title="Delete" destructive />
            <div className="w-px h-3.5 bg-border/40 mx-1.5" />
            <ToolBtn
              icon={isAiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              onClick={handleSummarize}
              title="Summarize"
              primary
              disabled={isAiLoading || !localContent.trim()}
            />
            <ToolBtn
              icon={<Tags className="h-3.5 w-3.5" />}
              onClick={handleSuggestTags}
              title="Auto-Tag"
              disabled={isAiLoading || !localContent.trim()}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <AnimatePresence>
              {showSaved && lastSavedAt && (
                <motion.span
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Saved
                </motion.span>
              )}
            </AnimatePresence>
            {(isAiLoading || isUploading) && (
              <span className="flex items-center gap-1.5 text-[11px] text-primary/70 font-medium">
                <Loader2 className="h-3 w-3 animate-spin" />
                {isUploading ? 'Uploading…' : 'Thinking…'}
              </span>
            )}
            <ToolBtn
              icon={<Maximize2 className="h-3.5 w-3.5" />}
              onClick={() => setIsFocusMode(true)}
              title="Focus mode"
            />
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Focus mode bar */}
      {isFocusMode && (
        <div className="flex items-center justify-between px-5 py-2">
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {localTitle || 'Untitled'}
          </span>
          <div className="flex items-center gap-3">
            {(isAiLoading || isUploading) && (
              <span className="flex items-center gap-1.5 text-[11px] text-primary/70 font-medium">
                <Loader2 className="h-3 w-3 animate-spin" />
              </span>
            )}
            <AnimatePresence>
              {showSaved && lastSavedAt && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                </motion.span>
              )}
            </AnimatePresence>
            <button
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsFocusMode(false)}
            >
              Exit focus
            </button>
          </div>
        </div>
      )}

      {/* Editor — paper-like, breathing space */}
      <div className="flex-1 overflow-auto relative" id="editor-area">
        {/* Drop zone overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-primary/5 border-2 border-dashed border-primary/40 rounded-lg flex items-center justify-center"
            >
              <div className="text-center">
                <ImageIcon className="h-10 w-10 text-primary/50 mx-auto mb-2" />
                <p className="text-sm font-medium text-primary/70">Drop image here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`mx-auto px-6 py-8 md:px-12 md:py-10 ${isFocusMode ? 'max-w-[640px]' : 'max-w-3xl'}`}>
          {/* Title */}
          <textarea
            ref={titleRef}
            value={localTitle}
            onChange={handleTitleChange}
            placeholder="Note title…"
            className="w-full text-2xl md:text-3xl font-bold bg-transparent border-none outline-none resize-none font-[family-name:var(--font-title)] text-foreground placeholder:text-muted-foreground leading-tight overflow-hidden"
            rows={1}
            style={{ height: 'auto' }}
          />

          {/* Meta — light, informational */}
          <div className="flex items-center gap-2.5 mt-2.5 mb-6 text-[11px] text-muted-foreground flex-wrap">
            <span>{formatDateTime(activeNote.createdAt)}</span>
            {activeNote.updatedAt !== activeNote.createdAt && (
              <>
                <span>·</span>
                <span>edited {formatDate(activeNote.updatedAt)}</span>
              </>
            )}
            {wordCount > 0 && (
              <>
                <span>·</span>
                <span>{wordCount} words</span>
              </>
            )}
          </div>

          {/* Tags — small, like real sticky labels */}
          {activeNote.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-4">
              {activeNote.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] px-2 py-0 h-5 font-medium cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors bg-secondary/70"
                  onClick={() => {
                    const { removeTag } = useNoteStore.getState();
                    removeTag(activeNote.id, tag);
                    toast.success(`Tag "${tag}" removed`);
                  }}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          )}

          {/* Status pills — minimal */}
          {!isFocusMode && (
            <div className="flex items-center gap-1.5 mb-4">
              {activeNote.isPinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/15 px-2 py-0.5 rounded">
                  <Pin className="h-2.5 w-2.5" /> Pinned
                </span>
              )}
              {activeNote.isHighPriority && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/15 px-2 py-0.5 rounded">
                  <Flame className="h-2.5 w-2.5" /> Priority
                </span>
              )}
              {activeNote.isTemporary && activeNote.expiresAt && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/15 px-2 py-0.5 rounded countdown-pulse">
                  <Clock className="h-2.5 w-2.5" /> Self-destruct
                </span>
              )}
            </div>
          )}

          {/* Images grid */}
          {activeNote.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {activeNote.images.map((imageUrl) => (
                <div
                  key={imageUrl}
                  className="group relative rounded-lg overflow-hidden border border-border/30 bg-secondary/20"
                >
                  <img
                    src={imageUrl}
                    alt="Note attachment"
                    className="w-full h-32 object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(imageUrl)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 border border-border/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                    title="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload progress indicator */}
          {isUploading && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Loader2 className="h-4 w-4 animate-spin text-primary/70" />
              <span className="text-xs text-primary/70 font-medium">Uploading image…</span>
            </div>
          )}

          {/* Content — generous line height, comfortable reading */}
          <textarea
            ref={contentRef}
            value={localContent}
            onChange={handleContentChange}
            placeholder="Start writing…"
            className="w-full min-h-[55vh] bg-transparent border-none outline-none resize-none text-[15px] md:text-[16px] leading-[1.85] text-foreground placeholder:text-muted-foreground font-[family-name:var(--font-body)] transition-colors"
          />
        </div>
      </div>

      {/* Bottom bar — quiet, like a book footer */}
      <div className="flex items-center justify-between px-5 py-1.5 border-t border-border/40 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          {wordCount > 0 && (
            <>
              <span className="inline-flex items-center gap-1">
                <AlignLeft className="h-2.5 w-2.5" />
                {wordCount} words
              </span>
              <span>{charCount} chars</span>
              <span>{getReadTime(wordCount)}</span>
            </>
          )}
          {activeNote.images.length > 0 && (
            <>
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="h-2.5 w-2.5" />
                {activeNote.images.length} {activeNote.images.length === 1 ? 'image' : 'images'}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastSavedAt && (
            <span className="inline-flex items-center gap-1">
              <Check className="h-2.5 w-2.5" />
              Saved
            </span>
          )}
          {isFocusMode && (
            <span className="text-primary/60">ESC to exit</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolBtn({
  icon,
  onClick,
  title,
  active = false,
  primary = false,
  destructive = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  primary?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={disabled}
      className={`h-7 w-7 transition-all active:scale-90 rounded-md ${
        active
          ? primary
            ? 'bg-primary/10 text-primary'
            : 'bg-secondary/80'
          : destructive
            ? 'text-muted-foreground hover:text-destructive'
            : primary
              ? 'text-primary/70 hover:text-primary hover:bg-primary/10'
              : 'text-muted-foreground hover:text-foreground'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
      onClick={onClick}
      title={title}
    >
      {icon}
    </Button>
  );
}
