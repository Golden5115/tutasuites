import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native"
import { COLORS } from "../constants/theme"

interface CourierTabProps {
  onBookCourier: (courierOrder: any) => void
}

const HUBS = [
  { id: "Mowe", name: "Mowe (Tuta HQ)", base: 1000, time: "20m" },
  { id: "Magboro", name: "Magboro", base: 2200, time: "40m" },
  { id: "Ibafo", name: "Ibafo", base: 1800, time: "30m" },
  { id: "Arepo", name: "Arepo", base: 2500, time: "45m" },
  { id: "OPIC", name: "OPIC / Wawa", base: 3000, time: "50m" },
  { id: "Lotto", name: "Lotto / Asese", base: 1500, time: "25m" },
  { id: "Sagamu", name: "Sagamu Express", base: 4500, time: "65m" },
]

const CATEGORIES = [
  { id: "Document", label: "📄 Document", desc: "Tokens, papers, contracts" },
  { id: "Package", label: "📦 Package", desc: "Merchandise, clothes, items" },
  { id: "Pharmacy", label: "💊 Pharmacy", desc: "Urgent medicine, baby items" },
  { id: "Errand", label: "🛒 Errand", desc: "Shopping, personal runner" },
  { id: "Gifts", label: "🎁 Gifts", desc: "Cakes, surprise hampers" },
]

export const CourierTab: React.FC<CourierTabProps> = ({ onBookCourier }) => {
  const [pickupHub, setPickupHub] = useState("Mowe")
  const [dropoffHub, setDropoffHub] = useState("Magboro")
  const [category, setCategory] = useState("Package")
  const [packageSize, setPackageSize] = useState("Medium")
  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [itemDescription, setItemDescription] = useState("")
  const [instructions, setInstructions] = useState("")

  // Calculate rate
  const destObj = HUBS.find((h) => h.id === dropoffHub) || HUBS[1]
  const sizeMult = packageSize === "Small" ? 0.9 : packageSize === "Large" ? 1.3 : 1.0
  const estimatedFare = Math.round((destObj.base * sizeMult) / 50) * 50

  const handleBook = () => {
    if (!recipientName || !recipientPhone || !recipientAddress || !itemDescription) {
      Alert.alert("Missing Information", "Please fill in recipient name, phone, address, and item description.")
      return
    }

    onBookCourier({
      type: "COURIER",
      pickupHub,
      dropoffHub,
      category,
      packageSize,
      recipientName,
      recipientPhone,
      recipientAddress,
      itemDescription,
      instructions,
      fare: estimatedFare,
      estimatedTime: destObj.time,
    })
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Hero Banner */}
      <View style={styles.banner}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚡ TUTA COURIER</Text>
        </View>
        <Text style={styles.bannerTitle}>Send Anything, Anywhere</Text>
        <Text style={styles.bannerSub}>
          Motorcycle dispatch fleet active across Mowe, Magboro, Ibafo & Beyond.
        </Text>
      </View>

      {/* Origin & Destination Hubs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Route Selection</Text>
        <View style={styles.hubGrid}>
          <View style={styles.hubCol}>
            <Text style={styles.hubLabel}>📍 Pickup Hub</Text>
            {HUBS.slice(0, 4).map((h) => (
              <TouchableOpacity
                key={`p-${h.id}`}
                activeOpacity={0.8}
                onPress={() => setPickupHub(h.id)}
                style={[styles.hubPill, pickupHub === h.id && styles.hubPillActive]}
              >
                <Text style={[styles.hubText, pickupHub === h.id && styles.hubTextActive]}>
                  {h.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.hubCol}>
            <Text style={styles.hubLabel}>🏁 Drop-off Destination</Text>
            {HUBS.slice(0, 4).map((h) => (
              <TouchableOpacity
                key={`d-${h.id}`}
                activeOpacity={0.8}
                onPress={() => setDropoffHub(h.id)}
                style={[styles.hubPill, dropoffHub === h.id && styles.hubPillActiveGold]}
              >
                <Text style={[styles.hubText, dropoffHub === h.id && styles.hubTextActiveGold]}>
                  {h.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Package Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.id
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[styles.catCard, isSelected && styles.catCardActive]}
              >
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catDesc}>{cat.desc}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Package Size */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Package Size</Text>
        <View style={styles.sizeRow}>
          {["Small (Doc / Bag)", "Medium (Shoebox)", "Large (Multiple items)"].map((s) => {
            const val = s.split(" ")[0]
            const isSelected = packageSize === val
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setPackageSize(val)}
                style={[styles.sizeBtn, isSelected && styles.sizeBtnActive]}
              >
                <Text style={[styles.sizeText, isSelected && styles.sizeTextActive]}>{s}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Recipient Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Recipient Contact & Drop-off</Text>
        <TextInput
          placeholder="Recipient Full Name"
          placeholderTextColor={COLORS.textMuted}
          value={recipientName}
          onChangeText={setRecipientName}
          style={styles.input}
        />
        <TextInput
          placeholder="Recipient Phone Number (e.g. 08012345678)"
          placeholderTextColor={COLORS.textMuted}
          value={recipientPhone}
          onChangeText={setRecipientPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          placeholder="Delivery Street Address & Estate / Landmark"
          placeholderTextColor={COLORS.textMuted}
          value={recipientAddress}
          onChangeText={setRecipientAddress}
          style={styles.input}
        />
        <TextInput
          placeholder="What are you sending? (e.g. Envelope with bank token)"
          placeholderTextColor={COLORS.textMuted}
          value={itemDescription}
          onChangeText={setItemDescription}
          style={styles.input}
        />
        <TextInput
          placeholder="Rider instructions (e.g. Call recipient on arrival at gate)"
          placeholderTextColor={COLORS.textMuted}
          value={instructions}
          onChangeText={setInstructions}
          style={styles.input}
        />
      </View>

      {/* Estimated Fare & Submit CTA */}
      <View style={styles.fareCard}>
        <View style={styles.fareRow}>
          <View>
            <Text style={styles.fareLabel}>ESTIMATED DELIVERY FARE</Text>
            <Text style={styles.fareAmount}>₦{estimatedFare.toLocaleString()}</Text>
          </View>
          <View style={styles.etaBox}>
            <Text style={styles.etaText}>⚡ Est. {destObj.time}</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.85} onPress={handleBook} style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>Book Courier Dispatch</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    marginBottom: 20,
  },
  badge: {
    backgroundColor: COLORS.accentGreen,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#000",
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hubGrid: {
    flexDirection: "row",
    gap: 10,
  },
  hubCol: {
    flex: 1,
    gap: 6,
  },
  hubLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  hubPill: {
    backgroundColor: COLORS.surface,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  hubPillActive: {
    backgroundColor: COLORS.accentGreenLight,
    borderColor: COLORS.accentGreen,
  },
  hubPillActiveGold: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderColor: COLORS.primary,
  },
  hubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  hubTextActive: {
    color: COLORS.accentGreen,
    fontWeight: "800",
  },
  hubTextActiveGold: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  catScroll: {
    gap: 8,
  },
  catCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    minWidth: 130,
  },
  catCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  catLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 2,
  },
  catDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  sizeRow: {
    gap: 8,
  },
  sizeBtn: {
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sizeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
  },
  sizeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  sizeTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    color: COLORS.white,
    padding: 12,
    fontSize: 13,
    marginBottom: 8,
  },
  fareCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: 10,
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  fareLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 2,
  },
  etaBox: {
    backgroundColor: COLORS.accentGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  etaText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.accentGreen,
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
})
