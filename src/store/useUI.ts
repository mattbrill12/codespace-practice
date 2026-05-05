import { create } from "zustand";

type UIState = {
  query: string;
  setQuery: (value: string) => void;
};

export const useUI = create<UIState>((set) => ({
  query: "",
  setQuery: (value) => set({ query: value }),
}));