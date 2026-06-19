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
  { title: "Tableau de bord",    icon: "dashboard",              route: "/" },
  { title: "Production",         icon: "precision-manufacturing", route: "/production" },
  { title: "Ventes",             icon: "shopping-cart",          route: "/sales" },
  { title: "Clients",            icon: "people-outline",         route: "/clients" },
  { title: "Commerciaux",        icon: "badge",                  route: "/commerciaux" },
  { title: "Dépenses",           icon: "receipt-long",           route: "/expenses" },
  { title: "Stock",              icon: "inventory-2",            route: "/stock" },
  { title: "Livraisons rouleaux",icon: "local-shipping",         route: "/livraisons" },
  { title: "Recouvrement",       icon: "account-balance-wallet", route: "/recouvrement" },
  { title: "Tournées livreurs",  icon: "directions-car",         route: "/tournees" },
  { title: "Rapport journalier", icon: "insert-chart-outlined",  route: "/rapport" },
  { title: "Journal d'activité", icon: "history",                route: "/caisse" },
  { title: "Administration",     icon: "settings",               route: "/settings" },
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
    <View style={{
      width: 220,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}>
        <View style={{
          width: 32,
          height: 32,
          backgroundColor: colors.primary,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <MaterialIcons name="water-drop" size={18} color="#fff" />
        </View>
        <View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, lineHeight: 18 }}>
            AquaSachet
          </Text>
          <Text style={{ fontSize: 10, color: colors.muted, marginTop: 1 }}>
            Gestion de production
          </Text>
        </View>
      </View>

      {/* Nav */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {SIDEBAR_ITEMS.map((item) => {
          const active = isActive(item.route);
          return (
            <TouchableOpacity
              key={item.title}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderRadius: 8,
                marginBottom: 2,
                backgroundColor: active ? colors.primary + "15" : "transparent",
              }}
            >
              <MaterialIcons
                name={item.icon as any}
                size={18}
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
              {active && (
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.primary,
                }} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
