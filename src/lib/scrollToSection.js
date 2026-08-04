export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, y);
  html.style.scrollBehavior = prev;
}
