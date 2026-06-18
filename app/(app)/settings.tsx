import { useCallback, useState } from "react";
import {
  ScrollView,
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
import { SettingsStore, type Settings, DEFAULT_SETTINGS } from "@/lib/store";
import { useColors } from "@/hooks/use-colors";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  const loadData = useCallback(async () => {
    const data = await SettingsStore.get();
    setSettings(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSave = async () => {
    await SettingsStore.set(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    const msg = "Paramètres enregistrés";
    if (Platform.OS === "web") alert(msg);
    else Alert.alert("Succès", msg);
  };

  const updateField = (field: keyof Settings, value: string) => {
    const num = parseFloat(value) || 0;
    setSettings((prev) => ({ ...prev, [field]: num }));
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-foreground">Paramètres</Text>
          <Text className="text-sm text-muted">Configuration des prix et coûts</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Prix de vente */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-sm font-semibold text-foreground mb-4">
            PRIX DE VENTE
          </Text>
          <SettingField
            label="Prix de vente par pack (FCFA)"
            value={settings.prixVentePack}
            onChange={(v) => updateField("prixVentePack", v)}
          />
        </View>

        {/* Coûts variables */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-sm font-semibold text-foreground mb-4">
            COÛTS DIRECTS (VARIABLES)
          </Text>
          <SettingField
            label="Rouleaux plastique"
            value={settings.coutRouleaux}
            onChange={(v) => updateField("coutRouleaux", v)}
          />
          <SettingField
            label="Antiscalant + filtres"
            value={settings.coutAntiscalant}
            onChange={(v) => updateField("coutAntiscalant", v)}
          />
          <SettingField
            label="Eau (forage)"
            value={settings.coutEau}
            onChange={(v) => updateField("coutEau", v)}
          />
          <SettingField
            label="Provision membrane RO"
            value={settings.coutMembrane}
            onChange={(v) => updateField("coutMembrane", v)}
          />
        </View>

        {/* Charges fixes */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-sm font-semibold text-foreground mb-4">
            CHARGES FIXES (PAR PACK)
          </Text>
          <SettingField
            label="Électricité"
            value={settings.coutElectricite}
            onChange={(v) => updateField("coutElectricite", v)}
          />
          <SettingField
            label="Loyer atelier"
            value={settings.coutLoyer}
            onChange={(v) => updateField("coutLoyer", v)}
          />
          <SettingField
            label="Salaires (producteur)"
            value={settings.coutSalaires}
            onChange={(v) => updateField("coutSalaires", v)}
          />
          <SettingField
            label="Maintenance moyenne"
            value={settings.coutMaintenance}
            onChange={(v) => updateField("coutMaintenance", v)}
          />
        </View>

        {/* Distribution */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-sm font-semibold text-foreground mb-4">
            DISTRIBUTION & COMMERCIAL
          </Text>
          <SettingField
            label="Commission commerciaux"
            value={settings.commissionCommercial}
            onChange={(v) => updateField("commissionCommercial", v)}
          />
          <SettingField
            label="Carburant tricycles"
            value={settings.coutCarburant}
            onChange={(v) => updateField("coutCarburant", v)}
          />
        </View>

        {/* Coût de revient calculé */}
        <View className="bg-primary/10 rounded-xl p-4 border border-primary/30 mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            COÛT DE REVIENT TOTAL
          </Text>
          <Text className="text-2xl font-bold text-primary">
            {Math.round(
              settings.coutRouleaux +
                settings.coutAntiscalant +
                settings.coutEau +
                settings.coutMembrane +
                settings.coutElectricite +
                settings.coutLoyer +
                settings.coutSalaires +
                settings.coutMaintenance +
                settings.commissionCommercial +
                settings.coutCarburant
            )}{" "}
            FCFA / pack
          </Text>
          <Text className="text-xs text-muted mt-1">
            Marge : {Math.round(settings.prixVentePack - (
              settings.coutRouleaux +
              settings.coutAntiscalant +
              settings.coutEau +
              settings.coutMembrane +
              settings.coutElectricite +
              settings.coutLoyer +
              settings.coutSalaires +
              settings.coutMaintenance +
              settings.commissionCommercial +
              settings.coutCarburant
            ))} FCFA / pack
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${saved ? "bg-success" : "bg-primary"}`}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text className="text-background font-bold text-base">
            {saved ? "Enregistré !" : "Enregistrer les paramètres"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
}) {
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
