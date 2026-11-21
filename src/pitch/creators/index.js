// Ein Creator = eine Datei in diesem Ordner, erreichbar unter /pitch/<slug>.
// Neue Datei anlegen (Vorlage: neda-rezawi.js) und hier eintragen.
import nedaRezawi from './neda-rezawi';

const CREATORS = [nedaRezawi];

export const findeCreator = (slug) => CREATORS.find((c) => c.slug === slug);
