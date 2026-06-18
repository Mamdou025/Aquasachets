import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import { ProductionStore, generateId, type ProductionEntry } from "@/lib/store";
import { USE_DB_BACKEND } from "@/constants/data-source";
import { useDbProduction, useCreateDbProduction, useDeleteDbProduction } from "@/hooks/use-db";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ProductionScreen() {
  const [localEntries, setLocalEntries] = useState<ProductionEntry[]>([]);
  const [date, setDate] = useState(getToday());
  const [quantity, setQuantity] = useState("");
  const [showForm, setShowForm] = useState(false);

  const dbProduction = useDbProduction();
  const createDbProduction = useCreateDbProduction();
  const deleteDbProduction = useDeleteDbProduction();

  const entries: ProductionEntry[] = USE_DB_BACKEND
    ? (dbProduction.data ?? [])
    : localEntries;

  const loadLocal = useCallback(async () => {
    if (USE_DB_BACKEND) return;
    const data = await ProductionStore.getAll();
    setLocalEntries(data.sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  useFocusEffect(useCallback(() => { loadLocal(); }, [loadLocal]));

  const handleAdd = async () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      const msg = "Veuillez saisir une quantité valide";
      if (Platform.OS === "web") alert(msg);
      else Alert.alert("Erreur", msg);
      return;
    }
    if (USE_DB_BACKEND) {
      await createDbProduction.mutateAsync({ date, quantity: qty });
    } else {
      await ProductionStore.add({ id: generateId(), date, quantity: qty });
      await loadLocal();
    }
    setQuantity("");
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (USE_DB_BACKEND) {
      await deleteDbProduction.mutateAsync({ id });
    } else {
      await ProductionStore.delete(id);
      await loadLocal();
    }
  };

  const totalMonth = entries
    .filter((e) => e.date.startsWith(getToday().substring(0, 7)))
    .reduce((sum, e) => sum + e.quantity, 0);

  return (
    <ScreenContainer>
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-foreground">Production</Text>
          <Text className="text-sm text-muted mt-1">Total ce mois : {totalMonth} packs</Text>
        </View>
        <TouchableOpacity
          className="bg-primary rounded-full w-10 h-10 items-center justify-center"
          onPress={() => setShowForm(!showForm)}
          activeOpacity={0.7}
        >
          <Text className="text-background text-xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View className="mx-4 mt-3 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-3">Nouvelle production</Text>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Date</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" placeholderTextColor="#5A7A94"
            />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Quantité (packs)</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={quantity} onChangeText={setQuantity} keyboardType="numeric"
              placeholder="Ex: 150" placeholderTextColor="#5A7A94" returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
          </View>
          <TouchableOpacity
            className="bg-primary rounded-lg py-3 items-center"
            onPress={handleAdd} activeOpacity={0.7}
            disabled={createDbProduction.isPending}
          >
            {createDbProduction.isPending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text className="text-background font-semibold">Enregistrer</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <View className="bg-surface rounded-xl p-4 mb-3 border border-border flex-row justify-between items-center">
            <View>
              <Text className="text-sm text-muted">{item.date}</Text>
              <Text className="text-lg font-bold text-foreground mt-1">{item.quantity} packs</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} activeOpacity={0.7} style={{ padding: 8 }}>
              <Text className="text-error text-sm">Suppr.</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-8">
            {USE_DB_BACKEND && dbProduction.isLoading
              ? <ActivityIndicator color="#0077B6" />
              : <Text className="text-muted">Aucune production enregistrée</Text>
            }
          </View>
        }
      />
    </ScreenContainer>
  );
}
