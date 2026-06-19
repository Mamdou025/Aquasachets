export interface Settings {
  prixVentePack: number;
  coutRouleaux: number;
  coutAntiscalant: number;
  coutEau: number;
  coutMembrane: number;
  coutElectricite: number;
  coutLoyer: number;
  coutSalaires: number;
  coutMaintenance: number;
  commissionCommercial: number;
  coutCarburant: number;
}

export const DEFAULT_SETTINGS: Settings = {
  prixVentePack: 650,
  coutRouleaux: 207.78,
  coutAntiscalant: 25,
  coutEau: 8,
  coutMembrane: 5,
  coutElectricite: 44,
  coutLoyer: 53,
  coutSalaires: 39,
  coutMaintenance: 12,
  commissionCommercial: 50,
  coutCarburant: 17,
};
