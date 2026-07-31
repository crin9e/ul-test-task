import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { AuctionShowResponse } from "../../../shared/api";
import { getBidMeasurementLabel } from "../../../entities/auction";
import { formatMoney } from "../../../shared/lib";
import { getBidPriceApiError } from "../model/api-errors";
import { createBidSchema, getBidPriceConstraints } from "../model/validation";
import { useSetAuctionBid } from "../api/use-set-auction-bid";
import styles from "./auction-bid-form.module.css";

interface AuctionBidFormProps {
  auctionUuid: string;
  detail: AuctionShowResponse;
  onSuccess: () => void;
}

interface BidInputValues {
  price: number | undefined;
}

export function AuctionBidForm({
  auctionUuid,
  detail,
  onSuccess,
}: AuctionBidFormProps) {
  const currencyCode = detail.payment.currency_code ?? detail.cargo.currency;
  const constraints = getBidPriceConstraints(detail.trading.price);
  const schema = createBidSchema(constraints);
  const currentBid =
    detail.trading.your?.last_bet_with_vat ??
    detail.trading.your?.last_bet ??
    undefined;
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<BidInputValues>({
    defaultValues: { price: currentBid },
  });
  const mutation = useSetAuctionBid(auctionUuid);

  const submit = handleSubmit((values) => {
    clearErrors();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError("price", {
        type: "validation",
        message:
          parsed.error.issues.find((issue) => issue.path[0] === "price")
            ?.message ?? "Проверьте цену.",
      });
      return;
    }
    mutation.mutate(parsed.data.price, {
      onSuccess: () => {
        toast.success(
          detail.trading.your?.bet ? "Ставка изменена." : "Ставка принята.",
        );
        onSuccess();
      },
      onError: (error) => {
        const priceError = getBidPriceApiError(error);
        if (priceError) {
          setError("price", { type: "server", message: priceError });
        }
      },
    });
  });

  return (
    <article className={styles.card}>
      <header>
        <h2>
          {detail.trading.your?.bet ? "Изменение ставки" : "Новая ставка"}
        </h2>
      </header>

      <dl className={styles.hints}>
        <div>
          <dt>Единица</dt>
          <dd>{getBidMeasurementLabel(detail.trading.bid_measurement_type)}</dd>
        </div>
        <div>
          <dt>Доступная цена</dt>
          <dd>{formatMoney(detail.trading.price?.available, currencyCode)}</dd>
        </div>
        <div>
          <dt>Минимум</dt>
          <dd>{formatMoney(constraints.min, currencyCode)}</dd>
        </div>
        <div>
          <dt>Максимум</dt>
          <dd>{formatMoney(constraints.max, currencyCode)}</dd>
        </div>
        <div>
          <dt>Шаг</dt>
          <dd>{formatMoney(constraints.step, currencyCode)}</dd>
        </div>
        <div>
          <dt>Цена без НДС</dt>
          <dd>
            {formatMoney(detail.trading.price?.available_no_vat, currencyCode)}
          </dd>
        </div>
        {currentBid !== undefined && (
          <div>
            <dt>Текущая ставка</dt>
            <dd>{formatMoney(currentBid, currencyCode)}</dd>
          </div>
        )}
      </dl>

      <form noValidate onSubmit={(event) => void submit(event)}>
        <label htmlFor="bid-price">
          Цена с НДС
          <input
            id="bid-price"
            type="number"
            inputMode="decimal"
            min={constraints.min ?? undefined}
            max={constraints.max ?? undefined}
            step={constraints.step ?? "any"}
            aria-invalid={errors.price ? true : undefined}
            aria-describedby={
              errors.price ? "bid-price-error" : "bid-price-hint"
            }
            disabled={mutation.isPending}
            {...register("price", {
              setValueAs: (value: unknown) => {
                if (typeof value === "number") {
                  return value;
                }
                if (typeof value !== "string" || value.trim() === "") {
                  return undefined;
                }
                return Number(value);
              },
            })}
          />
          {errors.price?.message && (
            <small
              id="bid-price-error"
              aria-invalid={!!errors.price.message}
              role="alert"
            >
              {errors.price.message}
            </small>
          )}
        </label>
        <small id="bid-price-hint">
          Значение проверяется по ограничениям аукциона.
        </small>

        <button
          type="submit"
          aria-busy={mutation.isPending || undefined}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Отправка…" : "Подтвердить ставку"}
        </button>
      </form>
    </article>
  );
}
