import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useSyncExternalStore } from "react";

interface LicenseStoreState {
  selectedCode: string;
  setSelectedCode: (code: string) => void;
}

export const useLicenseStore = create<LicenseStoreState>()(
  persist(
    (set) => ({
      selectedCode: "B",
      setSelectedCode: (code: string) => set({ selectedCode: code }),
    }),
    {
      name: "qcl:selected-license:v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hook hỗ trợ truy xuất mã hạng GPLX đã chọn kèm bảo vệ SSR Hydration
 * (tránh mismatch giữa server HTML và localStorage ở client)
 */
export function useSelectedLicense() {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const rawSelectedCode = useLicenseStore((state) => state.selectedCode);
  const setSelectedCode = useLicenseStore((state) => state.setSelectedCode);

  return {
    selectedCode: isHydrated ? rawSelectedCode : "B",
    setSelectedCode,
    isHydrated,
  };
}
