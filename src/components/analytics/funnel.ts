export type FunnelSnapshot = {
  portalVisitors: number;
  storeClicks: number;
  attributedInstalls: number;
  activatedUsers: number;
  eligibleForRetentionDay7: number;
  retainedDay7: number;
  portalToStoreRate: number;
  storeToInstallRate: number;
  installToActivationRate: number;
  retentionDay7Rate: number;
};

export type FunnelStage = {
  key: string;
  label: string;
  value: number;
  conversionLabel: string;
  conversionRate: number | null;
  widthPercent: number;
};

function width(value: number, base: number) {
  if (base <= 0 || value <= 0) return 8;
  return Math.max(8, Math.min(100, value / base * 100));
}

export function buildFunnelStages(funnel: FunnelSnapshot): FunnelStage[] {
  const base = funnel.portalVisitors;
  return [
    {
      key: 'portal', label: 'Visitantes do portal', value: funnel.portalVisitors,
      conversionLabel: 'Entrada da coorte', conversionRate: null, widthPercent: width(funnel.portalVisitors, base),
    },
    {
      key: 'store', label: 'Cliques para o Google Play', value: funnel.storeClicks,
      conversionLabel: 'Visitante → loja', conversionRate: funnel.portalToStoreRate, widthPercent: width(funnel.storeClicks, base),
    },
    {
      key: 'install', label: 'Instalações atribuídas', value: funnel.attributedInstalls,
      conversionLabel: 'Loja → instalação', conversionRate: funnel.storeToInstallRate, widthPercent: width(funnel.attributedInstalls, base),
    },
    {
      key: 'activation', label: 'Ativações iniciais', value: funnel.activatedUsers,
      conversionLabel: 'Instalação → ativação', conversionRate: funnel.installToActivationRate, widthPercent: width(funnel.activatedUsers, base),
    },
    {
      key: 'retention', label: 'Retidos no D+7', value: funnel.retainedDay7,
      conversionLabel: `D+7 entre ${funnel.eligibleForRetentionDay7} elegíveis`,
      conversionRate: funnel.retentionDay7Rate, widthPercent: width(funnel.retainedDay7, base),
    },
  ];
}
