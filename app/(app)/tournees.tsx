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
import { useFocusEffect, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { TourneeStore, SettingsStore, generateId, type TourneeEntry } from "@/lib/store";
import { useColors } from "@/hooks/use-colors";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function TourneesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [entries, setEntries] = useState<TourneeEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [prixVente, setPrixVente] = useState(650);

  // Form
  const [date, setDate] = useState(getToday());
  const [livreur, setLivreur] = useState("");
  const [sortis, setSortis] = useState("");
  const [rendus, setRendus] = useState("");
  const [cashRemis, setCashRemis] = useState("");

  const loadData = useCallback(async () => {
    const [data, settings] = await Promise.all([
      TourneeStore.getAll(),
      SettingsStore.get(),
    ]);
    setEntries(data.sort((a, b) => b.date.localeCompare(a.date)));
    setPrixVente(settings.prixVentePack);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAdd = async () => {
    const s = parseInt(sortis, 10) || 0;
    const r = parseInt(rendus, 10) || 0;
    const cash = parseFloat(cashRemis) || 0;

    if (!livreur.trim() || s <= 0) {
      const msg = "Veuillez remplir le livreur et les packs sortis";
      if (Platform.OS === "web") alert(msg);
      else Alert.alert("Erreur", msg);
      return;
    }

    const vendus = s - r;
    const cashAttendu = vendus * prixVente;
    const ecart = cash - cashAttendu;

    const entry: TourneeEntry = {
      id: generateId(),
      date,
      livreur: livreur.trim(),
      sortis: s,
      rendus: r,
      vendus,
      cashAttendu,
      cashRemis: cash,
      ecart,
    };

    await TourneeStore.add(entry);
    setLivreur("");
    setSortis("");
    setRendus("");
    setCashRemis("");
    setShowForm(false);
    await loadData();
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-foreground">Tournées</Text>
            <Text className="text-sm text-muted">Suivi des livreurs</Text>
          </View>
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
            Nouvelle tournée
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
            <Text className="text-xs text-muted mb-1">Livreur</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={livreur}
              onChangeText={setLivreur}
              placeholder="Nom du livreur"
              placeholderTextColor="#5A7A94"
            />
          </View>
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Packs sortis</Text>
              <TextInput
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                value={sortis}
                onChangeText={setSortis}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#5A7A94"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted mb-1">Packs rendus</Text>
              <TextInput
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                value={rendus}
                onChangeText={setRendus}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#5A7A94"
              />
            </View>
          </View>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Cash remis (FCFA)</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={cashRemis}
              onChangeText={setCashRemis}
              keyboardType="numeric"
              placeholder="Montant remis"
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
        renderItem={({ item }) => (
          <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <Text className="text-sm text-muted">{item.date}</Text>
                <Text className="text-base font-semibold text-foreground mt-1">
                  {item.livreur}
                </Text>
              </View>
              <View
                className={`px-2 py-0.5 rounded-full ${
                  item.ecart >= 0 ? "bg-success/20" : "bg-error/20"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    item.ecart >= 0 ? "text-success" : "text-error"
                  }`}
                >
                  Écart: {item.ecart >= 0 ? "+" : ""}{item.ecart} F
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between mt-2">
              <View className="items-center">
                <Text className="text-xs text-muted">Sortis</Text>
                <Text className="text-sm font-semibold text-foreground">{item.sortis}</Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-muted">Rendus</Text>
                <Text className="text-sm font-semibold text-foreground">{item.rendus}</Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-muted">Vendus</Text>
                <Text className="text-sm font-semibold text-foreground">{item.vendus}</Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-muted">Cash remis</Text>
                <Text className="text-sm font-semibold text-foreground">{item.cashRemis} F</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-8">
            <Text className="text-muted">Aucune tournée enregistrée</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
