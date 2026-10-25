import { useDispatch, useSelector, useStore } from "react-redux";
import type { AppDispatch, AppStore } from "./appStore";
import type { RootState } from "./rootReducer";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppReduxStore = useStore.withTypes<AppStore>();
export function useAppServices() { return useAppReduxStore().services; }
