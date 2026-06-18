import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useOdooSalesReps, useOdooSales } from "@/hooks/use-odoo";
import { USE_ODOO_BACKEND } from "@/constants/data-source";
import type { OdooSaleSummary } from "@/server/odooService";

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const colors = useColors();
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.35, fontWeight: "700", color: colors.primary }}>{initials}</Text>
    </View>
  );
}

export default function CommerciauxScreen() {
  const colors = useColors();
  const salesReps = useOdooSalesReps();
  const allSales = useOdooSales(500);

  if (!USE_ODOO_BACKEND) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <MaterialIcons name="cloud-off" size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, marginTop: 12, textAlign: "center", fontSize: 15 }}>
            Activez le backend Odoo pour voir les commerciaux.{"\n"}
            Définissez EXPO_PUBLIC_DATA_BACKEND=odoo dans votre .env
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const isLoading = salesReps.isLoading || allSales.isLoading;
  const error = salesReps.error ?? allSales.error;

  // Build per-rep stats from Odoo sales (sales include salesperson info via partner/ref)
  // We aggregate from the Odoo sales list using the salesperson field if present
  const repStats = (salesReps.data ?? []).map((rep) => {
    const repSales = (allSales.data ?? []).filter((s: OdooSaleSummary) => s.salesRepId === rep.id);
    const totalCA = repSales.reduce((sum: number, s: OdooSaleSummary) => sum + s.amountTotal, 0);
    const cashCA = repSales.filter((s: OdooSaleSummary) => s.paymentMode === "cash").reduce((sum: number, s: OdooSaleSummary) => sum + s.amountTotal, 0);
    const creditCA = repSales.filter((s: OdooSaleSummary) => s.paymentMode === "credit").reduce((sum: number, s: OdooSaleSummary) => sum + s.amountTotal, 0);
    return { ...rep, nbSales: repSales.length, totalCA, cashCA, creditCA };
  });

  // Sort by total CA desc
  repStats.sort((a, b) => b.totalCA - a.totalCA);
  const grandTotal = repStats.reduce((sum, r) => sum + r.totalCA, 0);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>Commerciaux</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
            Performance des représentants commerciaux
          </Text>
        </View>

        {isLoading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={{ color: colors.muted, marginTop: 12 }}>Chargement depuis Odoo…</Text>
          </View>
        ) : error ? (
          <View style={{ margin: 24 }}>
            <Text style={{ color: "#ef4444", fontSize: 13 }}>Erreur : {(error as any).message}</Text>
          </View>
        ) : (
          <>
            {/* Summary card */}
            <View style={{ marginHorizontal: 24, marginBottom: 16, backgroundColor: colors.surface ?? colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>{repStats.length}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>Commerciaux actifs</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>{fmt(grandTotal)}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>CA total (F)</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>
                    {repStats.reduce((s, r) => s + r.nbSales, 0)}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>Ventes totales</Text>
                </View>
              </View>
            </View>

            {/* Per-rep cards */}
            {repStats.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 13, marginHorizontal: 24 }}>
                Aucun commercial trouvé dans Odoo.
              </Text>
            ) : (
              <View style={{ gap: 12, paddingHorizontal: 24 }}>
                {repStats.map((rep, i) => {
                  const pct = grandTotal > 0 ? (rep.totalCA / grandTotal) * 100 : 0;
                  return (
                    <View
                      key={rep.id}
                      style={{ backgroundColor: colors.surface ?? colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16 }}
                    >
                      {/* Rep header */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <View style={{ position: "relative" }}>
                          <Avatar name={rep.name} size={44} />
                          <View style={{ position: "absolute", bottom: -2, right: -2, backgroundColor: "#f59e0b", borderRadius: 8, width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 9, fontWeight: "700", color: "#fff" }}>#{i + 1}</Text>
                          </View>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{rep.name}</Text>
                          {rep.email ? <Text style={{ fontSize: 12, color: colors.muted }}>{rep.email}</Text> : null}
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{fmt(rep.totalCA)} F</Text>
                          <Text style={{ fontSize: 11, color: colors.muted }}>{pct.toFixed(1)}% du CA</Text>
                        </View>
                      </View>

                      {/* Progress bar */}
                      <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 4, marginBottom: 12 }}>
                        <View style={{ height: 4, backgroundColor: colors.primary, borderRadius: 4, width: `${pct}%` as any }} />
                      </View>

                      {/* Stats row */}
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <View style={{ flex: 1, backgroundColor: "#dcfce7", borderRadius: 8, padding: 10, alignItems: "center" }}>
                          <Text style={{ fontSize: 14, fontWeight: "700", color: "#15803d" }}>{fmt(rep.cashCA)} F</Text>
                          <Text style={{ fontSize: 10, color: "#15803d", marginTop: 2 }}>Ventes Cash</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: "#fef9c3", borderRadius: 8, padding: 10, alignItems: "center" }}>
                          <Text style={{ fontSize: 14, fontWeight: "700", color: "#a16207" }}>{fmt(rep.creditCA)} F</Text>
                          <Text style={{ fontSize: 10, color: "#a16207", marginTop: 2 }}>Ventes Crédit</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: colors.border + "40", borderRadius: 8, padding: 10, alignItems: "center" }}>
                          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{rep.nbSales}</Text>
                          <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>Bons de livraison</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
