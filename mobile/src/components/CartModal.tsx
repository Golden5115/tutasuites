import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native"
import { COLORS, SHADOWS } from "../constants/theme"
import { ENDPOINTS } from "../constants/config"
import { DeliveryZoneOption, MOWE_DELIVERY_ZONES } from "../constants/menuData"
import { authenticatedFetch } from "../services/authService"

interface CartModalProps {
  visible: boolean
  onClose: () => void
  cartItems: any[]
  onUpdateQty: (id: string, delta: number) => void
  onCheckout: (serverOrder: any) => void
  currentAddress: string
  fulfillmentMode: "DELIVERY" | "PICKUP"
  onFulfillmentChange: (mode: "DELIVERY" | "PICKUP") => void
  deliveryZones?: DeliveryZoneOption[]
  selectedZoneId?: string
  onSelectZoneId?: (zoneId: string) => void
  currentUser?: any | null
  onOpenAuth?: () => void
}

export const CartModal: React.FC<CartModalProps> = ({
  visible,
  onClose,
  cartItems,
  onUpdateQty,
  onCheckout,
  currentAddress,
  fulfillmentMode,
  onFulfillmentChange,
  deliveryZones = MOWE_DELIVERY_ZONES,
  selectedZoneId,
  onSelectZoneId,
  currentUser,
  onOpenAuth,
}) => {
  const [customerName, setCustomerName] = useState(currentUser?.name || "Tuta Customer")
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || "")
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser?.address || currentAddress)
  const [deliveryLandmark, setDeliveryLandmark] = useState("")
  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "POS" | "BANK_TRANSFER">("BANK_TRANSFER")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [localZoneId, setLocalZoneId] = useState(
    selectedZoneId || deliveryZones[0]?.id || "mowe-assurance-cda",
  )
  const attemptIdempotencyKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (selectedZoneId) {
      setLocalZoneId(selectedZoneId)
    } else if (!localZoneId && deliveryZones.length > 0) {
      setLocalZoneId(deliveryZones[0].id)
    }
  }, [selectedZoneId, deliveryZones, localZoneId])

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setCustomerName(currentUser.name)
      if (currentUser.phone) setCustomerPhone(currentUser.phone)
      if (currentUser.address) setDeliveryAddress(currentUser.address)
    }
  }, [currentUser])

  // Reset idempotency key when tray signature changes so edited orders generate a fresh attempt
  useEffect(() => {
    attemptIdempotencyKeyRef.current = null
    setSubmitError("")
  }, [cartItems, fulfillmentMode, localZoneId, paymentMethod])

  const activeZone =
    deliveryZones.find((z) => z.id === localZoneId || z.slug === localZoneId) ||
    deliveryZones[0] ||
    MOWE_DELIVERY_ZONES[0]

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item?.totalPrice || 0), 0)
  const deliveryFee = fulfillmentMode === "DELIVERY" ? Number(activeZone?.deliveryFee ?? 1200) : 0
  const grandTotal = subtotal + deliveryFee

  const handlePlaceOrder = async () => {
    setSubmitError("")
    if (cartItems.length === 0) {
      Alert.alert("Tray is Empty", "Please add some delicious meals from the menu first.")
      return
    }

    if (!currentUser) {
      Alert.alert(
        "Sign In Required",
        "Please sign in or verify your email account to place a tracked Tuta Grab & Go order.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign In / Register",
            onPress: () => onOpenAuth?.(),
          },
        ],
      )
      return
    }

    if (!customerPhone.trim()) {
      Alert.alert("Missing Phone", "Please enter your phone number so we can notify you.")
      return
    }

    if (fulfillmentMode === "DELIVERY" && deliveryAddress.trim().length < 5) {
      Alert.alert("Missing Delivery Address", "Please enter your complete street address or estate in Mowe.")
      return
    }

    if (!attemptIdempotencyKeyRef.current) {
      const rand = Math.random().toString(36).slice(2, 10)
      attemptIdempotencyKeyRef.current = `mob_${Date.now()}_${rand}`
    }

    const structuredItems = cartItems.map((it) => ({
      itemId: it.itemId || it.id,
      slug: it.slug ?? null,
      name: it.name,
      quantity: Number(it.quantity || 1),
      soup: it.soupRef || (it.soup ? { name: it.soup } : null),
      proteins: Array.isArray(it.proteinRefs)
        ? it.proteinRefs
        : Array.isArray(it.proteins)
          ? it.proteins.map((p: any) => (typeof p === "string" ? { name: p, quantity: 1 } : p))
          : [],
      sides: Array.isArray(it.sideRefs)
        ? it.sideRefs
        : Array.isArray(it.sides)
          ? it.sides.map((s: any) => (typeof s === "string" ? { name: s, quantity: 1 } : s))
          : [],
      drinks: Array.isArray(it.drinkRefs)
        ? it.drinkRefs
        : Array.isArray(it.drinks)
          ? it.drinks.map((d: any) => (typeof d === "string" ? { name: d, quantity: 1 } : d))
          : [],
      includePack: Boolean(it.includePack),
      specialInstructions: it.instructions || undefined,
    }))

    setIsSubmitting(true)
    try {
      const res = await authenticatedFetch(ENDPOINTS.orders, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": attemptIdempotencyKeyRef.current,
        },
        body: JSON.stringify({
          fulfillmentType: fulfillmentMode,
          paymentMethod,
          deliveryZoneId: fulfillmentMode === "DELIVERY" ? activeZone?.id : undefined,
          deliveryZoneSlug: fulfillmentMode === "DELIVERY" ? activeZone?.slug : undefined,
          deliveryZoneName: fulfillmentMode === "DELIVERY" ? activeZone?.name : undefined,
          deliveryAddress:
            fulfillmentMode === "DELIVERY"
              ? deliveryAddress.trim()
              : "Tuta Express Counter (Pickup)",
          deliveryLandmark:
            fulfillmentMode === "DELIVERY" ? deliveryLandmark.trim() : undefined,
          customerNotes: notes.trim() || undefined,
          idempotencyKey: attemptIdempotencyKeyRef.current,
          items: structuredItems,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.order) {
        const msg =
          data?.error ||
          (res.status === 401
            ? "Your session expired. Please sign in again."
            : "Could not submit order. Please review your tray and try again.")
        setSubmitError(msg)
        if (res.status === 401) {
          onOpenAuth?.()
        }
        return
      }

      attemptIdempotencyKeyRef.current = null
      onCheckout(data.order)
      onClose()
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Network error reaching order server. Safe to retry without duplicate charges.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* iOS Sheet Drag Handle */}
          <View style={styles.sheetHandleContainer}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Your Tuta Tray</Text>
              <Text style={styles.subtitle}>
                {cartItems.length} dish{cartItems.length === 1 ? "" : "es"} ready for ordering
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Fulfillment Mode Toggle */}
            <View style={styles.switchBox}>
              <TouchableOpacity
                style={[styles.switchOption, fulfillmentMode === "PICKUP" && styles.switchOptionActive]}
                onPress={() => onFulfillmentChange("PICKUP")}
                activeOpacity={0.8}
              >
                <Text style={[styles.switchText, fulfillmentMode === "PICKUP" && styles.switchTextActive]}>
                  🛍️ Counter Pickup (Free)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.switchOption, fulfillmentMode === "DELIVERY" && styles.switchOptionActive]}
                onPress={() => onFulfillmentChange("DELIVERY")}
                activeOpacity={0.8}
              >
                <Text style={[styles.switchText, fulfillmentMode === "DELIVERY" && styles.switchTextActive]}>
                  🛵 Doorstep Delivery (+₦1,200)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🍽️</Text>
                <Text style={styles.emptyTitle}>Your tray is empty</Text>
                <Text style={styles.emptySubtitle}>
                  Explore our menu to add hot firewood Jollof, crispy turkey, swallow, or chilled zobo.
                </Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {cartItems.map((item) => (
                  <View key={item.id} style={[styles.itemCard, SHADOWS.card]}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name || "Dish"}</Text>
                        <Text style={styles.itemPrice}>₦{Number(item.totalPrice || 0).toLocaleString()}</Text>
                      </View>

                      {/* Quantity Stepper */}
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => onUpdateQty(item.id, -1)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => onUpdateQty(item.id, 1)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Add-ons details */}
                    <View style={styles.addonsList}>
                      {item.soup && (
                        <Text style={styles.addonTag}>🥣 Soup: {item.soup}</Text>
                      )}
                      {item.proteins && item.proteins.length > 0 && (
                        <Text style={styles.addonTag}>🍗 Protein: {item.proteins.join(", ")}</Text>
                      )}
                      {item.sides && item.sides.length > 0 && (
                        <Text style={styles.addonTag}>🍟 Sides: {item.sides.join(", ")}</Text>
                      )}
                      {item.drinks && item.drinks.length > 0 && (
                        <Text style={styles.addonTag}>🥤 Drink: {item.drinks.join(", ")}</Text>
                      )}
                      {item.includePack && (
                        <Text style={styles.addonTag}>🥡 Takeaway pack included</Text>
                      )}
                      {item.instructions ? (
                        <Text style={styles.instructionNote}>Note: "{item.instructions}"</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Customer Details Section */}
            {cartItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeader}>Customer & Contact</Text>
                  {currentUser ? (
                    <View style={styles.userBadge}>
                      <Text style={styles.userBadgeText}>✓ Logged In</Text>
                    </View>
                  ) : onOpenAuth ? (
                    <TouchableOpacity onPress={onOpenAuth} activeOpacity={0.8}>
                      <Text style={styles.loginHintLink}>Have account? Sign In ❯</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Your Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Enter your name"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number (For WhatsApp / SMS alert)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    placeholder="080 1234 5678"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>

                {fulfillmentMode === "DELIVERY" && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Mowe Corridor Delivery Zone</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          {deliveryZones.map((zone) => {
                            const selected = activeZone?.id === zone.id
                            return (
                              <TouchableOpacity
                                key={zone.id}
                                onPress={() => {
                                  setLocalZoneId(zone.id)
                                  onSelectZoneId?.(zone.id)
                                }}
                                style={[
                                  styles.zoneChip,
                                  selected && styles.zoneChipActive,
                                ]}
                                activeOpacity={0.8}
                              >
                                <Text style={[styles.zoneChipName, selected && styles.zoneChipTextActive]}>
                                  {zone.name}
                                </Text>
                                <Text style={[styles.zoneChipFee, selected && styles.zoneChipTextActive]}>
                                  ₦{Number(zone.deliveryFee).toLocaleString()} • {zone.etaMinMinutes}-{zone.etaMaxMinutes}m
                                </Text>
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                      </ScrollView>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Delivery Street Address / Estate</Text>
                      <TextInput
                        style={styles.textInput}
                        value={deliveryAddress}
                        onChangeText={setDeliveryAddress}
                        placeholder="e.g. Plot 12, Assurance CDA Estate, Mowe"
                        placeholderTextColor={COLORS.textMuted}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Nearest Landmark (Optional)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={deliveryLandmark}
                        onChangeText={setDeliveryLandmark}
                        placeholder="e.g. Beside Redemption Camp Gate / Supermarket"
                        placeholderTextColor={COLORS.textMuted}
                      />
                    </View>
                  </>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Order Note (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Any special packing instructions..."
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            )}

            {/* Payment Method */}
            {cartItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Payment Option</Text>
                <TouchableOpacity
                  style={[styles.paymentRow, paymentMethod === "BANK_TRANSFER" && styles.paymentRowActive]}
                  onPress={() => setPaymentMethod("BANK_TRANSFER")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.radio, paymentMethod === "BANK_TRANSFER" && styles.radioActive]}>
                    {paymentMethod === "BANK_TRANSFER" && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>Instant Bank Transfer</Text>
                    <Text style={styles.paymentSubtitle}>
                      Verified by Tuta cashier before kitchen begins cooking
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paymentRow, paymentMethod === "CASH" && styles.paymentRowActive]}
                  onPress={() => setPaymentMethod("CASH")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.radio, paymentMethod === "CASH" && styles.radioActive]}>
                    {paymentMethod === "CASH" && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>
                      {fulfillmentMode === "PICKUP" ? "Pay Cash at Counter" : "Pay Cash on Delivery"}
                    </Text>
                    <Text style={styles.paymentSubtitle}>Sent immediately to kitchen queue; pay on collection</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paymentRow, paymentMethod === "POS" && styles.paymentRowActive]}
                  onPress={() => setPaymentMethod("POS")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.radio, paymentMethod === "POS" && styles.radioActive]}>
                    {paymentMethod === "POS" && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>
                      {fulfillmentMode === "PICKUP" ? "Pay with POS Card at Counter" : "Pay with Rider POS on Delivery"}
                    </Text>
                    <Text style={styles.paymentSubtitle}>Tap debit/ATM card at handover</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {submitError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{submitError}</Text>
              </View>
            ) : null}

            {/* Order Summary Breakdown */}
            {cartItems.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Bill Breakdown</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Meals & Addons Subtotal</Text>
                  <Text style={styles.summaryVal}>₦{subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {fulfillmentMode === "PICKUP" ? "Counter Pickup" : "Express Dispatch Rider"}
                  </Text>
                  <Text style={[styles.summaryVal, fulfillmentMode === "PICKUP" && styles.freeText]}>
                    {fulfillmentMode === "PICKUP" ? "FREE" : `₦${deliveryFee.toLocaleString()}`}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                  <Text style={styles.totalLabel}>TOTAL TO PAY</Text>
                  <Text style={styles.totalVal}>₦{grandTotal.toLocaleString()}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          {cartItems.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.checkoutBtn, isSubmitting && styles.checkoutBtnDisabled, SHADOWS.card]}
                onPress={handlePlaceOrder}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Text style={styles.checkoutBtnText}>
                  {isSubmitting
                    ? "Placing Order..."
                    : `Confirm & Order • ₦${grandTotal.toLocaleString()}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  zoneChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  zoneChipActive: {
    backgroundColor: COLORS.goldGlow,
    borderColor: COLORS.primary,
  },
  zoneChipName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  zoneChipFee: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  zoneChipTextActive: {
    color: COLORS.primary,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  errorBannerText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "90%",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: "hidden",
  },
  sheetHandleContainer: {
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  closeBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  switchBox: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceLight,
    padding: 3,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  switchOption: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 10,
  },
  switchOptionActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.cardBorderGold,
  },
  switchText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  switchTextActive: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 260,
  },
  itemsList: {
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.white,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },
  stepperValue: {
    paddingHorizontal: 10,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  addonsList: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: 3,
  },
  addonTag: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  instructionNote: {
    fontSize: 11,
    color: COLORS.accentOrange,
    fontStyle: "italic",
    marginTop: 3,
  },
  section: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  userBadge: {
    backgroundColor: COLORS.accentGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 194, 116, 0.3)",
  },
  userBadgeText: {
    fontSize: 10,
    color: COLORS.accentGreen,
    fontWeight: "900",
  },
  loginHintLink: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "800",
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: COLORS.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  paymentRowActive: {
    borderColor: COLORS.cardBorderGold,
    backgroundColor: "rgba(230, 198, 101, 0.08)",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioActive: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
  paymentSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  summaryVal: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "700",
  },
  freeText: {
    color: COLORS.accentGreen,
    fontWeight: "900",
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.white,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutBtnDisabled: {
    opacity: 0.6,
  },
  checkoutBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
})
