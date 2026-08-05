// Haelt die aktive Lenis-Instanz, damit auch Nicht-Komponenten wie
// scrollToSection darauf zugreifen koennen. Ist null, solange Lenis nicht
// laeuft - etwa bei prefers-reduced-motion oder vor dem ersten Effect.
let instance = null;

export const setLenis = (lenis) => {
  instance = lenis;
};

export const getLenis = () => instance;
