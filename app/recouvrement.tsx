import { useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { RecoveryStore, type RecoveryEntry } from "@/lib/store";
import { useColors } from "@/hooks/use-colors";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function RecouvrementScreen() {
  const router = useRouter();
  const colors = useColors();
  const [entries, setEntries] = useState<RecoveryEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "en_cours" | "paye" | "en_retard">("all");

  const loadData = useCallback(async () => {
    const data = await RecoveryStore.getAll();
    // Mark overdue entries (more than 7 days)
    const today = new Date();
    const updated = data.map((entry) => {
      if (entry.status === "en_cours") {
        const saleDate = new Date(entry.date);
        const diffDays = Math.floor(
          (today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > 7) {
          return { ...entry, status: "en_retard" as const };
        }
      }
      return entry;
    });
    setEntries(updated.sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleMarkPaid = async (entry: RecoveryEntry) => {
    const updated: RecoveryEntry = {
      ...entry,
      status: "paye",
      datePaiement: getToday(),
    };
    await RecoveryStore.update(updated);
    await loadData();
  };

  const filtered = filter === "all" ? entries : entries.filter((e) => e.status === filter);

  const totalARecouvrer = entries
    .filter((e) => e.status !== "paye")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalRecouvre = entries
    .filter((e) => e.status === "paye")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalEnRetard = entries
    .filter((e) => e.status === "en_retard")
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-foreground">Recouvrement</Text>
          <Text className="text-sm text-muted">Suivi des crédits clients</Text>
        </View>
      </View>

      {/* Summary */}
      <View className="mx-4 mt-3 bg-surface rounded-xl p-4 border border-border">
        <View className="flex-row justify-between">
          <View className="items-center flex-1">
            <Text className="text-xs text-muted">À recouvrer</Text>
            <Text className="text-base font-bold text-warning mt-1">
              {formatMoney(totalARecouvrer)} F
            </Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xs text-muted">Recouvré</Text>
            <Text className="text-base font-bold text-success mt-1">
              {formatMoney(totalRecouvre)} F
            </Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xs text-muted">En retard</Text>
            <Text className="text-base font-bold text-error mt-1">
              {formatMoney(totalEnRetard)} F
            </Text>
          </View>
        </View>
      </View>

      {/* Filter */}
      <View className="flex-row px-4 mt-3 gap-2">
        {(["all", "en_cours", "en_retard", "paye"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            className={`px-3 py-1.5 rounded-full border ${
              filter === f ? "bg-primary border-primary" : "bg-background border-border"
            }`}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text
              className={`text-xs font-medium ${
                filter === f ? "text-background" : "text-foreground"
              }`}
            >
              {f === "all"
                ? "Tous"
                : f === "en_cours"
                ? "En cours"
                : f === "en_retard"
                ? "En retard"
                : "Payé"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  {item.clientName}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  Vente du {item.date}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-foreground">
                  {formatMoney(item.amount)} F
                </Text>
                <View
                  className={`mt-1 px-2 py-0.5 rounded-full ${
                    item.status === "paye"
                      ? "bg-success/20"
                      : item.status === "en_retard"
                      ? "bg-error/20"
                      : "bg-warning/20"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      item.status === "paye"
                        ? "text-success"
                        : item.status === "en_retard"
                        ? "text-error"
                        : "text-warning"
                    }`}
                  >
                    {item.status === "paye"
                      ? "Payé"
                      : item.status === "en_retard"
                      ? "En retard"
                      : "En cours"}
                  </Text>
                </View>
              </View>
            </View>
            {item.status !== "paye" && (
              <TouchableOpacity
                className="mt-3 bg-success/10 border border-success/30 rounded-lg py-2 items-center"
                onPress={() => handleMarkPaid(item)}
                activeOpacity={0.7}
              >
                <Text className="text-success text-sm font-semibold">
                  Marquer comme payé
                </Text>
              </TouchableOpacity>
            )}
            {item.datePaiement && (
              <Text className="text-xs text-muted mt-2">
                Payé le {item.datePaiement}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-8">
            <Text className="text-muted">Aucun crédit enregistré</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1000) return `${Math.round(amount / 1000)}k`;
  return `${Math.round(amount)}`;
}
