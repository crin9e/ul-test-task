import { format, isValid, parseISO } from "date-fns";
import { useEffect, useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cityOptions } from "../../../shared/config";
import type { AuctionListSearch } from "../model/search";
import { useAuctionFiltersDialog } from "../model/dialog-store";
import styles from "./auction-filters.module.css";

const tradingStatusOptions = [
  ["NotParticipating", "Не участвую"],
  ["Leading", "Лидирую"],
  ["Losing", "Ставка перебита"],
  ["OnPending", "На рассмотрении"],
  ["Confirmed", "Подтверждён"],
  ["ChoosingWinner", "Выбор победителя"],
  ["Winner", "Победитель"],
  ["Accepted", "Принят"],
  ["Unknown", "Неизвестный"],
] as const;

const auctionStatusOptions = [
  [1, "Планирование"],
  [2, "Торги идут"],
  [3, "Определение победителя"],
  [4, "Ожидание сделки"],
  [5, "В работе"],
  [6, "Завершён"],
  [7, "Остановлен"],
] as const;

const auctionTypeOptions = [
  ["Request", "Заявочный"],
  ["Up", "На повышение"],
  ["Down", "На понижение"],
  ["FixPrice", "Фиксированная цена"],
] as const;

const filterFormSchema = z.object({
  cargoNum: z.string(),
  status: z.array(z.string()),
  statuses: z.array(z.string()),
  aucType: z.array(z.string()),
  loadCity: z.string(),
  unloadCity: z.string(),
  loadDateFrom: z.string(),
  loadDateTo: z.string(),
  isAvailable: z.enum(["", "true", "false"]),
  isBidder: z.enum(["", "true", "false"]),
  currentPriceFrom: z.string(),
  currentPriceTo: z.string(),
  sort: z.string(),
});

type FilterFormValues = z.infer<typeof filterFormSchema>;

interface AuctionFiltersProps {
  search: AuctionListSearch;
  onApply: (search: AuctionListSearch) => void;
  onReset: () => void;
}

function toDateTimeLocal(value: string | undefined): string {
  if (!value) {
    return "";
  }
  const date = parseISO(value);
  return isValid(date) ? format(date, "yyyy-MM-dd'T'HH:mm") : "";
}

