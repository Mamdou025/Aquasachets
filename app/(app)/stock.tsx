import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { USE_ODOO_BACKEND, USE_DB_BACKEND } from "@/constants/data-source";
import { useOdooStock } from "@/hooks/use-odoo";
import { useDbProduction, useDbSales, useDbSettings } from "@/hooks/use-db";

export default function StockScreen() {
  const router = useRouter();
  const colors = useColors();

  const odooStock = useOdooStock();
  const dbProduction = useDbProduction();
  const dbSales = useDbSales();
  const dbSettings = useDbSettings();

  const odooPackProduct =
    USE_ODOO_BACKEND && odooStock.data
      ? odooStock.data.products.find((p) => p.id === odooStock.data?.packProductId) ??
        odooStock.data.products[0]
      : undefined;

  const totalProd = USE_DB_BACKEND
    ? (dbProduction.data ?? []).reduce((sum, p) => sum + p.quantity, 0)
    : 0;
  const totalVendu = USE_DB_BACKEND
    ? (dbSales.data ?? []).reduce((sum, s) => sum + s.quantity, 0)
    : 0;

  const stockRestant = USE_ODOO_BACKEND
    ? odooPackProduct?.quantityOnHand ?? 0
    : USE_DB_BACKEND
    ? totalProd - totalVendu
    : 0;

  const forecastQuantity = USE_ODOO_BACKEND ? odooPackProduct?.forecastQuantity ?? 0 : 0;

  const settings = dbSettings.data;
  const prixVente = USE_ODOO_BACKEND
    ? odooPackProduct?.listPrice ?? 0
    : settings?.prixVentePack ?? 650;

  const coutRevient = USE_ODOO_BACKEND
    ? odooPackProduct?.cost ?? 0
    : settings
    ? settings.coutRouleaux + settings.coutAntiscalant + settings.coutEau +
      settings.coutMembrane + settings.coutElectricite + settings.coutLoyer +
      settings.coutSalaires + settings.coutMaintenance + settings.commissionCommercial +
      settings.coutCarburant
    : 460.78;

  const progressBase = USE_ODOO_BACKEND
    ? Math.max(stockRestant, forecastQuantity, 1)
    : Math.max(totalProd, 1);

  const valeurVente = stockRestant * prixVente;
  const valeurCout = stockRestant * coutRevient;
  const margeStock = valeurVente - valeurCout;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-foreground">Stock</Text>
          <Text className="text-sm text-muted">
            {USE_ODOO_BACKEND ? "État Odoo et valorisation" : "État et valorisation"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* État du stock */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-sm font-semibold text-foreground mb-4">ÉTAT DU STOCK</Text>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-muted">
              {USE_ODOO_BACKEND ? "Produit suivi" : "Total produit (cumul)"}
            </Text>
            <Text className="text-sm font-semibold text-foreground">
              {USE_ODOO_BACKEND ? odooPackProduct?.name ?? "Aucun produit" : `${totalProd} packs`}
            </Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-muted">
              {USE_ODOO_BACKEND ? "Stock prévisionnel" : "Total vendu (cumul)"}
            </Text>
            <Text className="text-sm font-semibold text-foreground">
              {USE_ODOO_BACKEND ? `${forecastQuantity} packs` : `${totalVendu} packs`}
            </Text>
          </View>
          <View className="h-px bg-border my-2" />
          <View className="flex-row justify-between mt-2">
            <Text className="text-base font-bold text-foreground">Stock restant</Text>
            <Text className={`text-xl font-bold ${stockRestant > 50 ? "text-success" : stockRestant > 0 ? "text-warning" : "text-error"}`}>
              {stockRestant} packs
            </Text>
          </View>
          <View className="mt-3 h-3 bg-border rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${stockRestant > 50 ? "bg-success" : stockRestant > 0 ? "bg-warning" : "bg-error"}`}
              style={{ width: `${Math.min((stockRestant / progressBase) * 100, 100)}%` }}
            />
          </View>
        </View>

        {/* Valorisation */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-sm font-semibold text-foreground mb-4">VALORISATION</Text>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-muted">Prix de vente / pack</Text>
            <Text className="text-sm font-semibold text-foreground">{formatMoney(prixVente)} FCFA</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-sm text-muted">Coût de revient / pack</Text>
            <Text className="text-sm font-semibold text-foreground">{formatMoney(coutRevient)} FCFA</Text>
          </View>
          <View className="h-px bg-border my-2" />
          <View className="flex-row justify-between mb-2 mt-2">
            <Text className="text-sm text-muted">Valeur stock (prix vente)</Text>
            <Text className="text-sm font-bold text-foreground">{formatMoney(valeurVente)} F</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted">Valeur stock (coût)</Text>
            <Text className="text-sm font-semibold text-foreground">{formatMoney(valeurCout)} F</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Marge potentielle</Text>
            <Text className="text-sm font-bold text-success">{formatMoney(margeStock)} F</Text>
          </View>
        </View>

        {stockRestant <= 50 && (
          <View className="bg-warning/10 rounded-xl p-4 border border-warning/30">
            <View className="flex-row items-center">
              <MaterialIcons name="warning" size={20} color={colors.warning} />
              <Text className="text-sm font-semibold text-foreground ml-2">Stock bas</Text>
            </View>
            <Text className="text-xs text-muted mt-2">
              Il reste seulement {stockRestant} packs en stock. Pensez à lancer une nouvelle production.
            </Text>
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
