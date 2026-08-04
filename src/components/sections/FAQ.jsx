import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function FAQ() {
  const { t } = useLanguage();

  return (
    <section id="faq" className="py-20 lg:py-32 border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
          <div className="lg:col-span-1">
            <div className="inline-flex flex-row items-center gap-4 border-2 border-accent rounded-xl px-6 py-3 mb-5 bg-card">
              <span className="text-[34px] lg:text-[40px] font-heading font-extrabold tracking-tight text-accent leading-tight">6</span>
              <span className="text-[28px] lg:text-[34px] font-heading font-extrabold tracking-tight text-foreground leading-tight">FAQ</span>
            </div>
            <h2 className="text-[2.8rem] lg:text-[4.5rem] font-heading font-bold tracking-tight leading-[1.05]">{t.faq.title}</h2>
          </div>
          <div className="lg:col-span-2">
            <Accordion type="single" collapsible className="w-full">
              {t.faq.items.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border">
                  <AccordionTrigger className="text-left text-[18px] lg:text-[20px] font-heading font-semibold hover:no-underline py-6">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
