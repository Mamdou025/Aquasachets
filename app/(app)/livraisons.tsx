import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  useCreateOdooReceipt,
  useOdooRawMaterials,
  useOdooReceipts,
} from "@/hooks/use-odoo";
import { USE_ODOO_BACKEND } from "@/constants/data-source";

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

function StateChip({ state }: { state: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    done:    { label: "Terminé",   bg: "#dcfce7", text: "#15803d" },
    draft:   { label: "Brouillon", bg: "#f1f5f9", text: "#475569" },
    assigned:{ label: "Prêt",      bg: "#dbeafe", text: "#1d4ed8" },
    waiting: { label: "En attente",bg: "#fef9c3", text: "#a16207" },
    cancel:  { label: "Annulé",    bg: "#fee2e2", text: "#dc2626" },
  };
  const s = map[state] ?? { label: state, bg: "#f1f5f9", text: "#475569" };
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: s.text }}>{s.label}</Text>
    </View>
  );
}

export default function LivraisonsScreen() {
  const colors = useColors();
  const receipts = useOdooReceipts(100);
  const rawMaterials = useOdooRawMaterials();
  const createReceipt = useCreateOdooReceipt();

  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [formError, setFormError] = useState("");

  const handleCreate = async () => {
    const pid = parseInt(productId, 10);
    const qty = parseFloat(quantity);
    if (!pid || isNaN(pid)) { setFormError("Sélectionnez un produit."); return; }
    if (!qty || qty <= 0)   { setFormError("Quantité invalide."); return; }
    setFormError("");
    try {
      await createReceipt.mutateAsync({ productId: pid, quantity: qty, reference: reference || undefined });
      setShowForm(false);
      setProductId("");
      setQuantity("");
      setReference("");
    } catch (err: any) {
      setFormError(err?.message ?? "Erreur lors de la création.");
    }
  };

  if (!USE_ODOO_BACKEND) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <MaterialIcons name="cloud-off" size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, marginTop: 12, textAlign: "center", fontSize: 15 }}>
            Activez le backend Odoo pour gérer les livraisons de rouleaux.{"\n"}
            Définissez EXPO_PUBLIC_DATA_BACKEND=odoo dans votre .env
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>Livraisons rouleaux</Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>Réception des matières premières</Text>
          </View>
          <Pressable
            onPress={() => setShowForm((v) => !v)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: pressed ? colors.primary + "cc" : colors.primary,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
            })}
          >
            <MaterialIcons name={showForm ? "close" : "add"} size={18} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
              {showForm ? "Annuler" : "Nouvelle réception"}
            </Text>
          </Pressable>
        </View>

        {/* Receipt form */}
        {showForm && (
          <View style={{ marginHorizontal: 24, marginBottom: 16, backgroundColor: colors.surface ?? colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>Enregistrer une réception</Text>

            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Produit (ID Odoo)</Text>
            {rawMaterials.data && rawMaterials.data.length > 0 ? (
              <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 12 }}>
                {rawMaterials.data.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => setProductId(String(p.id))}
                    style={{ padding: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 0.5, borderBottomColor: colors.border }}
                  >
                    <Text style={{ fontSize: 13, color: colors.foreground }}>{p.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 12, color: colors.muted }}>{fmt(p.quantityOnHand)} en stock</Text>
                      {String(p.id) === productId && <MaterialIcons name="check-circle" size={16} color={colors.primary} />}
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <TextInput
                value={productId}
                onChangeText={setProductId}
                placeholder="ID produit (ex: 42)"
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginBottom: 12, color: colors.foreground, fontSize: 13 }}
                placeholderTextColor={colors.muted}
              />
            )}

            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Quantité reçue</Text>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Ex: 500"
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginBottom: 12, color: colors.foreground, fontSize: 13 }}
              placeholderTextColor={colors.muted}
            />

            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Référence (optionnel)</Text>
            <TextInput
              value={reference}
              onChangeText={setReference}
              placeholder="Ex: BL-2024-001"
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginBottom: 12, color: colors.foreground, fontSize: 13 }}
              placeholderTextColor={colors.muted}
            />

            {formError ? (
              <Text style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{formError}</Text>
            ) : null}

            <Pressable
              onPress={handleCreate}
              disabled={createReceipt.isPending}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#1d4ed8" : "#3b82f6",
                borderRadius: 8,
                padding: 12,
                alignItems: "center",
                opacity: createReceipt.isPending ? 0.6 : 1,
              })}
            >
              {createReceipt.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>Enregistrer dans Odoo</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Raw materials stock */}
        <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 10 }}>Stock matières premières</Text>
          {rawMaterials.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : rawMaterials.error ? (
            <Text style={{ color: "#ef4444", fontSize: 13 }}>Erreur : {rawMaterials.error.message}</Text>
          ) : rawMaterials.data?.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 13 }}>Aucun produit trouvé dans Odoo.</Text>
          ) : (
            <View style={{ borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
              {rawMaterials.data?.map((p, i) => (
                <View
                  key={p.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 12,
                    backgroundColor: i % 2 === 0 ? (colors.surface ?? colors.background) : colors.background,
                    borderBottomWidth: i < (rawMaterials.data?.length ?? 0) - 1 ? 0.5 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}>{p.name}</Text>
                    {p.code ? <Text style={{ fontSize: 11, color: colors.muted }}>{p.code}</Text> : null}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: p.quantityOnHand <= 0 ? "#ef4444" : colors.foreground }}>
                      {fmt(p.quantityOnHand)}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>{p.uom}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent receipts */}
        <View style={{ marginHorizontal: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 10 }}>Réceptions récentes</Text>
          {receipts.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : receipts.error ? (
            <Text style={{ color: "#ef4444", fontSize: 13 }}>Erreur : {receipts.error.message}</Text>
          ) : receipts.data?.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 13 }}>Aucune réception enregistrée.</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {receipts.data?.map((r) => (
                <View
                  key={r.id}
                  style={{ backgroundColor: colors.surface ?? colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 14 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{r.name}</Text>
                    <StateChip state={r.state} />
                  </View>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    {r.partnerName ? <Text style={{ fontSize: 12, color: colors.muted }}>Fournisseur : {r.partnerName}</Text> : null}
                    {r.scheduledDate ? <Text style={{ fontSize: 12, color: colors.muted }}>Date : {r.scheduledDate}</Text> : null}
                  </View>
                  {r.origin ? <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Réf. : {r.origin}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
