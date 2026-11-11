import React from "react"
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from "react-native"
import { COLORS, SHADOWS } from "../constants/theme"

interface CategoryBarProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
  onBuildComboPress: () => void
}

const CATEGORIES = [
  { id: "All", label: "🔥 All Menu" },
  { id: "Rice", label: "🍚 Rice Dishes (₦500)" },
  { id: "Swallow & Soup", label: "🍲 Swallow & Soup" },
  { id: "Proteins", label: "🍗 Proteins & Grills" },
  { id: "Sides & Shawarma", label: "🌯 Shawarma & Sides" },
  { id: "Drinks", label: "🥤 Drinks & Zobo" },
  { id: "Extras", label: "🥡 Packs & Extras" },
]

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  onBuildComboPress,
}) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Quick Plate Builder VIP Pill */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onBuildComboPress}
          style={[styles.pill, styles.comboPill, SHADOWS.card]}
        >
          <Text style={styles.comboIcon}>✨</Text>
          <Text style={styles.comboText}>Build Your Plate</Text>
          <View style={styles.comboBadge}>
            <Text style={styles.comboBadgeText}>VIP</Text>
          </View>
        </TouchableOpacity>

        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              onPress={() => onSelectCategory(cat.id)}
              style={[
                styles.pill,
                isSelected ? [styles.selectedPill, SHADOWS.card] : styles.unselectedPill,
              ]}
            >
              <Text style={[styles.pillText, isSelected && styles.selectedPillText]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 6,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
  },
  unselectedPill: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.cardBorder,
  },
  selectedPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  selectedPillText: {
    color: "#000",
    fontWeight: "900",
  },
  comboPill: {
    backgroundColor: "rgba(255, 159, 28, 0.12)",
    borderColor: COLORS.accentOrange,
    gap: 5,
  },
  comboIcon: {
    fontSize: 13,
  },
  comboText: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.accentOrange,
  },
  comboBadge: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    marginLeft: 2,
  },
  comboBadgeText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
  },
})
