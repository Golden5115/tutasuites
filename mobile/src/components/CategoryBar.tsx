import React from "react"
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from "react-native"
import { COLORS } from "../constants/theme"

interface CategoryBarProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
  onCourierPress: () => void
}

const CATEGORIES = [
  { id: "All", label: "🔥 All", icon: "🔥" },
  { id: "Rice", label: "🍱 Rice", icon: "🍱" },
  { id: "Soups", label: "🍲 Soups & Swallow", icon: "🍲" },
  { id: "Pepper Soup", label: "🥣 Pepper Soup", icon: "🥣" },
  { id: "Breakfast", label: "🍳 Breakfast", icon: "🍳" },
  { id: "Drinks", label: "🍹 Drinks", icon: "🍹" },
]

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  onCourierPress,
}) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Special Glow Pill for Tuta Courier (Glovo "Anything" style) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onCourierPress}
          style={[styles.pill, styles.courierPill]}
        >
          <Text style={styles.courierIcon}>📦</Text>
          <Text style={styles.courierText}>Send Package</Text>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
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
    paddingVertical: 10,
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
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  selectedPillText: {
    color: "#000",
    fontWeight: "800",
  },
  courierPill: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.4)",
    gap: 4,
  },
  courierIcon: {
    fontSize: 13,
  },
  courierText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.accentGreen,
  },
  newBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 2,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#000",
  },
})
