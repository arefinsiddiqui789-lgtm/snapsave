'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const BKASH_NUMBER = '01701659879';

function BkashLogo() {
  return (
    <svg viewBox="0 0 120 120" className="h-16 w-16" fill="none">
      {/* Background circle */}
      <circle cx="60" cy="60" r="56" fill="#E2136E" />
      {/* bKash &quot;b&quot; stylized mark */}
      <path
        d="M42 35c0-2 1.5-3.5 3.5-3.5h6c8 0 14 4 14 12s-6 12-14 12h-2.5v14c0 2-1.5 3.5-3.5 3.5s-3.5-1.5-3.5-3.5V35zm7 16.5h2.5c4 0 7-2 7-7.5s-3-7.5-7-7.5H49v15z"
        fill="white"
      />
      <path
        d="M62 52c0-2 1.5-3.5 3.5-3.5h4c6 0 11 3 11 10 0 4-2 7-5 8.5l5 10c1 2 0 4-2 4.5-2 .5-3.5-.5-4.5-2.5l-5.5-11H69v10c0 2-1.5 3.5-3.5 3.5S62 80 62 78V52zm7 11.5h1c3.5 0 5.5-1.5 5.5-5s-2-5-5.5-5H69v10z"
        fill="white"
      />
    </svg>
  );
}

export function BkashDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(BKASH_NUMBER);
      setCopied(true);
      toast.success('Number copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] p-0 gap-0 overflow-hidden">
        {/* bKash header */}
        <div className="bg-[#E2136E] px-5 pt-6 pb-5 text-center">
          <div className="flex justify-center mb-3">
            <BkashLogo />
          </div>
          <h2 className="text-lg font-bold text-white font-[family-name:var(--font-title)]">
            Support the Developer
          </h2>
          <p className="text-[13px] text-white/80 mt-1">
            Send bKash to help keep SnapNote Pro going
          </p>
        </div>

        {/* Number section */}
        <div className="px-5 py-5">
          <div className="bg-[#E2136E]/5 dark:bg-[#E2136E]/10 rounded-xl p-4 border border-[#E2136E]/15">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#E2136E]/70 mb-2">
              bKash Number
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-2xl font-bold text-foreground font-mono tracking-wider">
                {BKASH_NUMBER}
              </span>
              <Button
                onClick={handleCopy}
                size="sm"
                className={`h-9 gap-1.5 rounded-lg text-xs font-semibold transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                    : 'bg-[#E2136E] text-white hover:bg-[#E2136E]/90'
                }`}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 space-y-2">
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">How to send:</span>
            </p>
            <ol className="text-[12px] text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Open your bKash app</li>
              <li>Go to <span className="font-medium text-foreground">Send Money</span></li>
              <li>Enter the number above</li>
              <li>Send any amount you like</li>
            </ol>
          </div>

          {/* Developer credit */}
          <div className="mt-5 pt-3 border-t border-border/30 text-center">
            <p className="text-[11px] font-medium text-foreground">
              Developed By Arefin Siddiqui
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Studying in CSE at IUB
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
