import React from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native"
import { COLORS } from "../constants/theme"

interface HeaderProps {
  currentAddress: string
  onAddressPress: () => void
  searchQuery: string
  onSearchChange: (text: string) => void
  cartCount: number
  onCartPress: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentAddress,
  onAddressPress,
  searchQuery,
  onSearchChange,
  cartCount,
  onCartPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Bar: Location & Cart */}
      <View style={styles.topRow}>
        <TouchableOpacity activeOpacity={0.8} onPress={onAddressPress} style={styles.locationContainer}>
          <Text style={styles.locationLabel}>DELIVER TO</Text>
          <View style={styles.locationPill}>
            <Text style={styles.locationText} numberOfLines={1}>
              📍 {currentAddress}
            </Text>
            <Text style={styles.locationArrow}>▾</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.topRightActions}>
          {/* Estimated Time Badge */}
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>⚡ 25-35m</Text>
          </View>

          {/* Cart Icon / Badge */}
          <TouchableOpacity activeOpacity={0.8} onPress={onCartPress} style={styles.cartBtn}>
            <Text style={styles.cartIcon}>🛍</Text>
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="Search Jollof rice, Pepper soup, Catfish..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={onSearchChange}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange("")}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  locationContainer: {
    flex: 1,
    marginRight: 12,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
    maxWidth: 200,
  },
  locationArrow: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 4,
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeBadge: {
    backgroundColor: COLORS.accentGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  timeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accentGreen,
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    position: "relative",
  },
  cartIcon: {
    fontSize: 18,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#000",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    padding: 0,
  },
  clearIcon: {
    fontSize: 12,
    color: COLORS.textMuted,
    paddingHorizontal: 4,
  },
})
