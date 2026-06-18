import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import {
  ExpenseStore,
  generateId,
  type ExpenseEntry,
} from "@/lib/store";

const CATEGORIES = ["Variable", "Fixe", "Distribution", "Ponctuel", "Amortissement"] as const;

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ExpensesScreen() {
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [date, setDate] = useState(getToday());
  const [category, setCategory] = useState<ExpenseEntry["category"]>("Variable");
  const [designation, setDesignation] = useState("");
  const [amount, setAmount] = useState("");
  const [supplier, setSupplier] = useState("");

  const loadData = useCallback(async () => {
    const data = await ExpenseStore.getAll();
    setEntries(data.sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAdd = async () => {
    const amt = parseFloat(amount);
    if (!designation.trim() || !amt || amt <= 0) {
      const msg = "Veuillez remplir la désignation et le montant";
      if (Platform.OS === "web") alert(msg);
      else Alert.alert("Erreur", msg);
      return;
    }

    const entry: ExpenseEntry = {
      id: generateId(),
      date,
      category,
      designation: designation.trim(),
      amount: amt,
      type: category,
      supplier: supplier.trim(),
    };

    await ExpenseStore.add(entry);
    setDesignation("");
    setAmount("");
    setSupplier("");
    setShowForm(false);
    await loadData();
  };

  const totalMonth = entries
    .filter((e) => e.date.startsWith(getToday().substring(0, 7)))
    .reduce((sum, e) => sum + e.amount, 0);

  // Répartition par catégorie
  const byCategory = CATEGORIES.map((cat) => ({
    category: cat,
    total: entries
      .filter((e) => e.category === cat && e.date.startsWith(getToday().substring(0, 7)))
      .reduce((sum, e) => sum + e.amount, 0),
  }));

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-foreground">Dépenses</Text>
          <Text className="text-sm text-muted mt-1">
            Total ce mois : {formatMoney(totalMonth)} FCFA
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
            Nouvelle dépense
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
            <Text className="text-xs text-muted mb-1">Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    className={`px-3 py-1.5 rounded-full border ${
                      category === cat
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                    }`}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        category === cat ? "text-background" : "text-foreground"
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Désignation</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={designation}
              onChangeText={setDesignation}
              placeholder="Ex: Achat rouleaux plastique"
              placeholderTextColor="#5A7A94"
            />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Montant (FCFA)</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Ex: 50000"
              placeholderTextColor="#5A7A94"
            />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Fournisseur (optionnel)</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={supplier}
              onChangeText={setSupplier}
              placeholder="Nom du fournisseur"
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
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          totalMonth > 0 ? (
            <View className="bg-surface rounded-xl p-3 mb-4 border border-border">
              <Text className="text-xs text-muted mb-2">Répartition ce mois</Text>
              {byCategory
                .filter((c) => c.total > 0)
                .map((c) => (
                  <View key={c.category} className="flex-row justify-between py-1">
                    <Text className="text-sm text-foreground">{c.category}</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {formatMoney(c.total)} F
                    </Text>
                  </View>
                ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-sm text-muted">{item.date}</Text>
                <Text className="text-base font-semibold text-foreground mt-1">
                  {item.designation}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  {item.category} {item.supplier ? `• ${item.supplier}` : ""}
                </Text>
              </View>
              <Text className="text-lg font-bold text-error">
                -{formatMoney(item.amount)} F
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-8">
            <Text className="text-muted">Aucune dépense enregistrée</Text>
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
