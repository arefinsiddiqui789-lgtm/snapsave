import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Note,
  FilterType,
  createNewNote,
  TEMPORARY_DURATIONS,
  TemporaryDuration,
} from '@/types/note';

interface NoteState {
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  activeFilter: FilterType;
  selectedTag: string | null;
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  isAiLoading: boolean;
  createNoteDialogOpen: boolean;
  bkashDialogOpen: boolean;

  // Actions
  createNote: (title?: string, content?: string) => string;
  deleteNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  setActiveNote: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: FilterType) => void;
  setSelectedTag: (tag: string | null) => void;
  togglePin: (id: string) => void;
  toggleHighPriority: (id: string) => void;
  setTemporary: (id: string, duration: TemporaryDuration) => void;
  setTemporaryCustom: (id: string, ms: number) => void;
  removeTemporary: (id: string) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  cleanupExpiredNotes: () => void;
  setSidebarOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setIsAiLoading: (loading: boolean) => void;
  setCreateNoteDialogOpen: (open: boolean) => void;
  setBkashDialogOpen: (open: boolean) => void;
  getActiveNote: () => Note | undefined;
  getFilteredNotes: () => Note[];
  getAllTags: () => string[];
}

let noteIdCounter = 0;

function generateId(): string {
  noteIdCounter++;
  return `note_${Date.now()}_${noteIdCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      activeNoteId: null,
      searchQuery: '',
      activeFilter: 'all',
      selectedTag: null,
      sidebarOpen: true,
      rightPanelOpen: true,
      isAiLoading: false,
      createNoteDialogOpen: false,
      bkashDialogOpen: false,

      createNote: (title?: string, content?: string) => {
        const id = generateId();
        const newNote = {
          ...createNewNote(id),
          title: title || '',
          content: content || '',
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: id,
          createNoteDialogOpen: false,
        }));
        return id;
      },

      deleteNote: (id) => {
        set((state) => {
          const newNotes = state.notes.filter((n) => n.id !== id);
          const newActiveId =
            state.activeNoteId === id
              ? newNotes.length > 0
                ? newNotes[0].id
                : null
              : state.activeNoteId;
          return { notes: newNotes, activeNoteId: newActiveId };
        });
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) => {
            if (note.id !== id) return note;
            return {
              ...note,
              ...updates,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      setActiveNote: (id) => {
        set({ activeNoteId: id });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setActiveFilter: (filter) => {
        set({ activeFilter: filter });
      },

      setSelectedTag: (tag) => {
        set({ selectedTag: tag, activeFilter: tag ? 'tags' : 'all' });
      },

      togglePin: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, isPinned: !note.isPinned, updatedAt: Date.now() } : note
          ),
        }));
      },

      toggleHighPriority: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, isHighPriority: !note.isHighPriority, updatedAt: Date.now() }
              : note
          ),
        }));
      },

      setTemporary: (id, duration) => {
        const ms = TEMPORARY_DURATIONS[duration];
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  isTemporary: true,
                  expiresAt: Date.now() + ms,
                  updatedAt: Date.now(),
                }
              : note
          ),
        }));
      },

      setTemporaryCustom: (id, ms) => {
        if (ms <= 0) return;
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  isTemporary: true,
                  expiresAt: Date.now() + ms,
                  updatedAt: Date.now(),
                }
              : note
          ),
        }));
      },

      removeTemporary: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, isTemporary: false, expiresAt: null, updatedAt: Date.now() }
              : note
          ),
        }));
      },

      addTag: (id, tag) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id && !note.tags.includes(tag)
              ? { ...note, tags: [...note.tags, tag], updatedAt: Date.now() }
              : note
          ),
        }));
      },

      removeTag: (id, tag) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, tags: note.tags.filter((t) => t !== tag), updatedAt: Date.now() }
              : note
          ),
        }));
      },

      cleanupExpiredNotes: () => {
        const now = Date.now();
        set((state) => {
          const newNotes = state.notes.filter(
            (note) => !note.isTemporary || !note.expiresAt || note.expiresAt > now
          );
          const newActiveId = newNotes.find((n) => n.id === state.activeNoteId)
            ? state.activeNoteId
            : newNotes.length > 0
              ? newNotes[0].id
              : null;
          return { notes: newNotes, activeNoteId: newActiveId };
        });
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
      setIsAiLoading: (loading) => set({ isAiLoading: loading }),
      setCreateNoteDialogOpen: (open) => set({ createNoteDialogOpen: open }),
      setBkashDialogOpen: (open) => set({ bkashDialogOpen: open }),

      getActiveNote: () => {
        const state = get();
        return state.notes.find((n) => n.id === state.activeNoteId);
      },

      getFilteredNotes: () => {
        const state = get();
        let filtered = [...state.notes];

        // Clean up expired notes first
        const now = Date.now();
        filtered = filtered.filter(
          (note) => !note.isTemporary || !note.expiresAt || note.expiresAt > now
        );

        // Apply search
        if (state.searchQuery.trim()) {
          const q = state.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (note) =>
              note.title.toLowerCase().includes(q) ||
              note.content.toLowerCase().includes(q) ||
              note.tags.some((t) => t.toLowerCase().includes(q))
          );
        }

        // Apply filter
        switch (state.activeFilter) {
          case 'pinned':
            filtered = filtered.filter((n) => n.isPinned);
            break;
          case 'high-priority':
            filtered = filtered.filter((n) => n.isHighPriority);
            break;
          case 'temporary':
            filtered = filtered.filter((n) => n.isTemporary);
            break;
          case 'tags':
            if (state.selectedTag) {
              filtered = filtered.filter((n) => n.tags.includes(state.selectedTag!));
            }
            break;
        }

        // Sort: pinned first, then by updatedAt
        filtered.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          if (a.isHighPriority !== b.isHighPriority) return a.isHighPriority ? -1 : 1;
          return b.updatedAt - a.updatedAt;
        });

        return filtered;
      },

      getAllTags: () => {
        const state = get();
        const tags = new Set<string>();
        state.notes.forEach((note) => note.tags.forEach((tag) => tags.add(tag)));
        return Array.from(tags).sort();
      },
    }),
    {
      name: 'snapnote-pro-storage',
      version: 1,
      partialize: (state) => ({
        notes: state.notes,
        activeNoteId: state.activeNoteId,
      }),
      migrate: (persisted: Record<string, unknown>, version: number) => {
        if (version === 0) {
          // Remove old `versions` field from notes (v0 → v1)
          if (Array.isArray(persisted.notes)) {
            persisted.notes = persisted.notes.map((note: Record<string, unknown>) => {
              const { versions: _v, ...rest } = note;
              return rest;
            });
          }
        }
        return persisted as NoteState;
      },
    }
  )
);
