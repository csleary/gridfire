import {
  TypedUseSelectorHook,
  useDispatch as useDispatchGeneric,
  useSelector as useSelectorGeneric
} from "react-redux";
import type { RootState } from "state";
import type { AppDispatch } from "index";

export const useDispatch = () => useDispatchGeneric<AppDispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = useSelectorGeneric;
