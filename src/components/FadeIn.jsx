import { useFadeIn } from '@/hooks/use-fade-in';

/**
 * Duenner Wrapper um useFadeIn, damit sich ganze Sections einblenden lassen,
 * ohne jede Section-Komponente anzufassen.
 */
export default function FadeIn({ children, y, duration, start, delay, className }) {
  const ref = useFadeIn({ y, duration, start, delay });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
