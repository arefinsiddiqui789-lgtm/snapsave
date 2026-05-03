'use client';

import { useEffect, useCallback, useState } from 'react';
import { useNoteStore } from '@/store/note-store';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/snapnote/sidebar';
import { Editor } from '@/components/snapnote/editor';
import { RightPanel } from '@/components/snapnote/right-panel';
import { CreateNoteDialog } from '@/components/snapnote/create-note-dialog';
import { AuthScreen } from '@/components/snapnote/auth-screen';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Moon,
  Sun,
  PanelLeft,
  PanelRight,
  Plus,
  LogOut,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export default function Home() {
  const { theme, setTheme } = useTheme();
  const setCreateNoteDialogOpen = useNoteStore((s) => s.setCreateNoteDialogOpen);
  const activeNoteId = useNoteStore((s) => s.activeNoteId);
  const notes = useNoteStore((s) => s.notes);
  const cleanupExpiredNotes = useNoteStore((s) => s.cleanupExpiredNotes);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [authReady, setAuthReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);

  // Wait for auth store to hydrate from localStorage
  useEffect(() => {
    const timer = setTimeout(() => setAuthReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Cleanup expired notes periodically
  useEffect(() => {
    cleanupExpiredNotes();
    const interval = setInterval(cleanupExpiredNotes, 30000);
    return () => clearInterval(interval);
  }, [cleanupExpiredNotes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setCreateNoteDialogOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        if (activeNoteId) {
          const { togglePin } = useNoteStore.getState();
          togglePin(activeNoteId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCreateNoteDialogOpen, activeNoteId]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Show loading while auth hydrates
  if (!authReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Mobile header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/80 backdrop-blur-sm">
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <PanelLeft className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[300px]">
              <Sidebar />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold font-[family-name:var(--font-title)] text-foreground">
              SnapNote Pro
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCreateNoteDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Sheet open={mobileRightPanelOpen} onOpenChange={setMobileRightPanelOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <PanelRight className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-[280px]">
                <RightPanel />
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => {
                logout();
                toast.success('Logged out');
              }}
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile editor */}
        <div className="flex-1 overflow-hidden">
          <Editor />
        </div>

        {/* Create Note Dialog */}
        <CreateNoteDialog />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main editor */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top bar with theme toggle */}
        <div className="absolute top-2 right-3 z-10 flex items-center gap-1">
          {authUser && (
            <span className="text-[11px] text-muted-foreground mr-1 hidden sm:inline">
              {authUser.username}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => {
              logout();
              toast.success('Logged out');
            }}
            title="Log out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Editor />
      </div>

      {/* Right panel */}
      <RightPanel />

      {/* Create Note Dialog */}
      <CreateNoteDialog />
    </div>
  );
}
