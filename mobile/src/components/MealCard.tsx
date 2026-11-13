import React from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native"
import { COLORS, SHADOWS } from "../constants/theme"
import { MenuItem } from "../constants/menuData"

interface MealCardProps {
  item: MenuItem
  onPress: (item: MenuItem) => void
  onQuickAdd: (item: MenuItem) => void
  cartQuantity?: number
}

export const MealCard: React.FC<MealCardProps> = ({
  item,
  onPress,
  onQuickAdd,
  cartQuantity = 0,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(item)}
      style={[styles.card, SHADOWS.card]}
    >
      {/* Top Media Container */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />

        {/* Dark Gradient / Shadow effect */}
        <View style={styles.imageOverlay} />

        {/* Preparation Time Pill */}
        <View style={styles.prepTimeBadge}>
          <Text style={styles.prepTimeText}>⏱ {(item.prepTime || "5 mins").split(" ")[0]}m</Text>
        </View>

        {/* Rating / Popular Tag */}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.ratingText}>4.9</Text>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
        </View>

        <Text style={styles.desc} numberOfLines={2}>
          {item.desc}
        </Text>

        {/* Price & Action Row */}
        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.currencySymbol}>₦</Text>
            <Text style={styles.price}>{Number(item.price || 0).toLocaleString()}</Text>
            <Text style={styles.perPortionText}>/portion</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={(e) => {
              e.stopPropagation()
              onQuickAdd(item)
            }}
            style={[styles.addBtn, cartQuantity > 0 && styles.addBtnActive]}
          >
            <Text style={[styles.addBtnText, cartQuantity > 0 && styles.addBtnTextActive]}>
              {cartQuantity > 0 ? `✓ ${cartQuantity} in Tray` : "+ Add"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 14,
  },
  imageContainer: {
    width: "100%",
    height: 145,
    backgroundColor: COLORS.surfaceLight,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  prepTimeBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  prepTimeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
  },
  ratingBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.75)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(230, 198, 101, 0.4)",
    gap: 3,
  },
  ratingStar: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  ratingText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },
  content: {
    padding: 14,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.2,
    flex: 1,
  },
  desc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 10,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  currencySymbol: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.primary,
  },
  price: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
  perPortionText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginLeft: 2,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnActive: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  addBtnTextActive: {
    color: COLORS.primary,
  },
})
