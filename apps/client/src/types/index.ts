import type { store } from "@/main";

export type AppDispatch = typeof store.dispatch;
export type GetState = () => RootState;
export type RootState = ReturnType<typeof store.getState>;
