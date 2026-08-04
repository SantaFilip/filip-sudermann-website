import React from 'react';
import { Mail, MapPin, Phone, Linkedin, Instagram, Youtube } from 'lucide-react';
import SkoolLogo from '@/components/SkoolLogo';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CONTACT_EMAIL, CONTACT_PHONE, SOCIAL_LINKS, SKOOL_PROFILE_URL } from '@/lib/links';

export default function Footer() {
  const { t } = useLanguage();

  const navItems = [
    { label: t.nav.services, href: '#services' },
    { label: t.nav.results, href: '#results' },
    { label: t.nav.about, href: '#about' },
    { label: t.nav.process, href: '#process' },
  ];

  return (
    <footer id="contact" className="bg-foreground text-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <p className="font-heading font-bold text-lg mb-3">Filip Sudermann</p>
            <p className="text-background/60 text-sm leading-relaxed">{t.footer.tagline}</p>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-background/50 mb-4">{t.footer.navTitle}</p>
            <ul className="space-y-2.5">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-sm text-background/80 hover:text-accent transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-background/50 mb-4">{t.footer.legalTitle}</p>
            <ul className="space-y-2.5">
              {t.footer.legal.map((item) => (
                <li key={item.path}>
                  <a href={item.path} className="text-sm text-background/80 hover:text-accent transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-background/50 mb-4">{t.footer.connectTitle}</p>
            <div className="space-y-3">
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 text-sm text-background/80 hover:text-accent transition-colors">
                <Mail size={14} /> {CONTACT_EMAIL}
              </a>
              <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm text-background/80 hover:text-accent transition-colors">
                <Phone size={14} /> {CONTACT_PHONE}
              </a>
              <p className="flex items-start gap-2 text-sm text-background/80">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span>{t.footer.contact.address1}<br />{t.footer.contact.address2}<br />{t.footer.contact.country}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/50">{t.footer.copyright}</p>
          <div className="flex items-center gap-5">
            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-accent transition-colors" aria-label="LinkedIn">
              <Linkedin size={18} />
            </a>
            <a href={SKOOL_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity flex items-center" aria-label="Skool">
              <SkoolLogo size={20} />
            </a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-accent transition-colors" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-accent transition-colors" aria-label="YouTube">
              <Youtube size={18} />
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-background/60 hover:text-accent transition-colors" aria-label="Email">
              <Mail size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
