import { ScrollView, Text, View, RefreshControl, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useDbProduction, useDbSales, useDbExpenses, useDbRecovery, useDbSettings } from "@/hooks/use-db";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${Math.round(n)}`;
}

function fmtFull(n: number): string {
  return Math.round(n).toLocaleString("fr-FR");
}

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const utils = trpc.useUtils();

  const dbProduction = useDbProduction();
  const dbSales = useDbSales();
  const dbExpenses = useDbExpenses();
  const dbRecovery = useDbRecovery();
  const dbSettings = useDbSettings();

  const isLoading = dbProduction.isLoading || dbSales.isLoading || dbExpenses.isLoading;

  const today = getToday();
  const currentMonth = getCurrentMonth();
  const prixVente = dbSettings.data?.prixVentePack ?? 650;

  const production = dbProduction.data ?? [];
  const sales = dbSales.data ?? [];
  const expenses = dbExpenses.data ?? [];
  const recoveries = dbRecovery.data ?? [];

  // Today
  const prodToday = production.filter((p) => p.date === today).reduce((s, p) => s + p.quantity, 0);
  const caToday = sales.filter((s) => s.date === today).reduce((s, v) => s + v.amount, 0);
  const cashToday = sales.filter((s) => s.date === today && s.mode === "cash").reduce((s, v) => s + v.amount, 0);
  const expToday = expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);
  const beneficeToday = caToday - expToday;

  // Month
  const prodMonth = production.filter((p) => p.date.startsWith(currentMonth)).reduce((s, p) => s + p.quantity, 0);
  const caMonth = sales.filter((s) => s.date.startsWith(currentMonth)).reduce((s, v) => s + v.amount, 0);
  const expMonth = expenses.filter((e) => e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0);
  const beneficeMonth = caMonth - expMonth;

  // Stock
  const totalProd = production.reduce((s, p) => s + p.quantity, 0);
  const totalVendu = sales.reduce((s, v) => s + v.quantity, 0);
  const stockRestant = totalProd - totalVendu;

  // Recovery
  const enCours = recoveries.filter((r) => r.status === "en_cours");
  const enRetard = recoveries.filter((r) => r.status === "en_retard");
  const totalARecouvrer = [...enCours, ...enRetard].reduce((s, r) => s + r.amount, 0);

  const todayDate = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => utils.db.invalidate()} />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>
            Tableau de bord
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 3, textTransform: "capitalize" }}>
            {todayDate}
          </Text>
        </View>

        {/* Today KPIs */}
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <SectionLabel label="Aujourd'hui" />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <KPI
              icon="precision-manufacturing"
              label="Production"
              value={`${prodToday}`}
              unit="packs"
              color="#0077B6"
              colors={colors}
            />
            <KPI
              icon="shopping-cart"
              label="CA du jour"
              value={fmt(caToday)}
              unit="FCFA"
              color="#10B981"
              colors={colors}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <KPI
              icon="receipt-long"
              label="Dépenses"
              value={fmt(expToday)}
              unit="FCFA"
              color="#F59E0B"
              colors={colors}
            />
            <KPI
              icon="trending-up"
              label="Bénéfice"
              value={fmt(beneficeToday)}
              unit="FCFA"
              color={beneficeToday >= 0 ? "#10B981" : "#EF4444"}
              colors={colors}
            />
          </View>
        </View>

        {/* Month KPIs */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <SectionLabel label="Ce mois" />
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            marginTop: 8,
            overflow: "hidden",
          }}>
            <MonthRow label="Production" value={`${prodMonth} packs`} icon="precision-manufacturing" color="#0077B6" colors={colors} />
            <Divider colors={colors} />
            <MonthRow label="Chiffre d'affaires" value={`${fmt(caMonth)} F`} icon="shopping-cart" color="#10B981" colors={colors} />
            <Divider colors={colors} />
            <MonthRow label="Dépenses" value={`${fmt(expMonth)} F`} icon="receipt-long" color="#F59E0B" colors={colors} />
            <Divider colors={colors} />
            <MonthRow
              label="Bénéfice"
              value={`${beneficeMonth >= 0 ? "+" : ""}${fmt(beneficeMonth)} F`}
              icon="trending-up"
              color={beneficeMonth >= 0 ? "#10B981" : "#EF4444"}
              colors={colors}
              bold
            />
          </View>
        </View>

        {/* Stock card */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <SectionLabel label="Stock" />
          <TouchableOpacity
            onPress={() => router.push("/stock" as any)}
            activeOpacity={0.7}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 18,
              marginTop: 8,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View>
                <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "500" }}>STOCK RESTANT</Text>
                <Text style={{
                  fontSize: 32,
                  fontWeight: "700",
                  color: stockRestant > 100 ? colors.foreground : stockRestant > 0 ? "#F59E0B" : "#EF4444",
                  marginTop: 4,
                }}>
                  {stockRestant}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>packs disponibles</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "500" }}>VALEUR</Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginTop: 4 }}>
                  {fmt(stockRestant * prixVente)} F
                </Text>
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 6,
                  backgroundColor: colors.primary + "12",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 20,
                }}>
                  <Text style={{ fontSize: 11, color: colors.primary }}>Voir détails</Text>
                  <MaterialIcons name="chevron-right" size={14} color={colors.primary} />
                </View>
              </View>
            </View>

            {/* Progress bar */}
            <View style={{ marginTop: 16 }}>
              <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
                <View style={{
                  height: "100%",
                  borderRadius: 3,
                  backgroundColor: stockRestant > 100 ? "#10B981" : stockRestant > 0 ? "#F59E0B" : "#EF4444",
                  width: `${Math.min((stockRestant / Math.max(totalProd, 1)) * 100, 100)}%`,
                }} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
                <Text style={{ fontSize: 10, color: colors.muted }}>Produit: {totalProd}</Text>
                <Text style={{ fontSize: 10, color: colors.muted }}>Vendu: {totalVendu}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recovery card */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <SectionLabel label="Recouvrement" />
          <TouchableOpacity
            onPress={() => router.push("/recouvrement" as any)}
            activeOpacity={0.7}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 18,
              marginTop: 8,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "500", marginBottom: 4 }}>
                  À RECOUVRER
                </Text>
                <Text style={{ fontSize: 22, fontWeight: "700", color: "#F59E0B" }}>
                  {fmt(totalARecouvrer)} F
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {enCours.length} en cours · {enRetard.length} en retard
                </Text>
              </View>
              {enRetard.length > 0 && (
                <View style={{
                  backgroundColor: "#EF444415",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "#EF4444" }}>{enRetard.length}</Text>
                  <Text style={{ fontSize: 10, color: "#EF4444", fontWeight: "500" }}>EN RETARD</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Alerts */}
        {(stockRestant <= 50 || enRetard.length > 0) && (
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <SectionLabel label="Alertes" />
            <View style={{ marginTop: 8, gap: 8 }}>
              {stockRestant <= 50 && (
                <Alert
                  icon="warning"
                  color="#F59E0B"
                  message={`Stock bas — seulement ${stockRestant} packs restants`}
                  colors={colors}
                />
              )}
              {enRetard.length > 0 && (
                <Alert
                  icon="error-outline"
                  color="#EF4444"
                  message={`${enRetard.length} crédit(s) en retard de paiement`}
                  colors={colors}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: "600", color: "#6B7280", letterSpacing: 0.6, textTransform: "uppercase" }}>
      {label}
    </Text>
  );
}

function KPI({ icon, label, value, unit, color, colors }: {
  icon: string; label: string; value: string; unit: string; color: string; colors: any;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    }}>
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: color + "15",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
      }}>
        <MaterialIcons name={icon as any} size={17} color={color} />
      </View>
      <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{label}</Text>
      <Text style={{ fontSize: 10, color: color, fontWeight: "500", marginTop: 1 }}>{unit}</Text>
    </View>
  );
}

function MonthRow({ label, value, icon, color, colors, bold }: {
  label: string; value: string; icon: string; color: string; colors: any; bold?: boolean;
}) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 13,
      gap: 12,
    }}>
      <MaterialIcons name={icon as any} size={16} color={color} />
      <Text style={{ flex: 1, fontSize: 13, color: colors.foreground, fontWeight: bold ? "600" : "400" }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, fontWeight: bold ? "700" : "600", color: bold ? color : colors.foreground }}>
        {value}
      </Text>
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />;
}

function Alert({ icon, color, message, colors }: {
  icon: string; color: string; message: string; colors: any;
}) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: color + "10",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: color + "25",
      paddingHorizontal: 14,
      paddingVertical: 11,
    }}>
      <MaterialIcons name={icon as any} size={17} color={color} />
      <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }}>{message}</Text>
    </View>
  );
}
