// Ein Creator = eine Datei in diesem Ordner, erreichbar unter /pitch/<slug>.
// Neue Datei anlegen (Vorlage: neda-rezawi.js) und hier eintragen.
//
// Recherche pro Creator, in dieser Reihenfolge:
// 1. Linktree (oder Link in der Bio) lesen: welche Plattformen, Podcast,
//    Telegram, bestehende Angebote es wirklich gibt.
// 2. Instagram- und TikTok-Profil per Handle (VidIQ).
// 3. YouTube ueber den Handle aus dem Linktree suchen, nicht ueber den
//    Namen: kleine Kanaele fehlen im Kanal-Index und heissen oft anders
//    (Nedas Kanal heisst nur "Neda").
// 4. Letzte Videos/Reels: Themen und Ausreisser fuer Staerken und Community.
import nedaRezawi from './neda-rezawi';
import jessicaLenz from './jessica-lenz';
import annaSchepperle from './anna-schepperle';
import nicoleFrizler from './nicole-frizler';
import hannahMedic from './hannah-medic';
import paruaEsmahil from './parua-esmahil';

const CREATORS = [nedaRezawi, jessicaLenz, annaSchepperle, nicoleFrizler, hannahMedic, paruaEsmahil];

export const findeCreator = (slug) => CREATORS.find((c) => c.slug === slug);
