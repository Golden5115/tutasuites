import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native"
import { COLORS } from "../constants/theme"
import { MenuItem, PROTEIN_ADDONS, SIDE_ADDONS } from "../constants/menuData"

interface MealDetailModalProps {
  item: MenuItem | null
  visible: boolean
  onClose: () => void
  onAddToCart: (customizedItem: any) => void
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  item,
  visible,
  onClose,
  onAddToCart,
}) => {
  if (!item) return null

  const [quantity, setQuantity] = useState(1)
  const [selectedProteins, setSelectedProteins] = useState<string[]>([])
  const [selectedSides, setSelectedSides] = useState<string[]>([])
  const [specialInstructions, setSpecialInstructions] = useState("")

  const toggleProtein = (id: string) => {
    setSelectedProteins((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleSide = (id: string) => {
    setSelectedSides((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  // Calculate total
  const proteinCost = selectedProteins.reduce((sum, id) => {
    const p = PROTEIN_ADDONS.find((item) => item.id === id)
    return sum + (p ? p.price : 0)
  }, 0)

  const sideCost = selectedSides.reduce((sum, id) => {
    const s = SIDE_ADDONS.find((item) => item.id === id)
    return sum + (s ? s.price : 0)
  }, 0)

  const singleItemTotal = item.price + proteinCost + sideCost
  const grandTotal = singleItemTotal * quantity

  const handleConfirm = () => {
    const proteinNames = selectedProteins
      .map((id) => PROTEIN_ADDONS.find((p) => p.id === id)?.name)
      .filter(Boolean)
    const sideNames = selectedSides
      .map((id) => SIDE_ADDONS.find((s) => s.id === id)?.name)
      .filter(Boolean)

    onAddToCart({
      id: `${item.id}-${Date.now()}`,
      itemId: item.id,
      name: item.name,
      basePrice: item.price,
      unitPrice: singleItemTotal,
      quantity,
      totalPrice: grandTotal,
      image: item.image,
      proteins: proteinNames,
      sides: sideNames,
      instructions: specialInstructions,
    })

    // Reset
    setQuantity(1)
    setSelectedProteins([])
    setSelectedSides([])
    setSpecialInstructions("")
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Header Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.price}>₦{item.price.toLocaleString()}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
              <Text style={styles.prepTime}>⏱ Prep Time: {item.prepTime}</Text>
            </View>

            {/* Protein Addons */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choice of Protein (Optional)</Text>
              <Text style={styles.sectionSubtitle}>Select one or more to add to your dish</Text>
              {PROTEIN_ADDONS.map((prot) => {
                const isChecked = selectedProteins.includes(prot.id)
                return (
                  <TouchableOpacity
                    key={prot.id}
                    activeOpacity={0.7}
                    onPress={() => toggleProtein(prot.id)}
                    style={[styles.addonRow, isChecked && styles.addonRowActive]}
                  >
                    <View style={styles.addonLeft}>
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.addonName}>{prot.name}</Text>
                    </View>
                    <Text style={styles.addonPrice}>+₦{prot.price.toLocaleString()}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Sides Addons */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delicious Sides</Text>
              <Text style={styles.sectionSubtitle}>Add tasty extras</Text>
              {SIDE_ADDONS.map((side) => {
                const isChecked = selectedSides.includes(side.id)
                return (
                  <TouchableOpacity
                    key={side.id}
                    activeOpacity={0.7}
                    onPress={() => toggleSide(side.id)}
                    style={[styles.addonRow, isChecked && styles.addonRowActive]}
                  >
                    <View style={styles.addonLeft}>
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.addonName}>{side.name}</Text>
                    </View>
                    <Text style={styles.addonPrice}>+₦{side.price.toLocaleString()}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Cooking Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Special Chef Instructions</Text>
              <TextInput
                placeholder="e.g. Extra spicy, no onions, package pepper soup separately..."
                placeholderTextColor={COLORS.textMuted}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                style={styles.input}
                multiline
                numberOfLines={2}
              />
            </View>
          </ScrollView>

          {/* Bottom Bar: Qty + Add Button */}
          <View style={styles.footer}>
            <View style={styles.qtyContainer}>
              <TouchableOpacity
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity((q) => q + 1)}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={handleConfirm} style={styles.addCta}>
              <Text style={styles.addCtaText}>Add to Cart • ₦{grandTotal.toLocaleString()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 180,
    backgroundColor: COLORS.surfaceLight,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 24,
  },
  headerInfo: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingBottom: 14,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  prepTime: {
    fontSize: 12,
    color: COLORS.accentGreen,
    fontWeight: "700",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  addonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  addonRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  addonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
  },
  addonName: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: "600",
  },
  addonPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    color: COLORS.white,
    padding: 12,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
    minWidth: 18,
    textAlign: "center",
  },
  addCta: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addCtaText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000",
  },
})
