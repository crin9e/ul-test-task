import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorToastContent } from "../shared/api";

function showErrorToast(error: unknown) {
  const content = getErrorToastContent(error);
  toast.error(content.title, { description: content.description });
}

export function createAppQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.getObserversCount() > 0) {
          showErrorToast(error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: showErrorToast,
    }),
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export const appQueryClient = createAppQueryClient();
