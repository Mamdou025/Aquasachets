import { Text, TouchableOpacity, View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface MenuItem {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    title: "Rapport journalier",
    subtitle: "Synthèse quotidienne imprimable",
    icon: "assessment",
    route: "/rapport",
  },
  {
    title: "Clients",
    subtitle: "Gérer la liste des clients",
    icon: "people",
    route: "/clients",
  },
  {
    title: "Tournées",
    subtitle: "Suivi des livreurs",
    icon: "local-shipping",
    route: "/tournees",
  },
  {
    title: "Caisse",
    subtitle: "Suivi journalier de caisse",
    icon: "account-balance-wallet",
    route: "/caisse",
  },
  {
    title: "Stock",
    subtitle: "État du stock et valorisation",
    icon: "inventory",
    route: "/stock",
  },
  {
    title: "Recouvrement",
    subtitle: "Suivi des crédits clients",
    icon: "receipt-long",
    route: "/recouvrement",
  },
  {
    title: "Rapports mensuels",
    subtitle: "Compte de résultat et rentabilité",
    icon: "bar-chart",
    route: "/rapports",
  },
  {
    title: "Paramètres",
    subtitle: "Configuration des prix et coûts",
    icon: "settings",
    route: "/settings",
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-foreground">Plus</Text>
        <Text className="text-sm text-muted mt-1">Modules complémentaires</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            className="bg-surface rounded-xl p-4 mb-3 border border-border flex-row items-center"
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
              <MaterialIcons name={item.icon as any} size={22} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">{item.title}</Text>
              <Text className="text-xs text-muted mt-0.5">{item.subtitle}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
