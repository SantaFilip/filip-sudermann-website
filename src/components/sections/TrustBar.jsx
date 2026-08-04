import React from 'react';
import { Layers, Target, Cpu, Boxes } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const iconMap = { Layers, Target, Cpu, Boxes };

export default function TrustBar() {
  const { t } = useLanguage();

  return (
    <section className="pt-2 pb-10">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <p className="text-base lg:text-lg font-bold text-foreground mb-4">{t.trustBarTitle}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {t.trustBar.map((item, i) => {
            const Icon = iconMap[item.icon] || Layers;
            return (
              <div key={i} className="flex items-start gap-3 py-6 px-4 lg:px-6 border-l border-border">
                <Icon size={20} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.sub ? <p className="text-xs text-muted-foreground">{item.sub}</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
