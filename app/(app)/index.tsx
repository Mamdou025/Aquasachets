import { ScrollView, Text, View, RefreshControl } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useDbProduction, useDbSales, useDbExpenses, useDbRecovery, useDbSettings } from "@/hooks/use-db";
import { trpc } from "@/lib/trpc";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardScreen() {
  const utils = trpc.useUtils();

  const dbProduction = useDbProduction();
  const dbSales = useDbSales();
  const dbExpenses = useDbExpenses();
  const dbRecovery = useDbRecovery();
  const dbSettings = useDbSettings();

  const isLoading =
    dbProduction.isLoading || dbSales.isLoading || dbExpenses.isLoading || dbRecovery.isLoading;

  const onRefresh = async () => {
    await utils.db.invalidate();
  };

  const today = getToday();
  const currentMonth = getCurrentMonth();
  const prixVente = dbSettings.data?.prixVentePack ?? 650;

  const production = dbProduction.data ?? [];
  const sales = dbSales.data ?? [];
  const expenses = dbExpenses.data ?? [];
  const recoveries = dbRecovery.data ?? [];

  // KPI du jour
  const prodToday = production
    .filter((p) => p.date === today)
    .reduce((sum, p) => sum + p.quantity, 0);

  const salesToday = sales.filter((s) => s.date === today);
  const caToday = salesToday.reduce((sum, s) => sum + s.amount, 0);
  const expToday = expenses
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + e.amount, 0);
  const beneficeToday = caToday - expToday;

  // KPI du mois
  const prodMonth = production
    .filter((p) => p.date.startsWith(currentMonth))
    .reduce((sum, p) => sum + p.quantity, 0);

  const caMonth = sales
    .filter((s) => s.date.startsWith(currentMonth))
    .reduce((sum, s) => sum + s.amount, 0);
  const expMonth = expenses
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  // Stock
  const totalProd = production.reduce((sum, p) => sum + p.quantity, 0);
  const totalVendu = sales.reduce((sum, s) => sum + s.quantity, 0);
  const stockRestant = totalProd - totalVendu;

  // Recouvrement
  const enCours = recoveries.filter((r) => r.status === "en_cours");
  const totalARecouvrer = enCours.reduce((sum, r) => sum + r.amount, 0);
  const enRetard = recoveries.filter((r) => r.status === "en_retard");

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-foreground">AquaSachet</Text>
          <Text className="text-sm text-muted mt-1">Tableau de bord</Text>
        </View>

        {/* KPI du jour */}
        <View className="px-4 mt-4">
          <Text className="text-base font-semibold text-foreground mb-3">Aujourd'hui</Text>
          <View className="flex-row flex-wrap gap-3">
            <KPICard title="Production" value={`${prodToday}`} subtitle="packs" color="bg-primary" />
            <KPICard title="Chiffre d'affaires" value={formatMoney(caToday)} subtitle="FCFA" color="bg-success" />
            <KPICard title="Dépenses" value={formatMoney(expToday)} subtitle="FCFA" color="bg-warning" />
            <KPICard
              title="Bénéfice brut"
              value={formatMoney(beneficeToday)}
              subtitle="FCFA"
              color={beneficeToday >= 0 ? "bg-success" : "bg-error"}
            />
          </View>
        </View>

        {/* KPI du mois */}
        <View className="px-4 mt-6">
          <Text className="text-base font-semibold text-foreground mb-3">Ce mois</Text>
          <View className="flex-row flex-wrap gap-3">
            <KPICard title="Production" value={`${prodMonth}`} subtitle="packs" color="bg-primary" />
            <KPICard title="CA mensuel" value={formatMoney(caMonth)} subtitle="FCFA" color="bg-success" />
            <KPICard title="Dépenses" value={formatMoney(expMonth)} subtitle="FCFA" color="bg-warning" />
          </View>
        </View>

        {/* Stock & Recouvrement */}
        <View className="px-4 mt-6">
          <Text className="text-base font-semibold text-foreground mb-3">Stock & Recouvrement</Text>
          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row justify-between mb-3">
              <View>
                <Text className="text-sm text-muted">Stock restant</Text>
                <Text className="text-xl font-bold text-foreground">{stockRestant} packs</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-muted">Valeur stock</Text>
                <Text className="text-xl font-bold text-foreground">
                  {formatMoney(stockRestant * prixVente)} F
                </Text>
              </View>
            </View>
            <View className="h-px bg-border my-2" />
            <View className="flex-row justify-between mt-2">
              <View>
                <Text className="text-sm text-muted">À recouvrer</Text>
                <Text className="text-lg font-semibold text-warning">{formatMoney(totalARecouvrer)} F</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-muted">En retard</Text>
                <Text className="text-lg font-semibold text-error">{enRetard.length} crédit(s)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Alertes */}
        {(stockRestant <= 50 || enRetard.length > 0) && (
          <View className="px-4 mt-6">
            <Text className="text-base font-semibold text-foreground mb-3">Alertes</Text>
            {stockRestant <= 50 && (
              <View className="bg-warning/10 rounded-lg p-3 mb-2 border border-warning/30">
                <Text className="text-sm text-foreground">
                  Stock bas : {stockRestant} packs restants
                </Text>
              </View>
            )}
            {enRetard.length > 0 && (
              <View className="bg-error/10 rounded-lg p-3 border border-error/30">
                <Text className="text-sm text-foreground">
                  {enRetard.length} crédit(s) en retard de paiement
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function KPICard({
  title, value, subtitle, color,
}: {
  title: string; value: string; subtitle: string; color: string;
}) {
  return (
    <View className="bg-surface rounded-xl p-3 border border-border" style={{ width: "47%" }}>
      <View className={`w-2 h-2 rounded-full ${color} mb-2`} />
      <Text className="text-xs text-muted">{title}</Text>
      <Text className="text-lg font-bold text-foreground mt-1">{value}</Text>
      <Text className="text-xs text-muted">{subtitle}</Text>
    </View>
  );
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}k`;
  return `${Math.round(amount)}`;
}
