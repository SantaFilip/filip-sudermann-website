import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe, Users, Rocket, Mail, Clapperboard, Bot, TrendingUp, Package, Image as ImageIcon, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const iconMap = { Globe, Users, Rocket, Mail, Clapperboard, Bot, TrendingUp, Package };

export default function InspirationHub() {
  const { t } = useLanguage();
  const items = t.folders.services.items;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border sticky top-0 bg-background/85 backdrop-blur-md z-40">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link to="/" className="font-heading font-bold tracking-tight">Filip Sudermann</Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft size={14} /> {t.inspirationHub.back}
          </Link>
        </div>
      </div>
      <main className="py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-14 lg:mb-20">
            <h1 className="text-4xl lg:text-6xl font-heading font-bold tracking-tight leading-[1.05]">{t.inspirationHub.title}</h1>
            <p className="text-muted-foreground mt-5 max-w-2xl text-lg leading-relaxed">{t.inspirationHub.subtitle}</p>
          </div>
          <div className="space-y-14">
            {items.map((item, i) => {
              const Icon = iconMap[item.icon] || Globe;
              const num = String(i + 1).padStart(2, '0');
              return (
                <section id={`topic-${i}`} key={i} className="border-t border-border pt-10 scroll-mt-24">
                  <div className="inline-flex flex-col border-2 border-accent rounded-xl px-6 py-3 mb-5">
                    <span className="text-[34px] lg:text-[40px] font-heading font-extrabold tracking-tight text-accent leading-tight -translate-y-1 lg:-translate-y-1.5">{num}</span>
                    <span className="text-[28px] lg:text-[34px] font-heading font-extrabold tracking-tight text-foreground leading-tight mt-1">{item.title}</span>
                  </div>
                  <div className="flex items-start gap-3 mb-8 max-w-2xl">
                    <Icon size={20} className="text-accent mt-1 shrink-0" />
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                    <div className="border-2 border-dashed border-border rounded-xl aspect-[4/3] flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon size={28} className="mb-2" />
                      <p className="text-sm font-medium">{t.inspirationHub.photo}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{t.inspirationHub.comingSoon}</p>
                    </div>
                    <div className="border-2 border-dashed border-border rounded-xl aspect-[4/3] flex flex-col items-center justify-center text-muted-foreground">
                      <FileText size={28} className="mb-2" />
                      <p className="text-sm font-medium">{t.inspirationHub.pdf}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{t.inspirationHub.comingSoon}</p>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
