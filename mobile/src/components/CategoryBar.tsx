import React from "react"
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from "react-native"
import { COLORS } from "../constants/theme"

interface CategoryBarProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
  onBuildComboPress: () => void
}

const CATEGORIES = [
  { id: "All", label: "🔥 All Menu" },
  { id: "Rice", label: "🍚 Rice Dishes (₦500)" },
  { id: "Swallow & Soup", label: "🍲 Swallow & Soup" },
  { id: "Proteins", label: "🍗 Proteins" },
  { id: "Sides & Shawarma", label: "🌯 Shawarma & Sides" },
  { id: "Drinks", label: "🥤 Drinks & Zobo" },
  { id: "Extras", label: "📦 Packs & Extras" },
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
        {/* Quick Plate Builder Highlight Pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBuildComboPress}
          style={[styles.pill, styles.comboPill]}
        >
          <Text style={styles.comboIcon}>⚡</Text>
          <Text style={styles.comboText}>Build Your Plate</Text>
          <View style={styles.comboBadge}>
            <Text style={styles.comboBadgeText}>POPULAR</Text>
          </View>
        </TouchableOpacity>

        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              onPress={() => onSelectCategory(cat.id)}
              style={[styles.pill, isSelected && styles.selectedPill]}
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
    paddingVertical: 8,
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
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
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
  },
  selectedPillText: {
    color: "#000",
    fontWeight: "900",
  },
  comboPill: {
    backgroundColor: COLORS.accentOrangeLight,
    borderColor: COLORS.accentOrange,
    gap: 4,
  },
  comboIcon: {
    fontSize: 13,
  },
  comboText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.accentOrange,
  },
  comboBadge: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 2,
  },
  comboBadgeText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "900",
  },
})
