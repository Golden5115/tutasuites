import React from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native"
import { COLORS, SHADOWS } from "../constants/theme"
import { UserProfile } from "./AuthModal"

interface HeaderProps {
  fulfillmentMode: "DELIVERY" | "PICKUP"
  onFulfillmentChange: (mode: "DELIVERY" | "PICKUP") => void
  currentAddress: string
  onAddressPress: () => void
  searchQuery: string
  onSearchChange: (text: string) => void
  cartCount: number
  onCartPress: () => void
  currentUser: UserProfile | null
  onAccountPress: () => void
}

export const Header: React.FC<HeaderProps> = ({
  fulfillmentMode,
  onFulfillmentChange,
  currentAddress,
  onAddressPress,
  searchQuery,
  onSearchChange,
  cartCount,
  onCartPress,
  currentUser,
  onAccountPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Brand & Actions Row */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.brandTitleRow}>
            <View style={styles.brandLogoBadge}>
              <Text style={styles.brandLogoEmoji}>👑</Text>
            </View>
            <View>
              <View style={styles.brandNameLine}>
                <Text style={styles.brandNameGold}>TUTA </Text>
                <Text style={styles.brandNameWhite}>GRAB & GO</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.statusText}>Open Now • Express Kitchen</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.topRightActions}>
          {/* User Profile / Sign In Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onAccountPress}
            style={[styles.accountBtn, currentUser && styles.accountBtnLoggedIn]}
          >
            <Text style={[styles.accountBtnText, currentUser && styles.accountBtnTextLoggedIn]}>
              {currentUser ? `👤 ${currentUser.name.split(" ")[0]}` : "👤 Sign In"}
            </Text>
          </TouchableOpacity>

          {/* Cart Tray Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onCartPress}
            style={[styles.cartButton, SHADOWS.card]}
          >
            <Text style={styles.cartIcon}>🛍️</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* iOS Segmented Switch: Delivery vs Pickup */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onFulfillmentChange("DELIVERY")}
          style={[
            styles.segmentBtn,
            fulfillmentMode === "DELIVERY" && styles.segmentBtnActive,
          ]}
        >
          <Text
            style={[
              styles.segmentBtnText,
              fulfillmentMode === "DELIVERY" && styles.segmentBtnTextActive,
            ]}
          >
            🛵 Delivery to You
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onFulfillmentChange("PICKUP")}
          style={[
            styles.segmentBtn,
            fulfillmentMode === "PICKUP" && styles.segmentBtnActive,
          ]}
        >
          <Text
            style={[
              styles.segmentBtnText,
              fulfillmentMode === "PICKUP" && styles.segmentBtnTextActive,
            ]}
          >
            🛍️ Counter Pickup
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location / Counter Pickup Info Bar */}
      {fulfillmentMode === "DELIVERY" ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAddressPress}
          style={styles.locationCard}
        >
          <View style={styles.locationPinBg}>
            <Text style={styles.locationPinText}>📍</Text>
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationMicroLabel}>DELIVERING TO</Text>
            <Text style={styles.locationAddressText} numberOfLines={1}>
              {currentAddress}
            </Text>
          </View>
          <View style={styles.changePill}>
            <Text style={styles.changePillText}>Change ▾</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.pickupCard}>
          <View style={styles.pickupIconBg}>
            <Text style={styles.pickupIconText}>🏬</Text>
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.pickupMicroLabel}>EXPRESS COUNTER</Text>
            <Text style={styles.locationAddressText} numberOfLines={1}>
              Tuta Grab & Go Station • Mowe Corridor
            </Text>
          </View>
          <View style={styles.prepTimeTag}>
            <Text style={styles.prepTimeText}>⚡ 5–10m</Text>
          </View>
        </View>
      )}

      {/* Modern Search Input Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="Search Jollof rice, Turkey, Shawarma, Zobo..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={onSearchChange}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  brandContainer: {
    flex: 1,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandLogoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorderGold,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogoEmoji: {
    fontSize: 18,
  },
  brandNameLine: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandNameGold: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  brandNameWhite: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentGreen,
  },
  statusText: {
    fontSize: 10,
    color: COLORS.accentGreen,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  accountBtnLoggedIn: {
    borderColor: COLORS.cardBorderGold,
    backgroundColor: "rgba(230, 198, 101, 0.12)",
  },
  accountBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  accountBtnTextLoggedIn: {
    color: COLORS.primary,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    position: "relative",
  },
  cartIcon: {
    fontSize: 17,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  cartBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
  },
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: 3,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.cardBorderGold,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  segmentBtnTextActive: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  locationPinBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentOrangeLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  locationPinText: {
    fontSize: 14,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationMicroLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.accentOrange,
    letterSpacing: 0.6,
  },
  pickupMicroLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.accentGreen,
    letterSpacing: 0.6,
  },
  locationAddressText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "700",
    marginTop: 1,
  },
  changePill: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  changePillText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "800",
  },
  pickupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  pickupIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentGreenLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  pickupIconText: {
    fontSize: 14,
  },
  prepTimeTag: {
    backgroundColor: COLORS.accentGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 194, 116, 0.3)",
  },
  prepTimeText: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: "900",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "500",
    paddingVertical: 0,
  },
  clearIcon: {
    color: COLORS.textMuted,
    fontSize: 13,
    paddingHorizontal: 6,
  },
})
