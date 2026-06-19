import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { USE_DB_BACKEND } from "@/constants/data-source";
import { useDbSales, useDbExpenses, useDbRecovery } from "@/hooks/use-db";

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getDaysInMonth(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: string[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`);
  }
  return days;
}

interface DayCaisse {
  date: string;
  recettes: number;
  recouvrement: number;
  depenses: number;
  solde: number;
}

export default function CaisseScreen() {
  const router = useRouter();
  const colors = useColors();

  const dbSales = useDbSales();
  const dbExpenses = useDbExpenses();
  const dbRecovery = useDbRecovery();

  const sales = dbSales.data ?? [];
  const expenses = dbExpenses.data ?? [];
  const recoveries = dbRecovery.data ?? [];

  const currentMonth = getCurrentMonth();
  const today = new Date().toISOString().split("T")[0];
  const days = getDaysInMonth().filter((d) => d <= today);

  const dailyData: DayCaisse[] = days.map((day) => {
    const recettes = sales
      .filter((s) => s.date === day && s.mode === "cash")
      .reduce((sum, s) => sum + s.amount, 0);
    const recouvrement = recoveries
      .filter((r) => r.status === "paye" && r.datePaiement === day)
      .reduce((sum, r) => sum + r.amount, 0);
    const depenses = expenses
      .filter((e) => e.date === day)
      .reduce((sum, e) => sum + e.amount, 0);
    return { date: day, recettes, recouvrement, depenses, solde: recettes + recouvrement - depenses };
  });

  const totalRecettes = dailyData.reduce((sum, d) => sum + d.recettes, 0);
  const totalRecouvrement = dailyData.reduce((sum, d) => sum + d.recouvrement, 0);
  const totalDepenses = dailyData.reduce((sum, d) => sum + d.depenses, 0);
  const soldeFinal = totalRecettes + totalRecouvrement - totalDepenses;

  const activeDays = dailyData
    .filter((d) => d.recettes > 0 || d.depenses > 0 || d.recouvrement > 0)
    .reverse();

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-foreground">Caisse</Text>
          <Text className="text-sm text-muted">Suivi journalier du mois</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Summary */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">Résumé du mois</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted">Recettes (cash)</Text>
            <Text className="text-sm font-semibold text-success">+{formatMoney(totalRecettes)} F</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted">Recouvrement</Text>
            <Text className="text-sm font-semibold text-success">+{formatMoney(totalRecouvrement)} F</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted">Dépenses</Text>
            <Text className="text-sm font-semibold text-error">-{formatMoney(totalDepenses)} F</Text>
          </View>
          <View className="h-px bg-border my-2" />
          <View className="flex-row justify-between">
            <Text className="text-base font-bold text-foreground">Solde</Text>
            <Text className={`text-base font-bold ${soldeFinal >= 0 ? "text-success" : "text-error"}`}>
              {formatMoney(soldeFinal)} F
            </Text>
          </View>
        </View>

        {/* Daily entries */}
        {activeDays.map((day) => (
          <View key={day.date} className="bg-surface rounded-xl p-3 mb-2 border border-border">
            <Text className="text-xs text-muted mb-1">{day.date}</Text>
            <View className="flex-row justify-between">
              <Text className="text-xs text-success">+{formatMoney(day.recettes + day.recouvrement)}</Text>
              <Text className="text-xs text-error">-{formatMoney(day.depenses)}</Text>
              <Text className={`text-xs font-semibold ${day.solde >= 0 ? "text-foreground" : "text-error"}`}>
                = {formatMoney(day.solde)} F
              </Text>
            </View>
          </View>
        ))}

        {activeDays.length === 0 && (
          <View className="items-center mt-8">
            <Text className="text-muted">Aucun mouvement de caisse ce mois</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1000) return `${Math.round(amount / 1000)}k`;
  return `${Math.round(amount)}`;
}
