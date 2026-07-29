import { ReactNode } from 'react';

interface StateCardProps {
  title: string;
  description: string;
  action?: ReactNode;
  tone?: 'default' | 'danger';
}

export function StateCard({ title, description, action, tone = 'default' }: StateCardProps) {
  return (
    <article aria-live="polite" className={tone === 'danger' ? 'card error' : 'card'}>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </article>
  );
}

export function LoadingState() {
  return <StateCard title="Загрузка" description="Пожалуйста, подождите." />;
}

export function EmptyState() {
  return <StateCard title="Пусто" description="По текущим фильтрам данных нет." />;
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <StateCard
      title="Не удалось загрузить данные"
      description={message ?? 'Попробуйте повторить запрос.'}
      tone="danger"
      action={onRetry ? <button onClick={onRetry}>Повторить</button> : null}
    />
  );
}

export function PageShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className="container">
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      {children}
    </main>
  );
}
