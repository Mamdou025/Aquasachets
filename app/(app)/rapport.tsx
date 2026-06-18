import { useCallback, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import {
  ExpenseStore,
  ProductionStore,
  RecoveryStore,
  SaleStore,
  type ExpenseEntry,
  type ProductionEntry,
  type RecoveryEntry,
  type SaleEntry,
} from "@/lib/store";
import { useColors } from "@/hooks/use-colors";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("fr-FR");
}

export default function RapportJournalierScreen() {
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [production, setProduction] = useState<ProductionEntry[]>([]);
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [recoveries, setRecoveries] = useState<RecoveryEntry[]>([]);

  const loadData = useCallback(async () => {
    const [prod, sal, exp, rec] = await Promise.all([
      ProductionStore.getAll(),
      SaleStore.getAll(),
      ExpenseStore.getAll(),
      RecoveryStore.getAll(),
    ]);
    setProduction(prod);
    setSales(sal);
    setExpenses(exp);
    setRecoveries(rec);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Filter by selected date
  const prodDay = production.filter((p) => p.date === selectedDate);
  const salesDay = sales.filter((s) => s.date === selectedDate);
  const expDay = expenses.filter((e) => e.date === selectedDate);

  // Production
  const lotsCount = prodDay.length;
  const totalPacks = prodDay.reduce((sum, p) => sum + p.quantity, 0);
  const sachets = totalPacks * 30;
  const matiereKg = totalPacks * 0.0525;

  // Ventes
  const nombreBL = salesDay.length;
  const totalPacksVendus = salesDay.reduce((sum, s) => sum + s.quantity, 0);
  const ventesCash = salesDay
    .filter((s) => s.mode === "cash")
    .reduce((sum, s) => sum + s.amount, 0);
  const ventesCredit = salesDay
    .filter((s) => s.mode === "credit")
    .reduce((sum, s) => sum + s.amount, 0);
  const caTotal = ventesCash + ventesCredit;

  // Dépenses
  const nbDepenses = expDay.length;
  const totalDepenses = expDay.reduce((sum, e) => sum + e.amount, 0);

  // Résumé financier
  const soldeTresorerie = ventesCash - totalDepenses;
  const beneficeBrut = caTotal - totalDepenses;

  const handlePrint = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 16,
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>
              Rapport journalier
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
              Synthèse quotidienne imprimable
            </Text>
          </View>

          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>
                Date du rapport
              </Text>
              {Platform.OS === "web" ? (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate((e.target as HTMLInputElement).value)}
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 13,
                    color: colors.foreground,
                    backgroundColor: colors.background,
                    outline: "none",
                    cursor: "pointer",
                  }}
                />
              ) : (
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }}>
                  {selectedDate}
                </Text>
              )}
            </View>
            {Platform.OS === "web" && (
              <Pressable
                onPress={handlePrint}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.border : colors.background,
                })}
              >
                <MaterialIcons name="print" size={15} color={colors.foreground} />
                <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "500" }}>
                  Imprimer
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* KPI Cards */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            paddingHorizontal: 24,
            gap: 12,
            marginBottom: 16,
          }}
        >
          <KPICard
            label="PRODUCTION"
            value={`${fmt(totalPacks)} packs`}
            icon="precision-manufacturing"
            accentColor="#3b82f6"
          />
          <KPICard
            label="CHIFFRE D'AFFAIRES"
            value={`${fmt(caTotal)} F`}
            icon="shopping-cart"
            accentColor="#22c55e"
          />
          <KPICard
            label="DÉPENSES"
            value={`${fmt(totalDepenses)} F`}
            icon="receipt"
            accentColor="#ef4444"
          />
          <KPICard
            label="BÉNÉFICE BRUT"
            value={`${beneficeBrut >= 0 ? "+" : ""}${fmt(beneficeBrut)} F`}
            icon="trending-up"
            accentColor="#f59e0b"
            valueColor={beneficeBrut >= 0 ? "#22c55e" : "#ef4444"}
          />
        </View>

        {/* Detail sections — 2 columns on wide screens */}
        <View
          style={{
            paddingHorizontal: 24,
            flexDirection: Platform.OS === "web" ? "row" : "column",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Row 1 */}
          <View
            style={{
              flexDirection: Platform.OS === "web" ? "row" : "column",
              gap: 12,
              flex: 1,
              minWidth: 300,
            }}
          >
            <SectionCard
              title="Production du jour"
              icon="precision-manufacturing"
              iconColor="#3b82f6"
            >
              <DataRow label="Lots produits" value={`${lotsCount}`} />
              <DataRow label="Total packs" value={`${fmt(totalPacks)} packs`} bold />
              <DataRow label="Sachets produits" value={fmt(sachets)} />
              <DataRow label="Matière consommée" value={`${matiereKg.toFixed(2)} kg`} />
            </SectionCard>

            <SectionCard title="Ventes du jour" icon="shopping-cart" iconColor="#22c55e">
              <DataRow label="Nombre de BL" value={`${nombreBL}`} />
              <DataRow label="Total packs vendus" value={`${fmt(totalPacksVendus)} packs`} bold />
              <DataRow label="Ventes Cash" value={`${fmt(ventesCash)} F`} valueColor="#22c55e" />
              <DataRow label="Ventes à Crédit" value={`${fmt(ventesCredit)} F`} valueColor="#f59e0b" />
              <DataRow label="CA total" value={`${fmt(caTotal)} F`} bold />
            </SectionCard>
          </View>

          {/* Row 2 */}
          <View
            style={{
              flexDirection: Platform.OS === "web" ? "row" : "column",
              gap: 12,
              flex: 1,
              minWidth: 300,
            }}
          >
            <SectionCard title="Dépenses du jour" icon="receipt" iconColor="#ef4444">
              <DataRow label="Nombre de dépenses" value={`${nbDepenses}`} />
              <DataRow
                label="Total dépenses"
                value={`${fmt(totalDepenses)} F`}
                valueColor="#ef4444"
                bold
              />
            </SectionCard>

            <SectionCard title="Résumé financier" icon="trending-up" iconColor="#f59e0b">
              <DataRow label="Cash encaissé" value={`${fmt(ventesCash)} F`} valueColor="#22c55e" />
              <DataRow
                label="À recouvrer (crédits)"
                value={`${fmt(ventesCredit)} F`}
                valueColor="#f59e0b"
              />
              <DataRow label="Total sorties" value={`${fmt(totalDepenses)} F`} />
              <DataRow
                label="Solde de trésorerie"
                value={`${soldeTresorerie >= 0 ? "+" : ""}${fmt(soldeTresorerie)} F`}
                valueColor={soldeTresorerie >= 0 ? "#22c55e" : "#ef4444"}
                bold
              />
            </SectionCard>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  icon,
  accentColor,
  valueColor,
}: {
  label: string;
  value: string;
  icon: string;
  accentColor: string;
  valueColor?: string;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 160,
        backgroundColor: colors.surface ?? colors.background,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <MaterialIcons name={icon as any} size={14} color={accentColor} />
        <Text style={{ fontSize: 10, fontWeight: "600", color: colors.muted, letterSpacing: 0.5 }}>
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: 20, fontWeight: "700", color: valueColor ?? colors.foreground }}>
        {value}
      </Text>
    </View>
  );
}

function SectionCard({
  title,
  icon,
  iconColor,
  children,
}: {
  title: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface ?? colors.background,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 20,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 16 }}>
        <MaterialIcons name={icon as any} size={16} color={iconColor} />
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
          {title}
        </Text>
      </View>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

function DataRow({
  label,
  value,
  bold,
  valueColor,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 13, color: colors.muted, flex: 1 }}>{label}</Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: bold ? "700" : "500",
          color: valueColor ?? colors.foreground,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