function toIsoDate(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function toOptionalBoolean(
  value: FilterFormValues["isAvailable"],
): boolean | undefined {
  return value === "" ? undefined : value === "true";
}

function getDefaultValues(search: AuctionListSearch): FilterFormValues {
  return {
    cargoNum: search.cargoNum ?? "",
    status: search.status ?? [],
    statuses: search.statuses?.map(String) ?? [],
    aucType: search.aucType ?? [],
    loadCity: search.loadCity ?? "",
    unloadCity: search.unloadCity ?? "",
    loadDateFrom: toDateTimeLocal(search.loadDateFrom),
    loadDateTo: toDateTimeLocal(search.loadDateTo),
    isAvailable:
      search.isAvailable === undefined
        ? ""
        : search.isAvailable
          ? "true"
          : "false",
    isBidder:
      search.isBidder === undefined ? "" : search.isBidder ? "true" : "false",
    currentPriceFrom: search.currentPriceFrom?.toString() ?? "",
    currentPriceTo: search.currentPriceTo?.toString() ?? "",
    sort: search.sort ?? "",
  };
}

function FilterForm({
  search,
  onApply,
  onReset,
  idPrefix,
}: AuctionFiltersProps & { idPrefix: string }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FilterFormValues>({
    defaultValues: getDefaultValues(search),
  });

  useEffect(() => {
    reset(getDefaultValues(search));
  }, [reset, search]);

  const submit = handleSubmit((values) => {
    const parsed = filterFormSchema.safeParse(values);
    if (!parsed.success) {
      setError("root", { message: "Проверьте значения фильтров." });
      return;
    }

    const data = parsed.data;
    onApply({
      page: 1,
      perPage: search.perPage,
      cargoNum: data.cargoNum.trim() || undefined,
      status: data.status.length
        ? (data.status as AuctionListSearch["status"])
        : undefined,
      statuses: data.statuses.length ? data.statuses.map(Number) : undefined,
      aucType: data.aucType.length
        ? (data.aucType as AuctionListSearch["aucType"])
        : undefined,
      loadCity: data.loadCity.trim() || undefined,
      unloadCity: data.unloadCity.trim() || undefined,
      loadDateFrom: toIsoDate(data.loadDateFrom),
      loadDateTo: toIsoDate(data.loadDateTo),
      isAvailable: toOptionalBoolean(data.isAvailable),
      isBidder: toOptionalBoolean(data.isBidder),
      currentPriceFrom: toOptionalNumber(data.currentPriceFrom),
      currentPriceTo: toOptionalNumber(data.currentPriceTo),
      sort: data.sort ? (data.sort as AuctionListSearch["sort"]) : undefined,
    });
  });

  const resetFilters = () => {
    reset(getDefaultValues({ page: 1, perPage: search.perPage }));
    onReset();
  };

  return (
    <form className={styles.form} onSubmit={(event) => void submit(event)}>
      <label htmlFor={`${idPrefix}-cargo-num`}>
        Номер заявки
        <input
          id={`${idPrefix}-cargo-num`}
          placeholder="Например, AUC-001"
          {...register("cargoNum")}
        />
      </label>

      <div className={styles.twoColumns}>
        <label htmlFor={`${idPrefix}-load-city`}>
          Город погрузки
          <input
            id={`${idPrefix}-load-city`}
            list={`${idPrefix}-cities`}
            {...register("loadCity")}
          />
        </label>
        <label htmlFor={`${idPrefix}-unload-city`}>
          Город выгрузки
          <input
            id={`${idPrefix}-unload-city`}
            list={`${idPrefix}-cities`}
            {...register("unloadCity")}
          />
        </label>
        <datalist id={`${idPrefix}-cities`}>
          {cityOptions.map((city) => (
            <option key={city.gcId} value={city.name} />
          ))}
        </datalist>
      </div>

      <div className={styles.twoColumns}>
        <label htmlFor={`${idPrefix}-date-from`}>
          Погрузка с
          <input
            id={`${idPrefix}-date-from`}
            type="datetime-local"
            {...register("loadDateFrom")}
          />
        </label>
        <label htmlFor={`${idPrefix}-date-to`}>
          Погрузка до
          <input
            id={`${idPrefix}-date-to`}
            type="datetime-local"
            {...register("loadDateTo")}
          />
        </label>
      </div>

      <fieldset>
        <legend>Мой статус</legend>
        <div className={styles.optionGrid}>
          {tradingStatusOptions.map(([value, label]) => (
            <label key={value}>
              <input type="checkbox" value={value} {...register("status")} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Статус аукциона</legend>
        <div className={styles.optionGrid}>
          {auctionStatusOptions.map(([value, label]) => (
            <label key={value}>
              <input type="checkbox" value={value} {...register("statuses")} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Тип аукциона</legend>
        <div className={styles.optionGrid}>
          {auctionTypeOptions.map(([value, label]) => (
            <label key={value}>
              <input type="checkbox" value={value} {...register("aucType")} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.twoColumns}>
        <label htmlFor={`${idPrefix}-available`}>
          Доступность ставки
          <select id={`${idPrefix}-available`} {...register("isAvailable")}>
            <option value="">Любая</option>
            <option value="true">Можно сделать ставку</option>
            <option value="false">Ставка недоступна</option>
          </select>
        </label>
        <label htmlFor={`${idPrefix}-bidder`}>
          Моё участие
          <select id={`${idPrefix}-bidder`} {...register("isBidder")}>
            <option value="">Любое</option>
            <option value="true">Участвую</option>
            <option value="false">Не участвую</option>
          </select>
        </label>
      </div>

      <div className={styles.twoColumns}>
        <label htmlFor={`${idPrefix}-price-from`}>
          Цена от
          <input
            id={`${idPrefix}-price-from`}
            type="number"
            min="0"
            step="any"
            {...register("currentPriceFrom")}
          />
        </label>
        <label htmlFor={`${idPrefix}-price-to`}>
          Цена до
          <input
            id={`${idPrefix}-price-to`}
            type="number"
            min="0"
            step="any"
            {...register("currentPriceTo")}
          />
        </label>
      </div>

      <label htmlFor={`${idPrefix}-sort`}>
        Сортировка
        <select id={`${idPrefix}-sort`} {...register("sort")}>
          <option value="">По умолчанию</option>
          <option value="start_time_asc">Начало торгов: сначала ранние</option>
          <option value="start_time_desc">
            Начало торгов: сначала поздние
          </option>
          <option value="current_price_asc">
            Текущая цена: по возрастанию
          </option>
          <option value="current_price_desc">Текущая цена: по убыванию</option>
          <option value="price_per_km_asc">Цена за км: по возрастанию</option>
          <option value="price_per_km_desc">Цена за км: по убыванию</option>
        </select>
      </label>

      {errors.root?.message && (
        <small role="alert">{errors.root.message}</small>
      )}

      <div className={styles.actions}>
        <button type="submit">Применить</button>
        <button
          type="button"
          className="secondary outline"
          onClick={resetFilters}
        >
          Сбросить
        </button>
      </div>
    </form>
  );
}

export function AuctionFilters(props: AuctionFiltersProps) {
  const dialogId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { isOpen, open, close } = useAuctionFiltersDialog();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={`${styles.mobileToggle} secondary`}
        onClick={open}
        aria-haspopup="dialog"
      >
        Фильтры и сортировка
      </button>

      <aside className={styles.desktopPanel} aria-label="Фильтры аукционов">
        <h2>Фильтры</h2>
        <FilterForm {...props} idPrefix="desktop-filter" />
      </aside>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={dialogId}
        onClose={close}
      >
        <article>
          <header className={styles.dialogHeader}>
            <h2 id={dialogId}>Фильтры и сортировка</h2>
            <button
              type="button"
              className="close"
              aria-label="Закрыть фильтры"
              onClick={close}
            />
          </header>
          <FilterForm
            {...props}
            idPrefix="mobile-filter"
            onApply={(search) => {
              props.onApply(search);
              close();
            }}
            onReset={() => {
              props.onReset();
              close();
            }}
          />
        </article>
      </dialog>
    </>
  );
}
