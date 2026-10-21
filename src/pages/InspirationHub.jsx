import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe, Users, Rocket, Mail, Clapperboard, Bot, TrendingUp, Package, Download, Maximize2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const iconMap = { Globe, Users, Rocket, Mail, Clapperboard, Bot, TrendingUp, Package };

export default function InspirationHub() {
  const { t } = useLanguage();
  const items = t.folders.services.items;
  const hub = t.inspirationHub;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border sticky top-0 bg-background/85 backdrop-blur-md z-40">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link to="/" className="font-heading font-bold tracking-tight">Filip Sudermann</Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft size={14} /> {hub.back}
          </Link>
        </div>
      </div>
      <main className="py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-14 lg:mb-20">
            <h1 className="text-4xl lg:text-6xl font-heading font-bold tracking-tight leading-[1.05]">{hub.title}</h1>
            <p className="text-muted-foreground mt-5 max-w-2xl text-lg leading-relaxed">{hub.subtitle}</p>
          </div>
          <div className="space-y-14">
            {items.map((item, i) => {
              const Icon = iconMap[item.icon] || Globe;
              const num = String(i + 1).padStart(2, '0');
              const res = hub.resources[i];
              return (
                <section id={`topic-${i}`} key={i} className="border-t border-border pt-10 scroll-mt-24">
                  <div className="inline-flex items-baseline gap-4 lg:gap-5 border-2 border-accent rounded-xl px-6 lg:px-8 py-3 lg:py-4 mb-5 max-w-full">
                    <span className="text-[34px] lg:text-[40px] font-heading font-extrabold tracking-tight text-accent leading-tight shrink-0">{num}</span>
                    <span className="text-[28px] lg:text-[34px] font-heading font-extrabold tracking-tight text-foreground leading-tight">{item.title}</span>
                  </div>
                  <div className="flex items-start gap-3 mb-8 max-w-2xl">
                    <Icon size={20} className="text-accent mt-1 shrink-0" />
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                  {res && (
                    <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 max-w-5xl">
                      <a
                        href={res.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={hub.openImage}
                        className="group relative block overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-lg transition-shadow"
                      >
                        <img
                          src={res.image}
                          alt={res.imageAlt}
                          width={1600}
                          height={1200}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-auto aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 size={12} /> {hub.openImage}
                        </span>
                      </a>
                      <a
                        href={res.pdf}
                        download
                        className="group flex flex-col justify-between rounded-xl bg-primary text-primary-foreground p-7 lg:p-8 hover:-translate-y-0.5 transition-transform"
                      >
                        <div>
                          <h3 className="text-3xl lg:text-4xl font-heading font-bold leading-tight">{res.pdfTitle}</h3>
                          <p className="mt-3 text-primary-foreground/75 leading-relaxed">{res.pdfDesc}</p>
                        </div>
                        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                          <span className="text-xs text-primary-foreground/60">{hub.pages}</span>
                          <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-accent text-accent-foreground px-4 py-2.5 text-sm font-semibold group-hover:brightness-105">
                            <Download size={16} /> {hub.download}
                          </span>
                        </div>
                      </a>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
