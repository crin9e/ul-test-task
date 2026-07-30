import type { AuctionListMeta } from "../../../shared/api/types";
import styles from "./auction-pagination.module.css";

interface AuctionPaginationProps {
  meta: AuctionListMeta | undefined;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

export function AuctionPagination({
  meta,
  disabled = false,
  onPageChange,
}: AuctionPaginationProps) {
  const currentPage = Math.max(1, meta?.current_page ?? 1);
  const lastPage = Math.max(1, meta?.last_page ?? 1);

  if (lastPage <= 1) {
    return null;
  }

  return (
    <nav className={styles.pagination} aria-label="Пагинация аукционов">
      <button
        type="button"
        className="secondary outline"
        disabled={disabled || currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Назад
      </button>
      <span aria-live="polite">
        Страница <strong>{currentPage}</strong> из {lastPage}
      </span>
      <button
        type="button"
        className="secondary outline"
        disabled={disabled || currentPage >= lastPage}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Вперёд
      </button>
    </nav>
  );
}
