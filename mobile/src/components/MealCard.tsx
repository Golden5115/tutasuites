import React from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native"
import { COLORS } from "../constants/theme"
import { MenuItem } from "../constants/menuData"

interface MealCardProps {
  item: MenuItem
  onPress: (item: MenuItem) => void
  onQuickAdd: (item: MenuItem) => void
}

export const MealCard: React.FC<MealCardProps> = ({ item, onPress, onQuickAdd }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(item)} style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        <View style={styles.prepTimeBadge}>
          <Text style={styles.prepTimeText}>⏱ {item.prepTime.split(" ")[0]}m</Text>
        </View>
        {item.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>★ Popular</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.desc}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.price}>₦{item.price.toLocaleString()}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation()
              onQuickAdd(item)
            }}
            style={styles.addBtn}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 14,
  },
  imageContainer: {
    width: "100%",
    height: 130,
    backgroundColor: COLORS.surfaceLight,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  prepTimeBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  prepTimeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
  },
  popularBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  popularText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  desc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  addBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
})
