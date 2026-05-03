'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share, PlusCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getInitialDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  const wasDismissed = localStorage.getItem('pwa-install-dismissed');
  if (wasDismissed) {
    const dismissedAt = parseInt(wasDismissed, 10);
    if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
      return true;
    }
  }
  return false;
}

function getInitialStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

function getInitialIos(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent);
  return isIosDevice && isSafari;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos] = useState(getInitialIos);
  const [isStandalone] = useState(getInitialStandalone);
  const [dismissed, setDismissed] = useState(getInitialDismissed);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (dismissed || isStandalone) return;

    // Android — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      bannerTimeoutRef.current = setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS — show banner after delay
    if (isIos) {
      bannerTimeoutRef.current = setTimeout(() => setShowBanner(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    };
  }, [dismissed, isStandalone, isIos]);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
    } catch {
      // Prompt failed
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  if (dismissed || isStandalone || !showBanner) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[100] safe-bottom"
        >
          <div className="mx-3 mb-3 p-4 bg-card border border-border/50 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              {/* App icon */}
              <div className="shrink-0 h-11 w-11 rounded-xl overflow-hidden border border-border/30">
                <img
                  src="/icon-192.png"
                  alt="SnapNote Pro"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground font-[family-name:var(--font-title)]">
                  Add to Home Screen
                </h3>
                <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                  {isIos ? (
                    <>
                      Tap <Share className="h-3 w-3 inline mx-0.5" /> then{' '}
                      <PlusCircle className="h-3 w-3 inline mx-0.5" />{' '}
                      &quot;Add to Home Screen&quot;
                    </>
                  ) : (
                    'Install SnapNote Pro for quick access like a native app'
                  )}
                </p>
              </div>

              <button
                onClick={handleDismiss}
                className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Install button for Android */}
            {!isIos && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="mt-3 w-full h-10 flex items-center justify-center gap-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl active:scale-[0.97] transition-transform"
              >
                <Download className="h-4 w-4" />
                Install App
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
