import React, { Component, ErrorInfo, ReactNode, useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  AppState,
} from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { COLORS, SHADOWS } from "./src/constants/theme"
import {
  MENU_ITEMS,
  MenuItem,
  AddonCatalogItem,
  DeliveryZoneOption,
  MOWE_DELIVERY_ZONES,
  SOUP_OPTIONS,
  PROTEIN_ADDONS,
  SIDE_ADDONS,
  DRINK_ADDONS,
  PACKAGING_ADDON,
  mapServerMenuItem,
} from "./src/constants/menuData"
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
  sanitizeCustomerProfile,
} from "./src/services/authService"

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: "" }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "An unexpected rendering error occurred.",
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[TUTA MOBILE ERROR BOUNDARY]", error, info?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorSafeArea}>
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorSub}>{this.state.errorMessage}</Text>
            <TouchableOpacity
              style={styles.errorRetryBtn}
              onPress={() => this.setState({ hasError: false, errorMessage: "" })}
            >
              <Text style={styles.errorRetryText}>Recover App Screen</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )
    }
    return this.props.children
  }
}

const TERMINAL_ORDER_STATUSES = new Set([
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "REFUNDED",
])

function toAddonList(list: unknown, fallback: AddonCatalogItem[]): AddonCatalogItem[] {
  if (!Array.isArray(list) || list.length === 0) return fallback
  return list
    .map((entry: any) => ({
      id: String(entry?.id || entry?.slug || ""),
      slug: typeof entry?.slug === "string" ? entry.slug : null,
      name: String(entry?.name || ""),
      price: Number(entry?.price ?? 0),
    }))
    .filter((a) => a.id && a.name)
}

