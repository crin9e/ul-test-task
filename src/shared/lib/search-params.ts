type SearchValue = unknown;

function parseSearchValue(value: string): SearchValue {
  if (value.startsWith("[") && value.endsWith("]")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return value;
    }
  }

  return value;
}

export function parseAppSearch(searchString: string): Record<string, unknown> {
  const parameters = new URLSearchParams(
    searchString.startsWith("?") ? searchString.slice(1) : searchString,
  );
  const result: Record<string, unknown> = {};

  parameters.forEach((value, key) => {
    const parsedValue = parseSearchValue(value);
    const currentValue = result[key];

    if (currentValue === undefined) {
      result[key] = parsedValue;
    } else if (Array.isArray(currentValue)) {
      result[key] = [...currentValue, parsedValue].flat();
    } else {
      result[key] = [currentValue, parsedValue].flat();
    }
  });

  return result;
}

function encodeSearchValue(value: string, preserveCommas: boolean): string {
  const encoded = encodeURIComponent(value);
  return preserveCommas ? encoded.replace(/%2C/g, ",") : encoded;
}

export function stringifyAppSearch(
  search: Record<string, unknown>,
): string {
  const entries = Object.entries(search).flatMap(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return [];
    }

    const isArray = Array.isArray(value);
    const serializedValue = isArray
      ? value.map(String).join(",")
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

    return [
      `${encodeURIComponent(key)}=${encodeSearchValue(serializedValue, isArray)}`,
    ];
  });

  return entries.length ? `?${entries.join("&")}` : "";
}
