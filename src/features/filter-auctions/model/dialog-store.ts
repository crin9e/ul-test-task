import { create } from "zustand";

interface AuctionFiltersDialogState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useAuctionFiltersDialog = create<AuctionFiltersDialogState>(
  (set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
  }),
);
