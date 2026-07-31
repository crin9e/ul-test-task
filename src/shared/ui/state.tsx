import { ReactNode } from "react";
import styles from "./state.module.css";

interface StateCardProps {
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "default" | "danger";
}

interface StatePageProps extends StateCardProps {
  busy?: boolean;
}

export function StateCard({
  title,
  description,
  action,
  tone = "default",
}: StateCardProps) {
  return (
    <article
      aria-live="polite"
      className={`${styles.stateCard} ${tone === "danger" ? styles.error : ""}`}
    >
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </article>
  );
}

function StatePage({ busy = false, ...cardProps }: StatePageProps) {
  return (
    <main className="container" aria-busy={busy || undefined}>
      <StateCard {...cardProps} />
    </main>
  );
}

export function LoadingState() {
  return (
    <StatePage busy title="Загрузка" description="Пожалуйста, подождите." />
  );
}

export function ErrorState({
  onRetry,
  message,
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <StatePage
      title="Не удалось загрузить данные"
      description={message ?? "Попробуйте повторить запрос."}
      tone="danger"
      action={onRetry ? <button onClick={onRetry}>Повторить</button> : null}
    />
  );
}

export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="container">
      <header className={styles.pageHeader}>
        <div>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      {children}
    </main>
  );
}
