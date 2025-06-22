import {
  TypedUseSelectorHook,
  useDispatch as useDispatchGeneric,
  useSelector as useSelectorGeneric
} from "react-redux";

import type { AppDispatch, RootState } from "index";
export const useDispatch = () => useDispatchGeneric<AppDispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = useSelectorGeneric;
