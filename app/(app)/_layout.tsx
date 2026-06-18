import { Platform, View } from "react-native";
import { Slot, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AppSidebar } from "@/components/app-sidebar";
import { useColors } from "@/hooks/use-colors";

export default function AppLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (Platform.OS === "web") {
    return (
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.background }}>
        <AppSidebar />
        <View style={{ flex: 1, overflow: "auto" as any }}>
          <Slot />
        </View>
      </View>
    );
  }

  const bottomPadding = Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Ventes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="cart.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="production"
        options={{
          title: "Production",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="hammer.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Dépenses",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="creditcard.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Plus",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="ellipsis.circle.fill" color={color} />
          ),
        }}
      />
      {/* Secondary screens — hidden from tab bar, accessible via "Plus" */}
      <Tabs.Screen name="clients" options={{ href: null }} />
      <Tabs.Screen name="caisse" options={{ href: null }} />
      <Tabs.Screen name="rapport" options={{ href: null }} />
      <Tabs.Screen name="rapports" options={{ href: null }} />
      <Tabs.Screen name="recouvrement" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="stock" options={{ href: null }} />
      <Tabs.Screen name="tournees" options={{ href: null }} />
      <Tabs.Screen name="livraisons" options={{ href: null }} />
      <Tabs.Screen name="commerciaux" options={{ href: null }} />
    </Tabs>
  );
}
