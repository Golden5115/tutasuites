import React from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native"
import { COLORS } from "../constants/theme"
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
      {/* Brand & Right Actions Row */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.brandTitleRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.brandTitle}>TUTA GRAB & GO</Text>
            <View style={styles.expressBadge}>
              <Text style={styles.expressBadgeText}>EXPRESS</Text>
            </View>
          </View>
          <Text style={styles.brandSubtitle}>Hot fresh meals ready in 5–15 mins</Text>
        </View>

        <View style={styles.topRightActions}>
          {/* User Sign In / Profile Pill */}
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
            activeOpacity={0.8}
            onPress={onCartPress}
            style={styles.cartButton}
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

      {/* Fulfillment Switch: Delivery vs Pickup */}
      <View style={styles.switchContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onFulfillmentChange("DELIVERY")}
          style={[
            styles.switchBtn,
            fulfillmentMode === "DELIVERY" && styles.switchBtnActive,
          ]}
        >
          <Text
            style={[
              styles.switchBtnText,
              fulfillmentMode === "DELIVERY" && styles.switchBtnTextActive,
            ]}
          >
            🛵 Delivery to You
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onFulfillmentChange("PICKUP")}
          style={[
            styles.switchBtn,
            fulfillmentMode === "PICKUP" && styles.switchBtnActive,
          ]}
        >
          <Text
            style={[
              styles.switchBtnText,
              fulfillmentMode === "PICKUP" && styles.switchBtnTextActive,
            ]}
          >
            🛍️ Counter Pickup (Skip Queue)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location / Pickup Notice Bar */}
      {fulfillmentMode === "DELIVERY" ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAddressPress}
          style={styles.locationBar}
        >
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>DELIVERING TO</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {currentAddress}
            </Text>
          </View>
          <Text style={styles.locationChangeBtn}>Change ▾</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.pickupBar}>
          <Text style={styles.pickupIcon}>🏬</Text>
          <View style={styles.pickupInfo}>
            <Text style={styles.pickupLabel}>PICKUP COUNTER</Text>
            <Text style={styles.pickupLocation} numberOfLines={1}>
              Tuta Grab & Go Express Counter · Mowe
            </Text>
          </View>
          <View style={styles.pickupTimeTag}>
            <Text style={styles.pickupTimeText}>⚡ 5-10m</Text>
          </View>
        </View>
      )}

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="Search Jollof, Turkey, Shawarma, Zobo..."
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
    paddingTop: 10,
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
    marginRight: 8,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentGreen,
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  expressBadge: {
    backgroundColor: COLORS.accentOrangeLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: COLORS.accentOrange,
  },
  expressBadgeText: {
    color: COLORS.accentOrange,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  accountBtnLoggedIn: {
    borderColor: COLORS.cardBorderGold,
    backgroundColor: "rgba(212, 175, 55, 0.12)",
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
    fontSize: 16,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
  },
  switchContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: 3,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9,
  },
  switchBtnActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.cardBorderGold,
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  switchBtnTextActive: {
    color: COLORS.primary,
  },
  locationBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.accentGreen,
    letterSpacing: 0.5,
  },
  locationAddress: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "600",
  },
  locationChangeBtn: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "700",
  },
  pickupBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  pickupIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  pickupInfo: {
    flex: 1,
  },
  pickupLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  pickupLocation: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "600",
  },
  pickupTimeTag: {
    backgroundColor: COLORS.accentGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pickupTimeText: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearIcon: {
    color: COLORS.textMuted,
    fontSize: 13,
    paddingHorizontal: 6,
  },
})
