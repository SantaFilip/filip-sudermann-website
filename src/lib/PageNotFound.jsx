import { useLocation, Link } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-heading font-light text-muted-foreground/40">404</h1>
          <div className="h-0.5 w-16 bg-border mx-auto"></div>
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-heading font-medium text-foreground">Seite nicht gefunden</h2>
          <p className="text-muted-foreground leading-relaxed">
            Die Seite <span className="font-medium text-foreground">"{pageName}"</span> konnte nicht gefunden werden.
          </p>
        </div>
        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:border-accent transition-colors"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
