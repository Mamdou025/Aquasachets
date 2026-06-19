import { useState, useEffect } from "react";
import {
  ScrollView, Text, TextInput, TouchableOpacity, View, Alert, Platform, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { DEFAULT_SETTINGS, type Settings } from "@/shared/settings";
import { useDbSettings, useSetDbSettings } from "@/hooks/use-db";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [localSettings, setLocalSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  const dbSettings = useDbSettings();
  const setDbSettings = useSetDbSettings();

  useEffect(() => {
    if (dbSettings.data) setLocalSettings(dbSettings.data);
  }, [dbSettings.data]);

  const handleSave = async () => {
    await setDbSettings.mutateAsync(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    const msg = "Paramètres enregistrés";
    if (Platform.OS === "web") alert(msg);
    else Alert.alert("Succès", msg);
  };

  const updateField = (field: keyof Settings, value: string) => {
    const num = parseFloat(value) || 0;
    setLocalSettings((prev) => ({ ...prev, [field]: num }));
  };

  const coutRevient =
    localSettings.coutRouleaux + localSettings.coutAntiscalant + localSettings.coutEau +
    localSettings.coutMembrane + localSettings.coutElectricite + localSettings.coutLoyer +
    localSettings.coutSalaires + localSettings.coutMaintenance +
    localSettings.commissionCommercial + localSettings.coutCarburant;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-foreground">Paramètres</Text>
          <Text className="text-sm text-muted">Configuration des prix et coûts</Text>
        </View>
      </View>

      {dbSettings.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0077B6" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View className="bg-surface rounded-xl p-4 border border-border mb-4">
            <Text className="text-sm font-semibold text-foreground mb-4">PRIX DE VENTE</Text>
            <SettingField label="Prix de vente par pack (FCFA)" value={localSettings.prixVentePack} onChange={(v) => updateField("prixVentePack", v)} />
          </View>

          <View className="bg-surface rounded-xl p-4 border border-border mb-4">
            <Text className="text-sm font-semibold text-foreground mb-4">COÛTS DIRECTS (VARIABLES)</Text>
            <SettingField label="Rouleaux plastique" value={localSettings.coutRouleaux} onChange={(v) => updateField("coutRouleaux", v)} />
            <SettingField label="Antiscalant + filtres" value={localSettings.coutAntiscalant} onChange={(v) => updateField("coutAntiscalant", v)} />
            <SettingField label="Eau (forage)" value={localSettings.coutEau} onChange={(v) => updateField("coutEau", v)} />
            <SettingField label="Provision membrane RO" value={localSettings.coutMembrane} onChange={(v) => updateField("coutMembrane", v)} />
          </View>

          <View className="bg-surface rounded-xl p-4 border border-border mb-4">
            <Text className="text-sm font-semibold text-foreground mb-4">CHARGES FIXES (PAR PACK)</Text>
            <SettingField label="Électricité" value={localSettings.coutElectricite} onChange={(v) => updateField("coutElectricite", v)} />
            <SettingField label="Loyer atelier" value={localSettings.coutLoyer} onChange={(v) => updateField("coutLoyer", v)} />
            <SettingField label="Salaires (producteur)" value={localSettings.coutSalaires} onChange={(v) => updateField("coutSalaires", v)} />
            <SettingField label="Maintenance moyenne" value={localSettings.coutMaintenance} onChange={(v) => updateField("coutMaintenance", v)} />
          </View>

          <View className="bg-surface rounded-xl p-4 border border-border mb-4">
            <Text className="text-sm font-semibold text-foreground mb-4">DISTRIBUTION & COMMERCIAL</Text>
            <SettingField label="Commission commerciaux" value={localSettings.commissionCommercial} onChange={(v) => updateField("commissionCommercial", v)} />
            <SettingField label="Carburant tricycles" value={localSettings.coutCarburant} onChange={(v) => updateField("coutCarburant", v)} />
          </View>

          <View className="bg-primary/10 rounded-xl p-4 border border-primary/30 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">COÛT DE REVIENT TOTAL</Text>
            <Text className="text-2xl font-bold text-primary">{Math.round(coutRevient)} FCFA / pack</Text>
            <Text className="text-xs text-muted mt-1">
              Marge : {Math.round(localSettings.prixVentePack - coutRevient)} FCFA / pack
            </Text>
          </View>

          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${saved ? "bg-success" : "bg-primary"}`}
            onPress={handleSave}
            activeOpacity={0.7}
            disabled={setDbSettings.isPending}
          >
            {setDbSettings.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-background font-bold text-base">
                  {saved ? "Enregistré !" : "Enregistrer les paramètres"}
                </Text>
            }
          </TouchableOpacity>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

function SettingField({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <View className="mb-3">
      <Text className="text-xs text-muted mb-1">{label}</Text>
      <TextInput
        className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
        value={String(value)}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholderTextColor="#5A7A94"
      />
    </View>
  );
}
