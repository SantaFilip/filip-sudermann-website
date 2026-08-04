import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { IMAGES } from '@/lib/links';
import { Image } from '@/components/ui/image';

export default function AboutContent() {
  const { t } = useLanguage();
  const about = t.folders.about;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
      <div className="lg:col-span-5">
        <div className="relative aspect-[3/4] bg-secondary overflow-hidden rounded-[36px]">
          <Image src={IMAGES.aboutPortrait} alt="Filip Sudermann" className="w-full h-full" fittingType="fill" />
          <span className="absolute bottom-4 left-5 text-sm font-medium text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            ~ Filip Sudermann, 2026
          </span>
        </div>
      </div>

      <div className="lg:col-span-7">
        <p className="text-muted-foreground leading-relaxed mb-6">{about.bio1}</p>
        <p className="text-muted-foreground leading-relaxed mb-6">{about.bio2}</p>

        <div className="mb-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <div className="rounded-xl p-5 lg:max-w-[54%] shrink-0 w-full" style={{ border: '1px solid hsl(var(--accent) / 0.45)', background: 'hsl(var(--accent) / 0.05)' }}>
            <p className="text-xl lg:text-2xl font-heading font-bold mb-3 text-foreground">{about.languagesTitle}</p>
            <div className="flex flex-wrap gap-2.5">
              {about.languageNames.map((l) => (
                <span key={l} className="px-3.5 py-1.5 rounded-md text-sm font-medium" style={{ border: '1px solid hsl(var(--accent) / 0.4)', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}>{l}</span>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display italic font-bold text-xl lg:text-2xl text-foreground leading-snug">"{about.quote}"</p>
            <p className="text-sm font-semibold text-foreground mt-2">~ {about.quoteAuthor}</p>
          </div>
        </div>
        <div className="border-t border-border pt-6">
          <p className="text-xl lg:text-2xl font-heading font-bold mb-4 text-foreground">{about.guaranteeTitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {about.checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 border border-accent flex items-center justify-center shrink-0">
                  <Check size={12} className="text-accent" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
