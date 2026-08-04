import React from 'react';
import { useToast } from '@/components/ui/use-toast';

export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-foreground text-background px-5 py-3 rounded-lg shadow-lg text-sm max-w-xs animate-in fade-in slide-in-from-bottom-2"
        >
          <p className="font-semibold">{t.title}</p>
          {t.description && <p className="text-background/70 text-xs mt-0.5">{t.description}</p>}
        </div>
      ))}
    </div>
  );
}
