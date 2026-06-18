import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, usePathname } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

interface SidebarItem {
  title: string;
  icon: string;
  route: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { title: "Tableau de bord", icon: "dashboard", route: "/" },
  { title: "Production", icon: "precision-manufacturing", route: "/production" },
  { title: "Ventes", icon: "shopping-cart", route: "/sales" },
  { title: "Clients", icon: "people", route: "/clients" },
  { title: "Dépenses", icon: "receipt", route: "/expenses" },
  { title: "Stock", icon: "inventory", route: "/stock" },
  { title: "Livraisons rouleaux", icon: "inventory-2", route: "/stock" },
  { title: "Recouvrement", icon: "account-balance-wallet", route: "/recouvrement" },
  { title: "Tournées livreurs", icon: "local-shipping", route: "/tournees" },
  { title: "Rapport journalier", icon: "assessment", route: "/rapport" },
  { title: "Journal d'activité", icon: "history", route: "/caisse" },
  { title: "Administration", icon: "settings", route: "/settings" },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useColors();

  const isActive = (route: string) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(route + "/");
  };

  return (
    <View
      style={{
        width: 192,
        backgroundColor: colors.background,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            backgroundColor: colors.primary,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="water-drop" size={16} color="#fff" />
        </View>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>
          AquaSachet
        </Text>
      </View>

      {/* Nav items */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {SIDEBAR_ITEMS.map((item) => {
          const active = isActive(item.route);
          return (
            <TouchableOpacity
              key={item.title}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 9,
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 7,
                marginBottom: 1,
                backgroundColor: active ? colors.primary + "18" : "transparent",
              }}
            >
              <MaterialIcons
                name={item.icon as any}
                size={17}
                color={active ? colors.primary : colors.muted}
              />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 13,
                  fontWeight: active ? "600" : "400",
                  color: active ? colors.primary : colors.foreground,
                  flex: 1,
                }}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
