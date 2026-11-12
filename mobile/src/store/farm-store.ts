import { create } from 'zustand';

interface FarmState {
  selectedFarmId: string | null;
  selectedZoneId: string | null;
  setSelectedFarmId: (farmId: string | null) => void;
  setSelectedZoneId: (zoneId: string | null) => void;
  reset: () => void;
}

export const useFarmStore = create<FarmState>((set) => ({
  selectedFarmId: null,
  selectedZoneId: null,
  setSelectedFarmId: (farmId) => set({ selectedFarmId: farmId, selectedZoneId: null }),
  setSelectedZoneId: (zoneId) => set({ selectedZoneId: zoneId }),
  reset: () => set({ selectedFarmId: null, selectedZoneId: null }),
}));

