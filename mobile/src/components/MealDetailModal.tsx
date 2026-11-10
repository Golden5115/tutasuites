import React, { useState, useEffect } from "react"
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
import {
  MenuItem,
  SOUP_OPTIONS,
  PROTEIN_ADDONS,
  SIDE_ADDONS,
  DRINK_ADDONS,
  PACKAGING_ADDON,
} from "../constants/menuData"

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

  const isSwallow = item.category === "Swallow & Soup"
  const isRice = item.category === "Rice"

  const [quantity, setQuantity] = useState(1)
  const [selectedSoup, setSelectedSoup] = useState<string>(isSwallow ? "soup-egusi" : "")
  const [selectedProteins, setSelectedProteins] = useState<string[]>([])
  const [selectedSides, setSelectedSides] = useState<string[]>([])
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>([])
  const [includeTakeawayPack, setIncludeTakeawayPack] = useState(true)
  const [specialInstructions, setSpecialInstructions] = useState("")

  // Reset states when item changes
  useEffect(() => {
    setQuantity(1)
    setSelectedSoup(item?.category === "Swallow & Soup" ? "soup-egusi" : "")
    setSelectedProteins([])
    setSelectedSides([])
    setSelectedDrinks([])
    setIncludeTakeawayPack(true)
    setSpecialInstructions("")
  }, [item])

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

  const toggleDrink = (id: string) => {
    setSelectedDrinks((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  // Cost calculations
  const proteinCost = selectedProteins.reduce((sum, id) => {
    const p = PROTEIN_ADDONS.find((item) => item.id === id)
    return sum + (p ? p.price : 0)
  }, 0)

  const sideCost = selectedSides.reduce((sum, id) => {
    const s = SIDE_ADDONS.find((item) => item.id === id)
    return sum + (s ? s.price : 0)
  }, 0)

  const drinkCost = selectedDrinks.reduce((sum, id) => {
    const d = DRINK_ADDONS.find((item) => item.id === id)
    return sum + (d ? d.price : 0)
  }, 0)

  const packCost = includeTakeawayPack ? PACKAGING_ADDON.price : 0

  const singlePlateTotal = item.price + proteinCost + sideCost + drinkCost + packCost
  const grandTotal = singlePlateTotal * quantity

  const handleConfirm = () => {
    const soupName = SOUP_OPTIONS.find((s) => s.id === selectedSoup)?.name
    const proteinNames = selectedProteins
      .map((id) => PROTEIN_ADDONS.find((p) => p.id === id)?.name)
      .filter(Boolean) as string[]
    const sideNames = selectedSides
      .map((id) => SIDE_ADDONS.find((s) => s.id === id)?.name)
      .filter(Boolean) as string[]
    const drinkNames = selectedDrinks
      .map((id) => DRINK_ADDONS.find((d) => d.id === id)?.name)
      .filter(Boolean) as string[]

    onAddToCart({
      id: `${item.id}-${Date.now()}`,
      itemId: item.id,
      name: item.name,
      basePrice: item.price,
      unitPrice: singlePlateTotal,
      quantity,
      totalPrice: grandTotal,
      image: item.image,
      soup: soupName,
      proteins: proteinNames,
      sides: sideNames,
      drinks: drinkNames,
      includePack: includeTakeawayPack,
      instructions: specialInstructions,
    })

    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header image & close button */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>⚡ Ready in {item.prepTime}</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Title & Base Price */}
            <View style={styles.titleSection}>
              <View style={styles.titleRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₦{item.price.toLocaleString()}</Text>
              </View>
              <Text style={styles.itemDesc}>{item.desc}</Text>
            </View>

            {/* Soup Choice (If Swallow) */}
            {isSwallow && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>1. Choose Complimentary Soup</Text>
                  <Text style={styles.requiredTag}>REQUIRED</Text>
                </View>
                {SOUP_OPTIONS.map((soup) => {
                  const isSelected = selectedSoup === soup.id
                  return (
                    <TouchableOpacity
                      key={soup.id}
                      style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                      onPress={() => setSelectedSoup(soup.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionLeft}>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.optionName}>{soup.name}</Text>
                      </View>
                      <Text style={styles.freeTag}>Included Free</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {/* Protein Add-ons */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {isSwallow || isRice ? "2. Add Protein to Plate" : "Add Extra Protein"}
                </Text>
                <Text style={styles.optionalTag}>OPTIONAL</Text>
              </View>
              {PROTEIN_ADDONS.map((p) => {
                const isSelected = selectedProteins.includes(p.id)
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => toggleProtein(p.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.optionName}>{p.name}</Text>
                    </View>
                    <Text style={styles.addonPrice}>+₦{p.price.toLocaleString()}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Sides */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Add Sides & Shawarma</Text>
                <Text style={styles.optionalTag}>OPTIONAL</Text>
              </View>
              {SIDE_ADDONS.map((s) => {
                const isSelected = selectedSides.includes(s.id)
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => toggleSide(s.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.optionName}>{s.name}</Text>
                    </View>
                    <Text style={styles.addonPrice}>+₦{s.price.toLocaleString()}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Drinks */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Add Chilled Drink or Zobo</Text>
                <Text style={styles.optionalTag}>OPTIONAL</Text>
              </View>
              {DRINK_ADDONS.map((d) => {
                const isSelected = selectedDrinks.includes(d.id)
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => toggleDrink(d.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.optionName}>{d.name}</Text>
                    </View>
                    <Text style={styles.addonPrice}>+₦{d.price.toLocaleString()}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Takeaway Packaging Option */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.packRow, includeTakeawayPack && styles.packRowSelected]}
                onPress={() => setIncludeTakeawayPack((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.checkbox, includeTakeawayPack && styles.checkboxActive]}>
                    {includeTakeawayPack && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View>
                    <Text style={styles.packTitle}>🥡 Include Take Away Pack</Text>
                    <Text style={styles.packSubtitle}>Hygienic sealed takeaway container</Text>
                  </View>
                </View>
                <Text style={styles.addonPrice}>+₦{PACKAGING_ADDON.price}</Text>
              </TouchableOpacity>
            </View>

            {/* Special Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kitchen Note / Instructions</Text>
              <TextInput
                style={styles.instructionInput}
                placeholder="e.g. Pack pepper sauce separately, extra hot..."
                placeholderTextColor={COLORS.textMuted}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Portion Quantity</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  activeOpacity={0.8}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperCount}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQuantity((prev) => prev + 1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Bar */}
          <View style={styles.footer}>
            <View style={styles.footerPriceCol}>
              <Text style={styles.footerPriceLabel}>TOTAL PRICE</Text>
              <Text style={styles.footerPriceVal}>₦{grandTotal.toLocaleString()}</Text>
            </View>

            <TouchableOpacity style={styles.addTrayBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.addTrayBtnText}>
                Add to Tray • ₦{grandTotal.toLocaleString()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "88%",
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  badgeContainer: {
    position: "absolute",
    bottom: 12,
    left: 14,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: "800",
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  titleSection: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  itemName: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.white,
    flex: 1,
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  itemDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  requiredTag: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.accentOrange,
  },
  optionalTag: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  optionRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
  },
  optionName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
  },
  freeTag: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentGreen,
  },
  addonPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  packRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  packRowSelected: {
    borderColor: COLORS.accentGreen,
    backgroundColor: COLORS.accentGreenLight,
  },
  packTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
  packSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  instructionInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.white,
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: 6,
  },
  quantitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },
  stepperCount: {
    paddingHorizontal: 14,
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerPriceCol: {
    justifyContent: "center",
  },
  footerPriceLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  footerPriceVal: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.white,
  },
  addTrayBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addTrayBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
  },
})
