import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useDbSales, useDbExpenses, useDbProduction, useDbSettings } from "@/hooks/use-db";

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthName(): string {
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
}

export default function RapportsScreen() {
  const router = useRouter();
  const colors = useColors();

  const dbSales = useDbSales();
  const dbExpenses = useDbExpenses();
  const dbProduction = useDbProduction();
  const dbSettings = useDbSettings();

  const currentMonth = getCurrentMonth();
  const sales = (dbSales.data ?? []).filter((s) => s.date.startsWith(currentMonth));
  const exps = (dbExpenses.data ?? []).filter((e) => e.date.startsWith(currentMonth));
  const prod = (dbProduction.data ?? []).filter((p) => p.date.startsWith(currentMonth));
  const settings = dbSettings.data;

  const ca = sales.reduce((sum, s) => sum + s.amount, 0);
  const salesMonth = sales.reduce((sum, s) => sum + s.quantity, 0);
  const prodMonth = prod.reduce((sum, p) => sum + p.quantity, 0);
  const totalExpenses = exps.reduce((sum, e) => sum + e.amount, 0);

  const byCategory: Record<string, number> = {};
  exps.forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
  const expenseList = Object.entries(byCategory).map(([category, total]) => ({ category, total }));

  const resultatNet = ca - totalExpenses;
  const tauxMarge = ca > 0 ? ((resultatNet / ca) * 100).toFixed(1) : "0";

  const coutRevient = settings
    ? settings.coutRouleaux + settings.coutAntiscalant + settings.coutEau +
      settings.coutMembrane + settings.coutElectricite + settings.coutLoyer +
      settings.coutSalaires + settings.coutMaintenance + settings.commissionCommercial +
      settings.coutCarburant
    : 460.78;
  const prixVente = settings?.prixVentePack ?? 650;
  const margeParPack = prixVente - coutRevient;

  const chargesFixes = settings
    ? (settings.coutElectricite + settings.coutLoyer + settings.coutSalaires + settings.coutMaintenance) * salesMonth
    : 0;
  const margeSurVariable = prixVente -
    (settings?.coutRouleaux ?? 207.78) -
    (settings?.coutAntiscalant ?? 25) -
    (settings?.coutEau ?? 8) -
    (settings?.coutMembrane ?? 5);
  const seuilRentabilite = margeSurVariable > 0 ? Math.ceil(chargesFixes / margeSurVariable) : 0;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-foreground">Rapports</Text>
          <Text className="text-sm text-muted">{getMonthName()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Compte de résultat */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-sm font-semibold text-foreground mb-4">COMPTE DE RÉSULTAT</Text>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-foreground font-medium">Chiffre d'affaires</Text>
            <Text className="text-sm font-bold text-success">{formatMoney(ca)} F</Text>
          </View>
          <View className="h-px bg-border my-2" />
          <Text className="text-xs text-muted mb-2 mt-2">CHARGES — détail</Text>
          {expenseList.map((exp) => (
            <View key={exp.category} className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted">{exp.category}</Text>
              <Text className="text-sm text-foreground">{formatMoney(exp.total)} F</Text>
            </View>
          ))}
          <View className="h-px bg-border my-2" />
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm font-medium text-foreground">Total charges</Text>
            <Text className="text-sm font-bold text-error">{formatMoney(totalExpenses)} F</Text>
          </View>
          <View className="h-px bg-border my-2" />
          <View className="flex-row justify-between mt-2">
            <Text className="text-base font-bold text-foreground">Résultat net</Text>
            <Text className={`text-base font-bold ${resultatNet >= 0 ? "text-success" : "text-error"}`}>
              {formatMoney(resultatNet)} F
            </Text>
          </View>
          <View className="flex-row justify-between mt-1">
            <Text className="text-xs text-muted">Taux de marge nette</Text>
            <Text className="text-xs text-muted">{tauxMarge}%</Text>
          </View>
        </View>

        {/* Rentabilité */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-sm font-semibold text-foreground mb-4">RENTABILITÉ</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted">Prix de vente / pack</Text>
            <Text className="text-sm font-semibold text-foreground">{prixVente} F</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted">Coût de revient / pack</Text>
            <Text className="text-sm font-semibold text-foreground">{Math.round(coutRevient)} F</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted">Marge nette / pack</Text>
            <Text className="text-sm font-bold text-success">{Math.round(margeParPack)} F</Text>
          </View>
          <View className="h-px bg-border my-2" />
          <View className="flex-row justify-between mb-2 mt-2">
            <Text className="text-sm text-muted">Production ce mois</Text>
            <Text className="text-sm font-semibold text-foreground">{prodMonth} packs</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted">Ventes ce mois</Text>
            <Text className="text-sm font-semibold text-foreground">{salesMonth} packs</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted">Bénéfice net mensuel</Text>
            <Text className="text-sm font-bold text-success">{formatMoney(salesMonth * margeParPack)} F</Text>
          </View>
          {seuilRentabilite > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted">Seuil de rentabilité</Text>
              <Text className="text-sm font-semibold text-foreground">{seuilRentabilite} packs</Text>
            </View>
          )}
        </View>

        {/* Indicateurs */}
        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-4">INDICATEURS CLÉS</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted">Taux de marge</Text>
            <Text className="text-sm font-semibold text-foreground">
              {prixVente > 0 ? ((margeParPack / prixVente) * 100).toFixed(1) : 0}%
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted">CA mensuel</Text>
            <Text className="text-sm font-semibold text-foreground">{formatMoney(ca)} F</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1000) return `${Math.round(amount / 1000)}k`;
  return `${Math.round(amount)}`;
}
