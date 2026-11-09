import React, { useState } from "react"
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Modal,
} from "react-native"
import { COLORS } from "./src/constants/theme"
import { MENU_ITEMS, MenuItem } from "./src/constants/menuData"
import { Header } from "./src/components/Header"
import { CategoryBar } from "./src/components/CategoryBar"
import { MealCard } from "./src/components/MealCard"
import { MealDetailModal } from "./src/components/MealDetailModal"
import { CartModal } from "./src/components/CartModal"
import { CourierTab } from "./src/components/CourierTab"
import { LiveTrackingModal } from "./src/components/LiveTrackingModal"

export default function App() {
  const [activeTab, setActiveTab] = useState<"MEALS" | "COURIER">("MEALS")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentAddress, setCurrentAddress] = useState("Mowe, Assurance CDA Estate")
  const [showAddressPicker, setShowAddressPicker] = useState(false)

  // Cart & Customizer State
  const [cartItems, setCartItems] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)

  // Active Order Tracking State
  const [activeOrder, setActiveOrder] = useState<any>({
    id: "TUTA-ORD-729104",
    trackingId: "TUTA-ORD-729104",
    type: "MEAL",
    items: [
      { name: "Special Jollof Rice & Plantain", quantity: 1, totalPrice: 2500 },
      { name: "Crispy Grilled Turkey", quantity: 1, totalPrice: 6000 },
    ],
    deliveryAddress: "Assurance CDA Estate, Mowe",
    deliveryArea: "Mowe",
    subtotal: 8500,
    deliveryFee: 1200,
    serviceFee: 200,
    totalAmount: 9900,
    estimatedMinutes: 24,
    status: "IN_TRANSIT",
  })
  const [showTrackingModal, setShowTrackingModal] = useState(false)

  // Filtering menu items
  const filteredItems = MENU_ITEMS.filter((item) => {
    const matchesCat = selectedCategory === "All" || item.category === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  // Quick Add handler
  const handleQuickAdd = (item: MenuItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.itemId === item.id)
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.id
            ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
            : i
        )
      }
      return [
        ...prev,
        {
          id: `${item.id}-${Date.now()}`,
          itemId: item.id,
          name: item.name,
          basePrice: item.price,
          unitPrice: item.price,
          quantity: 1,
          totalPrice: item.price,
          image: item.image,
          proteins: [],
          sides: [],
          instructions: "",
        },
      ]
    })
  }

  // Customizer Add
  const handleCustomizedAdd = (customItem: any) => {
    setCartItems((prev) => [...prev, customItem])
  }

  // Update Cart Quantity
  const handleUpdateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta
            if (newQty <= 0) return null
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice,
            }
          }
          return item
        })
        .filter(Boolean)
    )
  }

  // Handle Checkout
  const handleCheckout = (orderData: any) => {
    const trackingId = `TUTA-ORD-${Math.floor(100000 + Math.random() * 900000)}`
    const newOrder = {
      ...orderData,
      id: trackingId,
      trackingId,
      estimatedMinutes: 28,
      status: "PREPARING",
    }
    setActiveOrder(newOrder)
    setCartItems([])
    setShowTrackingModal(true)
  }

  // Handle Courier Booking
  const handleBookCourier = (courierData: any) => {
    const trackingId = `TUTA-DEL-${Math.floor(100000 + Math.random() * 900000)}`
    const newOrder = {
      id: trackingId,
      trackingId,
      type: "COURIER",
      items: [{ name: `${courierData.category}: ${courierData.itemDescription}`, quantity: 1, totalPrice: courierData.fare }],
      deliveryAddress: courierData.recipientAddress,
      deliveryArea: courierData.dropoffHub,
      subtotal: courierData.fare,
      deliveryFee: 0,
      serviceFee: 0,
      totalAmount: courierData.fare,
      estimatedMinutes: 35,
      status: "RIDER_PICKED",
    }
    setActiveOrder(newOrder)
    setShowTrackingModal(true)
  }

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Main Header */}
      <Header
        currentAddress={currentAddress}
        onAddressPress={() => setShowAddressPicker(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={totalCartCount}
        onCartPress={() => setShowCartModal(true)}
      />

      {/* Top Main Mode Switcher: Food vs Courier */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          onPress={() => setActiveTab("MEALS")}
          style={[styles.modeTab, activeTab === "MEALS" && styles.modeTabActive]}
        >
          <Text style={[styles.modeTabText, activeTab === "MEALS" && styles.modeTabTextActive]}>
            🍲 Order Food & Drinks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("COURIER")}
          style={[styles.modeTab, activeTab === "COURIER" && styles.modeTabActive]}
        >
          <Text style={[styles.modeTabText, activeTab === "COURIER" && styles.modeTabTextActive]}>
            📦 Send Package / Courier
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body Content */}
      {activeTab === "MEALS" ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
          {/* Category Horizontal Filter */}
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onCourierPress={() => setActiveTab("COURIER")}
          />

          {/* Promo Hero Banner */}
          <View style={styles.promoBanner}>
            <View style={styles.promoTextWrap}>
              <View style={styles.promoPill}>
                <Text style={styles.promoPillText}>HOT & FRESH</Text>
              </View>
              <Text style={styles.promoTitle}>Tuta Restaurant & Lounge</Text>
              <Text style={styles.promoSub}>
                Piping hot local & continental cuisine delivered to your doorstep in 25–35 mins.
              </Text>
            </View>
            <Text style={styles.promoEmoji}>🥘</Text>
          </View>

          {/* Section Header */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === "All" ? "Popular Meals & Dishes" : `${selectedCategory} Menu`}
            </Text>
            <Text style={styles.sectionCount}>{filteredItems.length} available</Text>
          </View>

          {/* Meals Grid */}
          <View style={styles.mealsGrid}>
            {filteredItems.map((item) => (
              <MealCard
                key={item.id}
                item={item}
                onPress={(selected) => {
                  setSelectedItem(selected)
                  setShowDetailModal(true)
                }}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <CourierTab onBookCourier={handleBookCourier} />
      )}

      {/* Floating Active Order Tracker Pill (Chowdeck Signature) */}
      {activeOrder && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowTrackingModal(true)}
          style={styles.floatingOrderPill}
        >
          <View style={styles.floatingLeft}>
            <View style={styles.riderBikeBadge}>
              <Text style={styles.riderBikeText}>🏍</Text>
            </View>
            <View>
              <Text style={styles.floatingTitle}>
                {activeOrder.type === "MEAL" ? "Tuta Kitchen Order" : "Courier Dispatch"}
              </Text>
              <Text style={styles.floatingEta}>
                ⚡ {activeOrder.status === "DELIVERED" ? "Delivered safely!" : `Arriving in ~${activeOrder.estimatedMinutes || 20}m`}
              </Text>
            </View>
          </View>
          <View style={styles.trackCtaPill}>
            <Text style={styles.trackCtaText}>TRACK ❯</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Modals */}
      <MealDetailModal
        item={selectedItem}
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onAddToCart={handleCustomizedAdd}
      />

      <CartModal
        visible={showCartModal}
        onClose={() => setShowCartModal(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateQty}
        onCheckout={handleCheckout}
        currentAddress={currentAddress}
      />

      <LiveTrackingModal
        visible={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        order={activeOrder}
      />

      {/* Address Switcher Modal */}
      <Modal visible={showAddressPicker} transparent animationType="fade">
        <View style={styles.addressModalBackdrop}>
          <View style={styles.addressModalCard}>
            <Text style={styles.addressModalTitle}>Select Delivery Hub / Town</Text>
            {[
              "Mowe, Assurance CDA Estate",
              "Mowe Bus Stop / Expressway",
              "Magboro Market / Gasline",
              "Ibafo Police Station / Town",
              "Arepo, Journalists Estate",
              "OPIC Plaza / Berger Border",
              "Sagamu Interchange",
            ].map((addr) => (
              <TouchableOpacity
                key={addr}
                onPress={() => {
                  setCurrentAddress(addr)
                  setShowAddressPicker(false)
                }}
                style={[styles.addrRow, currentAddress === addr && styles.addrRowActive]}
              >
                <Text style={styles.addrPin}>📍</Text>
                <Text style={[styles.addrText, currentAddress === addr && styles.addrTextActive]}>
                  {addr}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowAddressPicker(false)}
              style={styles.closeAddrBtn}
            >
              <Text style={styles.closeAddrText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modeTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modeTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  modeTabTextActive: {
    color: "#000",
    fontWeight: "900",
  },
  scrollBody: {
    paddingBottom: 90,
  },
  promoBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  promoTextWrap: {
    flex: 1,
  },
  promoPill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  promoPillText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#000",
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 2,
  },
  promoSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  promoEmoji: {
    fontSize: 42,
    marginLeft: 8,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.white,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  mealsGrid: {
    paddingHorizontal: 16,
  },
  floatingOrderPill: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  riderBikeBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  riderBikeText: {
    fontSize: 18,
  },
  floatingTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
  floatingEta: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accentGreen,
  },
  trackCtaPill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  trackCtaText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000",
  },
  addressModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  addressModalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  addressModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 16,
    textAlign: "center",
  },
  addrRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  addrRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
  },
  addrPin: {
    fontSize: 14,
    marginRight: 8,
  },
  addrText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  addrTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  closeAddrBtn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
  },
  closeAddrText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },
})
