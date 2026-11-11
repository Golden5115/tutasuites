import React, { useState, useEffect } from "react"
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { COLORS } from "./src/constants/theme"
import { MENU_ITEMS, MenuItem } from "./src/constants/menuData"
import { ENDPOINTS } from "./src/constants/config"
import { Header } from "./src/components/Header"
import { CategoryBar } from "./src/components/CategoryBar"
import { MealCard } from "./src/components/MealCard"
import { MealDetailModal } from "./src/components/MealDetailModal"
import { CartModal } from "./src/components/CartModal"
import { LiveTrackingModal } from "./src/components/LiveTrackingModal"
import { AuthModal, UserProfile } from "./src/components/AuthModal"
import { ProfileModal } from "./src/components/ProfileModal"

export default function App() {
  const [fulfillmentMode, setFulfillmentMode] = useState<"DELIVERY" | "PICKUP">("PICKUP")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentAddress, setCurrentAddress] = useState("Mowe, Assurance CDA Estate")
  const [showAddressPicker, setShowAddressPicker] = useState(false)

  // User Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [pastOrders, setPastOrders] = useState<any[]>([])

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user)
    if (user.address) {
      setCurrentAddress(user.address)
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
  }

  const handleReorder = (pastOrder: any) => {
    if (pastOrder.items && Array.isArray(pastOrder.items)) {
      setCartItems(pastOrder.items)
      setShowCartModal(true)
    }
  }

  // Cart & Customizer State
  const [cartItems, setCartItems] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)

  // Active Order Tracking State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS)
  const [isLoadingMenu, setIsLoadingMenu] = useState(false)

  // Fetch live menu from tutasuites.com
  useEffect(() => {
    let isMounted = true
    const loadLiveMenu = async () => {
      try {
        setIsLoadingMenu(true)
        const res = await fetch(ENDPOINTS.menu)
        if (res.ok) {
          const data = await res.json()
          if (data.items && Array.isArray(data.items) && data.items.length > 0 && isMounted) {
            setMenuItems(data.items)
          }
        }
      } catch (e) {
        // Keeps local fallback menu smoothly if network unavailable
      } finally {
        if (isMounted) setIsLoadingMenu(false)
      }
    }
    loadLiveMenu()
    return () => {
      isMounted = false
    }
  }, [])

  const [activeOrder, setActiveOrder] = useState<any>({
    id: "TGG-1048",
    trackingId: "TGG-1048",
    type: "GRAB_AND_GO",
    fulfillmentMode: "PICKUP",
    items: [
      { name: "Smokey Jollof Rice", quantity: 1, totalPrice: 500 },
      { name: "Crispy Grilled Turkey", quantity: 1, totalPrice: 4000 },
      { name: "Chilled Zobo Special", quantity: 1, totalPrice: 1000 },
      { name: "Take Away Pack", quantity: 1, totalPrice: 300 },
    ],
    deliveryAddress: "Tuta Express Counter (Pickup)",
    deliveryArea: "Pickup Counter",
    subtotal: 5800,
    deliveryFee: 0,
    totalAmount: 5800,
    estimatedMinutes: 10,
    status: "PREPARING",
  })
  const [showTrackingModal, setShowTrackingModal] = useState(false)

  // Filtering menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesCat = selectedCategory === "All" || item.category === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  // Quick Add handler (adds single unit)
  const handleQuickAdd = (item: MenuItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.itemId === item.id && !i.proteins?.length && !i.soup)
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id
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
          drinks: [],
          includePack: true,
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
        .filter(Boolean) as any[]
    )
  }

  // Handle Checkout
  const handleCheckout = async (orderData: any) => {
    const trackingCode = `TGG-${Math.floor(1000 + Math.random() * 9000)}`
    const newOrder = {
      ...orderData,
      id: trackingCode,
      trackingId: trackingCode,
      estimatedMinutes: fulfillmentMode === "PICKUP" ? 10 : 25,
      status: "PREPARING",
    }

    // Post to live backend https://tutasuites.com/api/mobile/orders
    try {
      fetch(ENDPOINTS.orders, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "GRAB_AND_GO",
          trackingId: trackingCode,
          orderType: fulfillmentMode === "PICKUP" ? "TAKEAWAY" : "DELIVERY",
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          deliveryAddress: orderData.deliveryAddress,
          deliveryArea: orderData.deliveryArea,
          items: orderData.items,
          subtotal: orderData.subtotal,
          deliveryFee: orderData.deliveryFee,
          totalAmount: orderData.totalAmount,
          notes: orderData.notes,
          paymentMethod: orderData.paymentMethod,
        }),
      }).catch((e) => console.warn("Live order sync err:", e))
    } catch (e) {
      console.warn("Could not reach backend:", e)
    }

    setActiveOrder(newOrder)
    setPastOrders((prev) => [newOrder, ...prev])
    setCartItems([])
    setShowTrackingModal(true)
  }

  // Open Plate Builder with first rice dish
  const handleOpenPlateBuilder = () => {
    const jollof = menuItems.find((i) => i.id === "rice-jollof" || i.name.toLowerCase().includes("jollof")) || menuItems[0]
    setSelectedItem(jollof)
    setShowDetailModal(true)
  }

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Main Header with Fulfillment Toggle & Search */}
      <Header
        fulfillmentMode={fulfillmentMode}
        onFulfillmentChange={setFulfillmentMode}
        currentAddress={currentAddress}
        onAddressPress={() => setShowAddressPicker(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={totalCartCount}
        onCartPress={() => setShowCartModal(true)}
        currentUser={currentUser}
        onAccountPress={() => {
          if (currentUser) {
            setShowProfileModal(true)
          } else {
            setShowAuthModal(true)
          }
        }}
      />

      {/* Horizontal Category Bar */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onBuildComboPress={handleOpenPlateBuilder}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* "Build Your Plate" Hero Banner (Sweetgreen / Chipotle style) */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleOpenPlateBuilder}
          style={styles.comboBanner}
        >
          <View style={styles.comboBannerContent}>
            <View style={styles.comboTagRow}>
              <View style={styles.comboTag}>
                <Text style={styles.comboTagText}>⚡ CHEF'S COMBO</Text>
              </View>
              <Text style={styles.comboSpeed}>Ready in 5-10m</Text>
            </View>

            <Text style={styles.comboBannerTitle}>Build Your Custom Plate</Text>
            <Text style={styles.comboBannerSub}>
              Choose Rice (₦500) + Grilled Turkey/Chicken + Dodo + Chilled Zobo in seconds.
            </Text>

            <View style={styles.comboCtaRow}>
              <View style={styles.comboCtaBtn}>
                <Text style={styles.comboCtaBtnText}>Tap to Build Plate ❯</Text>
              </View>
              <Text style={styles.comboPricingHint}>From ₦500/portion</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === "All" ? "Official Tuta Grab & Go Menu" : `${selectedCategory}`}
          </Text>
          <Text style={styles.sectionCountBadge}>{filteredItems.length} items</Text>
        </View>

        {/* Menu Items Grid */}
        <View style={styles.itemsGrid}>
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

      {/* Floating Bottom Tray Checkout Bar */}
      {cartItems.length > 0 && (
        <View style={styles.floatingTrayContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowCartModal(true)}
            style={styles.floatingTrayBar}
          >
            <View style={styles.trayLeft}>
              <View style={styles.trayBadge}>
                <Text style={styles.trayBadgeText}>{totalCartCount}</Text>
              </View>
              <View>
                <Text style={styles.trayTitle}>View Your Tray</Text>
                <Text style={styles.traySubtitle}>
                  {fulfillmentMode === "PICKUP" ? "🛍️ Pickup at Counter" : "🛵 Doorstep Delivery"}
                </Text>
              </View>
            </View>

            <View style={styles.trayRight}>
              <Text style={styles.trayTotal}>₦{cartSubtotal.toLocaleString()}</Text>
              <Text style={styles.trayCheckoutArrow}>Checkout ❯</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Active Order Tracker Pill */}
      {activeOrder && cartItems.length === 0 && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowTrackingModal(true)}
          style={styles.floatingOrderPill}
        >
          <View style={styles.floatingLeft}>
            <View style={styles.orderStatusDot} />
            <View>
              <Text style={styles.floatingTitle}>
                Order #{activeOrder.trackingId || activeOrder.id}
              </Text>
              <Text style={styles.floatingEta}>
                ⚡ {activeOrder.fulfillmentMode === "PICKUP" ? "Ready at Counter in ~" : "Arriving in ~"}
                {activeOrder.estimatedMinutes || 10}m
              </Text>
            </View>
          </View>
          <View style={styles.trackCtaPill}>
            <Text style={styles.trackCtaText}>TRACK ❯</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Customizer Modal */}
      <MealDetailModal
        item={selectedItem}
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onAddToCart={handleCustomizedAdd}
      />

      {/* Cart Tray Modal */}
      <CartModal
        visible={showCartModal}
        onClose={() => setShowCartModal(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateQty}
        onCheckout={handleCheckout}
        currentAddress={currentAddress}
        fulfillmentMode={fulfillmentMode}
        onFulfillmentChange={setFulfillmentMode}
        currentUser={currentUser}
        onOpenAuth={() => {
          setShowCartModal(false)
          setShowAuthModal(true)
        }}
      />

      {/* Live Order Tracking Modal */}
      <LiveTrackingModal
        visible={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        order={activeOrder}
      />

      {/* User Login & Registration Modal */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Customer Account & Order History Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
        onLogout={handleLogout}
        onReorder={handleReorder}
        pastOrders={pastOrders}
      />

      {/* Address Switcher Modal */}
      <Modal visible={showAddressPicker} transparent animationType="fade">
        <View style={styles.addressModalBackdrop}>
          <View style={styles.addressModalCard}>
            <Text style={styles.addressModalTitle}>Select Your Delivery Area</Text>
            {[
              "Mowe, Assurance CDA Estate",
              "Mowe Bus Stop / Expressway",
              "Magboro Market / Gasline",
              "Ibafo Police Station / Town",
              "Arepo, Journalists Estate",
              "OPIC Plaza / Berger Border",
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
  scrollBody: {
    paddingBottom: 110,
  },
  comboBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primaryDark,
    overflow: "hidden",
  },
  comboBannerContent: {
    padding: 16,
    backgroundColor: "rgba(212, 175, 55, 0.05)",
  },
  comboTagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  comboTag: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  comboTagText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  comboSpeed: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: "800",
  },
  comboBannerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 4,
  },
  comboBannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  comboCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  comboCtaBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  comboCtaBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
  },
  comboPricingHint: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "700",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  sectionCountBadge: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "700",
  },
  itemsGrid: {
    paddingHorizontal: 16,
  },
  floatingTrayContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  floatingTrayBar: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  trayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trayBadge: {
    backgroundColor: "#000",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  trayBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  trayTitle: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
  },
  traySubtitle: {
    color: "rgba(0,0,0,0.7)",
    fontSize: 11,
    fontWeight: "700",
  },
  trayRight: {
    alignItems: "flex-end",
  },
  trayTotal: {
    color: "#000",
    fontSize: 15,
    fontWeight: "900",
  },
  trayCheckoutArrow: {
    color: "#000",
    fontSize: 11,
    fontWeight: "800",
  },
  floatingOrderPill: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: COLORS.cardBorderGold,
  },
  floatingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orderStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accentGreen,
  },
  floatingTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  floatingEta: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  trackCtaPill: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  trackCtaText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },
  addressModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  addressModalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  addressModalTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 14,
  },
  addrRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  addrRowActive: {
    backgroundColor: COLORS.surfaceLight,
  },
  addrPin: {
    fontSize: 14,
    marginRight: 10,
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
    paddingVertical: 10,
    alignItems: "center",
  },
  closeAddrText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
})
