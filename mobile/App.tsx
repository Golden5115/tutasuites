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
import { COLORS, SHADOWS } from "./src/constants/theme"
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
import {
  authenticatedFetch,
  logoutCustomerSession,
  restoreCustomerSession,
} from "./src/services/authService"

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

  const syncCustomerOrders = async () => {
    try {
      const res = await authenticatedFetch(ENDPOINTS.myOrders)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data?.orders)) {
          setPastOrders(data.orders)
        }
      }
    } catch {
      // Ignore transient offline error during order history fetch
    }
  }

  // Automatic persistent session restoration from Expo SecureStore on startup
  useEffect(() => {
    let isMounted = true
    const bootAuthSession = async () => {
      const restoredUser = await restoreCustomerSession()
      if (isMounted && restoredUser) {
        setCurrentUser(restoredUser)
        if (restoredUser.address) {
          setCurrentAddress(restoredUser.address)
        }
        syncCustomerOrders()
      }
    }
    bootAuthSession()
    return () => {
      isMounted = false
    }
  }, [])

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user)
    if (user.address) {
      setCurrentAddress(user.address)
    }
    syncCustomerOrders()
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setPastOrders([])
    logoutCustomerSession()
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

    // Post to live backend https://tutasuites.com/api/mobile/orders with authenticated session
    try {
      authenticatedFetch(ENDPOINTS.orders, {
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
        {/* "Build Your Royal Plate" Hero Banner (Sweetgreen / Fast-Casual luxury) */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={handleOpenPlateBuilder}
          style={[styles.comboBanner, SHADOWS.card]}
        >
          <View style={styles.comboBannerContent}>
            <View style={styles.comboTagRow}>
              <View style={styles.comboTag}>
                <Text style={styles.comboTagText}>👑 CHEF'S SIGNATURE</Text>
              </View>
              <View style={styles.comboSpeedBadge}>
                <Text style={styles.comboSpeed}>⚡ Ready in 5-10m</Text>
              </View>
            </View>

            <Text style={styles.comboBannerTitle}>Build Your Royal Plate</Text>
            <Text style={styles.comboBannerSub}>
              Custom Jollof or Swallow + Choice of Grilled Turkey, Chicken or Goat Meat + Dodo & Chilled Zobo.
            </Text>

            <View style={styles.comboCtaRow}>
              <View style={styles.comboCtaBtn}>
                <Text style={styles.comboCtaBtnText}>Tap to Customize Plate ❯</Text>
              </View>
              <Text style={styles.comboPricingHint}>From ₦500 / portion</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === "All" ? "Official Tuta Menu" : `${selectedCategory}`}
            </Text>
            <View style={styles.officialBadge}>
              <Text style={styles.officialBadgeText}>VERIFIED PRICES</Text>
            </View>
          </View>
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
            style={[styles.floatingTrayBar, SHADOWS.floating, SHADOWS.goldGlow]}
          >
            <View style={styles.trayLeft}>
              <View style={styles.trayBadge}>
                <Text style={styles.trayBadgeText}>{totalCartCount}</Text>
              </View>
              <View>
                <Text style={styles.trayTitle}>View Your Tray</Text>
                <Text style={styles.traySubtitle}>
                  {fulfillmentMode === "PICKUP" ? "🛍️ Express Counter Pickup" : "🛵 Fast Doorstep Delivery"}
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
          style={[styles.floatingOrderPill, SHADOWS.floating]}
        >
          <View style={styles.floatingLeft}>
            <View style={styles.orderStatusPulseContainer}>
              <View style={styles.orderStatusDot} />
            </View>
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
          <View style={[styles.addressModalCard, SHADOWS.card]}>
            <View style={styles.addressModalHeader}>
              <Text style={styles.addressModalTitle}>Select Delivery Area</Text>
              <Text style={styles.addressModalSub}>Express dispatch along Mowe corridor</Text>
            </View>
            {[
              "Mowe, Assurance CDA Estate",
              "Mowe Bus Stop / Expressway",
              "Magboro Market / Gasline",
              "Ibafo Police Station / Town",
              "Arepo, Journalists Estate",
              "OPIC Plaza / Berger Border",
            ].map((addr) => {
              const isSelected = currentAddress === addr
              return (
                <TouchableOpacity
                  key={addr}
                  onPress={() => {
                    setCurrentAddress(addr)
                    setShowAddressPicker(false)
                  }}
                  style={[styles.addrRow, isSelected && styles.addrRowActive]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addrPin}>📍</Text>
                  <Text style={[styles.addrText, isSelected && styles.addrTextActive]}>
                    {addr}
                  </Text>
                  {isSelected && <Text style={styles.addrCheck}>✓</Text>}
                </TouchableOpacity>
              )
            })}
            <TouchableOpacity
              onPress={() => setShowAddressPicker(false)}
              style={styles.closeAddrBtn}
              activeOpacity={0.8}
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
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorderGold,
    overflow: "hidden",
  },
  comboBannerContent: {
    padding: 18,
    backgroundColor: "rgba(230, 198, 101, 0.05)",
  },
  comboTagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  comboTag: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  comboTagText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  comboSpeedBadge: {
    backgroundColor: COLORS.accentGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 194, 116, 0.3)",
  },
  comboSpeed: {
    color: COLORS.accentGreen,
    fontSize: 11,
    fontWeight: "800",
  },
  comboBannerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  comboBannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  comboCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  comboCtaBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
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
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  officialBadge: {
    backgroundColor: "rgba(230, 198, 101, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorderGoldSubtle,
  },
  officialBadgeText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
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
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trayBadge: {
    backgroundColor: "#000",
    borderRadius: 13,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  trayBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  trayTitle: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
  },
  traySubtitle: {
    color: "rgba(0,0,0,0.65)",
    fontSize: 11,
    fontWeight: "700",
  },
  trayRight: {
    alignItems: "flex-end",
  },
  trayTotal: {
    color: "#000",
    fontSize: 16,
    fontWeight: "900",
  },
  trayCheckoutArrow: {
    color: "#000",
    fontSize: 11,
    fontWeight: "900",
  },
  floatingOrderPill: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: COLORS.cardBorderGold,
  },
  floatingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  orderStatusPulseContainer: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(0, 194, 116, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  orderStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentGreen,
  },
  floatingTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  floatingEta: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
  trackCtaPill: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.cardBorderGoldSubtle,
  },
  trackCtaText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  addressModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  addressModalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 380,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorderGold,
  },
  addressModalHeader: {
    marginBottom: 16,
  },
  addressModalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.white,
  },
  addressModalSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addrRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  addrRowActive: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.cardBorderGoldSubtle,
  },
  addrPin: {
    fontSize: 14,
    marginRight: 10,
  },
  addrText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  addrTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  addrCheck: {
    color: COLORS.accentGreen,
    fontSize: 14,
    fontWeight: "900",
  },
  closeAddrBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeAddrText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
})