function AppScreen() {
  const [fulfillmentMode, setFulfillmentMode] = useState<"DELIVERY" | "PICKUP">("PICKUP")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZoneOption[]>(MOWE_DELIVERY_ZONES)
  const [selectedZoneId, setSelectedZoneId] = useState<string>(MOWE_DELIVERY_ZONES[0].id)
  const [currentAddress, setCurrentAddress] = useState("Mowe Assurance CDA")
  const [showAddressPicker, setShowAddressPicker] = useState(false)

  // User Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [pastOrders, setPastOrders] = useState<any[]>([])

  // Cart & Customizer State
  const [cartItems, setCartItems] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)

  // Live Catalog, Addons & Active Order Tracking State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS)
  const [addonCatalog, setAddonCatalog] = useState<{
    soups: AddonCatalogItem[]
    proteins: AddonCatalogItem[]
    sides: AddonCatalogItem[]
    drinks: AddonCatalogItem[]
    takeawayPack: AddonCatalogItem
  }>({
    soups: SOUP_OPTIONS,
    proteins: PROTEIN_ADDONS,
    sides: SIDE_ADDONS,
    drinks: DRINK_ADDONS,
    takeawayPack: PACKAGING_ADDON,
  })
  const [isLoadingMenu, setIsLoadingMenu] = useState(false)
  const [activeOrder, setActiveOrder] = useState<any>(null)
  const [showTrackingModal, setShowTrackingModal] = useState(false)

  const syncCustomerOrders = useCallback(async () => {
    try {
      const res = await authenticatedFetch(ENDPOINTS.myOrders)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data?.orders)) {
          setPastOrders(data.orders)
          setActiveOrder((current: any) => {
            if (current?.id) {
              const refreshed = data.orders.find(
                (o: any) =>
                  o.id === current.id ||
                  (o.orderNumber && o.orderNumber === current.orderNumber),
              )
              if (refreshed) return refreshed
            }
            const firstOpen = data.orders.find(
              (o: any) => !TERMINAL_ORDER_STATUSES.has(String(o?.status || "").toUpperCase()),
            )
            return firstOpen || current
          })
        }
      }
    } catch {
      // Ignore transient offline error during order history fetch
    }
  }, [])

  // Automatic persistent session restoration from Expo SecureStore on startup
  useEffect(() => {
    let isMounted = true
    const bootAuthSession = async () => {
      try {
        const restoredUser = await restoreCustomerSession()
        if (isMounted && restoredUser) {
          const safeUser = sanitizeCustomerProfile(restoredUser)
          setCurrentUser(safeUser)
          if (safeUser.address) {
            setCurrentAddress(safeUser.address)
          }
          syncCustomerOrders()
        }
      } catch {
        // Ignore transient startup storage error
      }
    }
    bootAuthSession()
    return () => {
      isMounted = false
    }
  }, [syncCustomerOrders])

  // Refresh order tracking & history when returning app to foreground
  useEffect(() => {
    if (!currentUser) return
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        syncCustomerOrders()
      }
    })
    return () => sub.remove()
  }, [currentUser, syncCustomerOrders])

  const handleAuthSuccess = (user: UserProfile) => {
    const safeUser = sanitizeCustomerProfile(user)
    setCurrentUser(safeUser)
    if (safeUser.address) {
      setCurrentAddress(safeUser.address)
    }
    syncCustomerOrders()
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setPastOrders([])
    setActiveOrder(null)
    setShowTrackingModal(false)
    logoutCustomerSession()
  }

  const handleReorder = (pastOrder: any) => {
    if (!pastOrder?.items || !Array.isArray(pastOrder.items)) return
    const normalizedItems = pastOrder.items.map((it: any, idx: number) => {
      const qty = Math.max(1, Number(it.quantity || 1))
      const unitPrice = Number(it.unitPrice ?? (Number(it.totalPrice || 0) / qty || 0))
      const name = String(it.name || it.itemName || "Menu Item")
      const resolvedItemId = String(it.itemId || it.id || "")
      const matchedCatalog = menuItems.find(
        (m) => m.id === resolvedItemId || m.name.toLowerCase() === name.toLowerCase(),
      )
      return {
        id: `${resolvedItemId || idx}-reorder-${Date.now()}-${idx}`,
        itemId: matchedCatalog?.id || resolvedItemId,
        slug: matchedCatalog?.slug ?? it.slug ?? null,
        name,
        basePrice: Number(it.basePrice ?? unitPrice),
        unitPrice,
        quantity: qty,
        totalPrice: unitPrice * qty,
        image: it.image || matchedCatalog?.image,
        soup: it.soup || it.selectedSoup || undefined,
        soupRef: it.soupRef || (it.selectedSoup ? { name: it.selectedSoup } : null),
        proteins: Array.isArray(it.proteins)
          ? it.proteins
          : Array.isArray(it.selectedProteins)
            ? it.selectedProteins
            : [],
        proteinRefs: Array.isArray(it.proteinRefs) ? it.proteinRefs : undefined,
        sides: Array.isArray(it.sides)
          ? it.sides
          : Array.isArray(it.selectedSides)
            ? it.selectedSides
            : [],
        sideRefs: Array.isArray(it.sideRefs) ? it.sideRefs : undefined,
        drinks: Array.isArray(it.drinks)
          ? it.drinks
          : Array.isArray(it.selectedDrinks)
            ? it.selectedDrinks
            : [],
        drinkRefs: Array.isArray(it.drinkRefs) ? it.drinkRefs : undefined,
        includePack: Boolean(it.includePack),
        instructions: it.instructions || it.specialInstructions || "",
      }
    })
    setCartItems(normalizedItems)
    // Allow ProfileModal to finish dismissing cleanly before opening CartModal on RN Fabric
    setTimeout(() => setShowCartModal(true), 180)
  }

  // Fetch live menu, addon catalog & Mowe delivery zones from tutasuites.com
  useEffect(() => {
    let isMounted = true
    const loadLiveMenu = async () => {
      try {
        setIsLoadingMenu(true)
        const res = await fetch(ENDPOINTS.menu)
        if (res.ok) {
          const data = await res.json()
          if (data.items && Array.isArray(data.items) && data.items.length > 0 && isMounted) {
            const mapped = data.items
              .filter((raw: any) => raw?.isAvailable !== false)
              .map((raw: any) => mapServerMenuItem(raw))
              .filter((m: MenuItem) => m.itemKind !== "PACK")
            if (mapped.length > 0) {
              setMenuItems(mapped)
            }
          }
          if (Array.isArray(data.deliveryZones) && data.deliveryZones.length > 0 && isMounted) {
            const zones: DeliveryZoneOption[] = data.deliveryZones.map((z: any) => ({
              id: String(z.id),
              slug: String(z.slug || z.id),
              name: String(z.name),
              corridor: z.corridor ? String(z.corridor) : undefined,
              deliveryFee: Number(z.deliveryFee ?? 0),
              etaMinMinutes: z.etaMinMinutes ? Number(z.etaMinMinutes) : undefined,
              etaMaxMinutes: z.etaMaxMinutes ? Number(z.etaMaxMinutes) : undefined,
            }))
            setDeliveryZones(zones)
            setSelectedZoneId((prev) =>
              zones.some((z) => z.id === prev) ? prev : zones[0].id,
            )
          }
          if (data.groups && isMounted) {
            const rawPack = data.groups.takeawayPack
            setAddonCatalog({
              soups: toAddonList(data.groups.soups, SOUP_OPTIONS),
              proteins: toAddonList(data.groups.proteins, PROTEIN_ADDONS),
              sides: toAddonList(data.groups.sides, SIDE_ADDONS),
              drinks: toAddonList(data.groups.drinks, DRINK_ADDONS),
              takeawayPack: rawPack
                ? {
                    id: String(rawPack.id || rawPack.slug || PACKAGING_ADDON.id),
                    slug: rawPack.slug ? String(rawPack.slug) : PACKAGING_ADDON.slug,
                    name: String(rawPack.name || PACKAGING_ADDON.name),
                    price: Number(rawPack.price ?? PACKAGING_ADDON.price),
                  }
                : PACKAGING_ADDON,
            })
          }
        }
      } catch {
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

  // Filtering menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesCat = selectedCategory === "All" || item.category === selectedCategory
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (item.name || "").toLowerCase().includes(q) ||
      (item.desc || "").toLowerCase().includes(q)
    return matchesCat && matchesSearch
  })

  // Quick Add handler (adds single unit with accurate pack pricing for mains)
  const handleQuickAdd = (item: MenuItem) => {
    const isFoodMain =
      (item.category === "Rice" ||
        item.category === "Swallow & Soup" ||
        item.category === "Sides & Shawarma") &&
      item.itemKind !== "SOUP" &&
      item.backendCategory !== "Soup"
    const packPrice = isFoodMain ? Number(addonCatalog.takeawayPack?.price ?? 300) : 0
    const computedUnitPrice = Number(item.price || 0) + packPrice

    setCartItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.itemId === item.id &&
          !i.proteins?.length &&
          !i.sides?.length &&
          !i.drinks?.length &&
          !i.soup &&
          Boolean(i.includePack) === isFoodMain,
      )
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id
            ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
            : i,
        )
      }
      return [
        ...prev,
        {
          id: `${item.id}-${Date.now()}`,
          itemId: item.id,
          slug: item.slug ?? null,
          name: item.name,
          basePrice: item.price,
          unitPrice: computedUnitPrice,
          quantity: 1,
          totalPrice: computedUnitPrice,
          image: item.image,
          soupRef: null,
          proteins: [],
          proteinRefs: [],
          sides: [],
          sideRefs: [],
          drinks: [],
          drinkRefs: [],
          includePack: isFoodMain,
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
        .filter(Boolean) as any[],
    )
  }

  // Receive server-persisted OMS order from CartModal checkout
  const handleCheckout = (serverOrder: any) => {
    if (!serverOrder) return
    setActiveOrder(serverOrder)
    setPastOrders((prev) => [
      serverOrder,
      ...prev.filter(
        (o) =>
          o.id !== serverOrder.id &&
          (!serverOrder.orderNumber || o.orderNumber !== serverOrder.orderNumber),
      ),
    ])
    setCartItems([])
    // Defer tracking modal open so CartModal completes dismissal cleanly on RN Fabric
    setTimeout(() => setShowTrackingModal(true), 200)
  }

  const handleOrderUpdated = useCallback((updatedOrder: any) => {
    if (!updatedOrder) return
    setActiveOrder((current: any) => {
      if (!current) return updatedOrder
      if (
        current.id === updatedOrder.id ||
        (current.orderNumber && current.orderNumber === updatedOrder.orderNumber)
      ) {
        return updatedOrder
      }
      return current
    })
    setPastOrders((prev) => {
      const exists = prev.some(
        (o) =>
          o.id === updatedOrder.id ||
          (updatedOrder.orderNumber && o.orderNumber === updatedOrder.orderNumber),
      )
      if (!exists) return [updatedOrder, ...prev]
      return prev.map((o) =>
        o.id === updatedOrder.id ||
        (updatedOrder.orderNumber && o.orderNumber === updatedOrder.orderNumber)
          ? updatedOrder
          : o,
      )
    })
  }, [])

  // Open Plate Builder with first rice dish
  const handleOpenPlateBuilder = () => {
    const jollof =
      menuItems.find(
        (i) =>
          i.slug === "smokey-jollof-rice" ||
          i.id === "smokey-jollof-rice" ||
          (i.name || "").toLowerCase().includes("jollof"),
      ) || menuItems[0]
    if (!jollof) return
    setSelectedItem(jollof)
    setShowDetailModal(true)
  }

  const totalCartCount = cartItems.reduce((sum, item) => sum + Number(item?.quantity || 0), 0)
  const cartSubtotal = cartItems.reduce((sum, item) => sum + Number(item?.totalPrice || 0), 0)

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
      {activeOrder &&
        !TERMINAL_ORDER_STATUSES.has(String(activeOrder.status || "").toUpperCase()) &&
        cartItems.length === 0 && (
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
                  Order #{activeOrder.orderNumber || activeOrder.trackingId || activeOrder.id}
                </Text>
                <Text style={styles.floatingEta}>
                  ⚡ {String(activeOrder.status || "PLACED").replace(/_/g, " ")}
                  {(activeOrder.fulfillmentType || activeOrder.fulfillmentMode) === "PICKUP" &&
                  activeOrder.pickupToken
                    ? ` · ${activeOrder.pickupToken}`
                    : activeOrder.estimatedMinutes
                      ? ` · ~${activeOrder.estimatedMinutes}m`
                      : ""}
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
        soups={addonCatalog.soups}
        proteins={addonCatalog.proteins}
        sides={addonCatalog.sides}
        drinks={addonCatalog.drinks}
        takeawayPack={addonCatalog.takeawayPack}
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
        deliveryZones={deliveryZones}
        selectedZoneId={selectedZoneId}
        onSelectZoneId={setSelectedZoneId}
        currentUser={currentUser}
        onOpenAuth={() => {
          setShowCartModal(false)
          // Allow CartModal to dismiss before presenting AuthModal on RN Fabric
          setTimeout(() => setShowAuthModal(true), 180)
        }}
      />

      {/* Live Order Tracking Modal */}
      <LiveTrackingModal
        visible={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        order={activeOrder}
        onOrderUpdated={handleOrderUpdated}
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
        onTrackOrder={(ord) => {
          setActiveOrder(ord)
          setShowProfileModal(false)
          setTimeout(() => setShowTrackingModal(true), 180)
        }}
        pastOrders={pastOrders}
      />

      {/* Address Switcher Modal */}
      <Modal visible={showAddressPicker} transparent animationType="fade">
        <View style={styles.addressModalBackdrop}>
          <View style={[styles.addressModalCard, SHADOWS.card]}>
            <View style={styles.addressModalHeader}>
              <Text style={styles.addressModalTitle}>Select Delivery Corridor</Text>
              <Text style={styles.addressModalSub}>Verified Mowe corridor zones & delivery fees</Text>
            </View>
            {deliveryZones.map((zone) => {
              const isSelected = selectedZoneId === zone.id || currentAddress === zone.name
              return (
                <TouchableOpacity
                  key={zone.id}
                  onPress={() => {
                    setSelectedZoneId(zone.id)
                    setCurrentAddress(zone.name)
                    setShowAddressPicker(false)
                  }}
                  style={[styles.addrRow, isSelected && styles.addrRowActive]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addrPin}>📍</Text>
                  <Text style={[styles.addrText, isSelected && styles.addrTextActive]}>
                    {zone.name} (₦{Number(zone.deliveryFee || 0).toLocaleString()})
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

export default function App() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AppScreen />
      </AppErrorBoundary>
    </SafeAreaProvider>
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
  errorSafeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorderGold,
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
  },
  errorRetryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorRetryText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "900",
  },
})
