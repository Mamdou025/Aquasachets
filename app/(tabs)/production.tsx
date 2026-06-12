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
  ProductionStore,
  generateId,
  type ProductionEntry,
} from "@/lib/store";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ProductionScreen() {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [date, setDate] = useState(getToday());
  const [quantity, setQuantity] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    const data = await ProductionStore.getAll();
    setEntries(data.sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAdd = async () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      if (Platform.OS === "web") {
        alert("Veuillez saisir une quantité valide");
      } else {
        Alert.alert("Erreur", "Veuillez saisir une quantité valide");
      }
      return;
    }
    const entry: ProductionEntry = {
      id: generateId(),
      date,
      quantity: qty,
    };
    await ProductionStore.add(entry);
    setQuantity("");
    setShowForm(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await ProductionStore.delete(id);
    await loadData();
  };

  const totalMonth = entries
    .filter((e) => e.date.startsWith(getToday().substring(0, 7)))
    .reduce((sum, e) => sum + e.quantity, 0);

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-foreground">Production</Text>
          <Text className="text-sm text-muted mt-1">
            Total ce mois : {totalMonth} packs
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
            Nouvelle production
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
            <Text className="text-xs text-muted mb-1">Quantité (packs)</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="Ex: 150"
              placeholderTextColor="#5A7A94"
              returnKeyType="done"
              onSubmitEditing={handleAdd}
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
        renderItem={({ item }) => (
          <View className="bg-surface rounded-xl p-4 mb-3 border border-border flex-row justify-between items-center">
            <View>
              <Text className="text-sm text-muted">{item.date}</Text>
              <Text className="text-lg font-bold text-foreground mt-1">
                {item.quantity} packs
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              activeOpacity={0.7}
              style={{ padding: 8 }}
            >
              <Text className="text-error text-sm">Suppr.</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-8">
            <Text className="text-muted">Aucune production enregistrée</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
