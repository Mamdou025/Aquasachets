import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import {
  SaleStore,
  ClientStore,
  RecoveryStore,
  SettingsStore,
  generateId,
  type SaleEntry,
  type Client,
  type Settings,
} from "@/lib/store";
import { USE_ODOO_BACKEND } from "@/constants/data-source";
import { useCreateOdooSale, useOdooSales } from "@/hooks/use-odoo";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function SalesScreen() {
  const [entries, setEntries] = useState<SaleEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [date, setDate] = useState(getToday());
  const [clientName, setClientName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [mode, setMode] = useState<"cash" | "credit">("cash");
  const [commercial, setCommercial] = useState("");
  const odooSales = useOdooSales();
  const createOdooSale = useCreateOdooSale();

  const displayedEntries: SaleEntry[] = USE_ODOO_BACKEND
    ? (odooSales.data ?? []).map((sale) => ({
        id: String(sale.id),
        date: sale.date,
        clientId: sale.clientId ? String(sale.clientId) : "",
        clientName: sale.clientName,
        quantity: sale.quantity,
        mode: sale.paymentMode === "credit" ? "credit" : "cash",
        commercial: sale.state,
        amount: sale.amountTotal,
      }))
    : entries;

  const loadData = useCallback(async () => {
    const [sal, cli, sett] = await Promise.all([
      SaleStore.getAll(),
      ClientStore.getAll(),
      SettingsStore.get(),
    ]);
    setEntries(sal.sort((a, b) => b.date.localeCompare(a.date)));
    setClients(cli);
    setSettings(sett);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAdd = async () => {
    const qty = parseInt(quantity, 10);
    if (!clientName.trim() || !qty || qty <= 0) {
      const msg = "Veuillez remplir le client et la quantité";
      if (Platform.OS === "web") alert(msg);
      else Alert.alert("Erreur", msg);
      return;
    }

    const prix = settings?.prixVentePack ?? 650;
    const amount = qty * prix;

    const entry: SaleEntry = {
      id: generateId(),
      date,
      clientId: "",
      clientName: clientName.trim(),
      quantity: qty,
      mode,
      commercial: commercial.trim(),
      amount,
    };

    if (USE_ODOO_BACKEND) {
      await createOdooSale.mutateAsync({
        partnerName: entry.clientName,
        quantity: qty,
        priceUnit: prix,
        paymentMode: mode,
        confirm: true,
      });
    } else {
      await SaleStore.add(entry);

      // Si crédit, ajouter au recouvrement
      if (mode === "credit") {
        await RecoveryStore.add({
          id: generateId(),
          saleId: entry.id,
          clientName: entry.clientName,
          amount,
          date: entry.date,
          status: "en_cours",
        });
      }
    }

    setClientName("");
    setQuantity("");
    setCommercial("");
    setMode("cash");
    setShowForm(false);
    if (!USE_ODOO_BACKEND) {
      await loadData();
    }
  };

  const totalMonth = displayedEntries
    .filter((e) => e.date.startsWith(getToday().substring(0, 7)))
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-foreground">Ventes</Text>
          <Text className="text-sm text-muted mt-1">
            CA ce mois : {formatMoney(totalMonth)} FCFA
          </Text>
        </View>
        <TouchableOpacity
          className="bg-primary rounded-full w-10 h-10 items-center justify-center"
          onPress={() => setShowForm(!showForm)}
          activeOpacity={0.7}
        >
          <Text className="text-background text-xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      {showForm && (
        <View className="mx-4 mt-3 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-3">
            Nouvelle vente
          </Text>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Date</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={date}
              onChangeText={setDate}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor="#5A7A94"
            />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Client</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={clientName}
              onChangeText={setClientName}
              placeholder="Nom du client"
              placeholderTextColor="#5A7A94"
            />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Quantité (packs)</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="Ex: 50"
              placeholderTextColor="#5A7A94"
            />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Mode de paiement</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg items-center border ${
                  mode === "cash"
                    ? "bg-primary border-primary"
                    : "bg-background border-border"
                }`}
                onPress={() => setMode("cash")}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-semibold ${
                    mode === "cash" ? "text-background" : "text-foreground"
                  }`}
                >
                  Cash
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg items-center border ${
                  mode === "credit"
                    ? "bg-warning border-warning"
                    : "bg-background border-border"
                }`}
                onPress={() => setMode("credit")}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-semibold ${
                    mode === "credit" ? "text-background" : "text-foreground"
                  }`}
                >
                  Crédit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Commercial</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={commercial}
              onChangeText={setCommercial}
              placeholder="Nom du commercial (optionnel)"
              placeholderTextColor="#5A7A94"
            />
          </View>
          <TouchableOpacity
            className="bg-primary rounded-lg py-3 items-center"
            onPress={handleAdd}
            activeOpacity={0.7}
          >
            <Text className="text-background font-semibold">Enregistrer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={displayedEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-sm text-muted">{item.date}</Text>
                <Text className="text-base font-semibold text-foreground mt-1">
                  {item.clientName}
                </Text>
                <Text className="text-sm text-muted mt-1">
                  {item.quantity > 0 ? `${item.quantity} packs` : "Commande Odoo"} • {item.commercial || "—"}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-foreground">
                  {formatMoney(item.amount)} F
                </Text>
                <View
                  className={`mt-1 px-2 py-0.5 rounded-full ${
                    item.mode === "cash" ? "bg-success/20" : "bg-warning/20"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      item.mode === "cash" ? "text-success" : "text-warning"
                    }`}
                  >
                    {item.mode === "cash" ? "Cash" : "Crédit"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-8">
            <Text className="text-muted">
              {USE_ODOO_BACKEND && odooSales.isLoading
                ? "Chargement des ventes..."
                : "Aucune vente enregistrée"}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}k`;
  return `${Math.round(amount)}`;
}
