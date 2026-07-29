import { Link } from '@tanstack/react-router';

export function NotFoundPage() {
  return (
    <main className="container">
      <h1>Страница не найдена</h1>
      <p>Запрошенный маршрут отсутствует.</p>
      <Link to="/auctions">Вернуться к списку аукционов</Link>
    </main>
  );
}
