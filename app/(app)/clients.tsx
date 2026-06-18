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
import { ClientStore, generateId, type Client } from "@/lib/store";
import { useColors } from "@/hooks/use-colors";
import { USE_ODOO_BACKEND, USE_DB_BACKEND } from "@/constants/data-source";
import { useArchiveOdooClient, useCreateOdooClient, useOdooClients } from "@/hooks/use-odoo";
import { useDbClients, useCreateDbClient, useDeleteDbClient } from "@/hooks/use-db";

export default function ClientsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [zone, setZone] = useState("");
  const [phone, setPhone] = useState("");
  const odooClients = useOdooClients();
  const createOdooClient = useCreateOdooClient();
  const archiveOdooClient = useArchiveOdooClient();
  const dbClients = useDbClients();
  const createDbClient = useCreateDbClient();
  const deleteDbClient = useDeleteDbClient();

  const displayedClients: Client[] = USE_ODOO_BACKEND
    ? (odooClients.data ?? []).map((client) => ({
        id: String(client.id),
        name: client.name,
        zone: client.zone,
        phone: client.phone,
      }))
    : USE_DB_BACKEND
    ? (dbClients.data ?? []).map((c) => ({
        id: c.id, name: c.name, zone: c.zone, phone: c.phone,
      }))
    : clients;

  const loadData = useCallback(async () => {
    const data = await ClientStore.getAll();
    setClients(data.sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAdd = async () => {
    if (!name.trim()) {
      const msg = "Veuillez saisir le nom du client";
      if (Platform.OS === "web") alert(msg);
      else Alert.alert("Erreur", msg);
      return;
    }
    if (USE_ODOO_BACKEND) {
      await createOdooClient.mutateAsync({ name: name.trim(), zone: zone.trim() || undefined, phone: phone.trim() || undefined });
    } else if (USE_DB_BACKEND) {
      await createDbClient.mutateAsync({ name: name.trim(), zone: zone.trim() || undefined, phone: phone.trim() || undefined });
    } else {
      await ClientStore.add({ id: generateId(), name: name.trim(), zone: zone.trim(), phone: phone.trim() });
    }

    setName(""); setZone(""); setPhone(""); setShowForm(false);
    if (!USE_ODOO_BACKEND && !USE_DB_BACKEND) await loadData();
  };

  const handleDelete = async (id: string) => {
    if (USE_ODOO_BACKEND) {
      await archiveOdooClient.mutateAsync({ id: Number(id) });
    } else if (USE_DB_BACKEND) {
      await deleteDbClient.mutateAsync({ id });
    } else {
      await ClientStore.delete(id);
      await loadData();
    }
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
            <Text className="text-2xl font-bold text-foreground">Clients</Text>
            <Text className="text-sm text-muted">{displayedClients.length} client(s)</Text>
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
            Nouveau client
          </Text>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Nom</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={name}
              onChangeText={setName}
              placeholder="Nom du client"
              placeholderTextColor="#5A7A94"
            />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Zone</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={zone}
              onChangeText={setZone}
              placeholder="Zone de livraison"
              placeholderTextColor="#5A7A94"
            />
          </View>
          <View className="mb-3">
            <Text className="text-xs text-muted mb-1">Téléphone</Text>
            <TextInput
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              value={phone}
              onChangeText={setPhone}
              placeholder="Numéro de téléphone"
              placeholderTextColor="#5A7A94"
              keyboardType="phone-pad"
            />
          </View>
          <TouchableOpacity
            className="bg-primary rounded-lg py-3 items-center"
            onPress={handleAdd}
            activeOpacity={0.7}
          >
            <Text className="text-background font-semibold">Ajouter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={displayedClients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <View className="bg-surface rounded-xl p-4 mb-3 border border-border flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Text className="text-primary font-bold text-lg">
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                {item.name}
              </Text>
              <Text className="text-xs text-muted mt-0.5">
                {item.zone || "—"} • {item.phone || "—"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} activeOpacity={0.7} style={{ padding: 8 }}>
              <MaterialIcons name="delete-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-8">
            <Text className="text-muted">
              {(USE_ODOO_BACKEND && odooClients.isLoading) || (USE_DB_BACKEND && dbClients.isLoading)
                ? "Chargement des clients..."
                : "Aucun client enregistré"}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
