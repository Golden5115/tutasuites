import React, { useState } from "react"
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
import { COLORS } from "../constants/theme"

interface CartModalProps {
  visible: boolean
  onClose: () => void
  cartItems: any[]
  onUpdateQty: (id: string, delta: number) => void
  onCheckout: (orderData: any) => void
  currentAddress: string
  fulfillmentMode: "DELIVERY" | "PICKUP"
  onFulfillmentChange: (mode: "DELIVERY" | "PICKUP") => void
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
  currentUser,
  onOpenAuth,
}) => {
  const [customerName, setCustomerName] = useState(currentUser?.name || "Guest Customer")
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || "08012345678")
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser?.address || currentAddress)
  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"TRANSFER" | "POS_COUNTER">("TRANSFER")
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setCustomerName(currentUser.name)
      if (currentUser.phone) setCustomerPhone(currentUser.phone)
      if (currentUser.address) setDeliveryAddress(currentUser.address)
    }
  }, [currentUser])

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const deliveryFee = fulfillmentMode === "DELIVERY" ? 1200 : 0
  const grandTotal = subtotal + deliveryFee

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert("Tray is Empty", "Please add some delicious meals from the menu first.")
      return
    }

    if (!customerPhone.trim()) {
      Alert.alert("Missing Phone", "Please enter your phone number so we can notify you when your meal is ready.")
      return
    }

    if (fulfillmentMode === "DELIVERY" && !deliveryAddress.trim()) {
      Alert.alert("Missing Delivery Address", "Please enter your delivery address or estate in Mowe.")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      onCheckout({
        type: "GRAB_AND_GO",
        fulfillmentMode,
        items: cartItems,
        customerName: customerName.trim() || "Guest Customer",
        customerPhone: customerPhone.trim(),
        deliveryAddress: fulfillmentMode === "DELIVERY" ? deliveryAddress : "Tuta Express Counter (Pickup)",
        deliveryArea: fulfillmentMode === "DELIVERY" ? (deliveryAddress.includes("Ibafo") ? "Ibafo" : "Mowe") : "Pickup Counter",
        notes,
        paymentMethod,
        subtotal,
        deliveryFee,
        totalAmount: grandTotal,
      })
      onClose()
    }, 400)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Your Tuta Tray</Text>
              <Text style={styles.subtitle}>
                {cartItems.length} item{cartItems.length === 1 ? "" : "s"} selected
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
                  Explore the menu to add hot Jollof, crispy turkey, swallow, or chilled zobo.
                </Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {cartItems.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>₦{item.totalPrice.toLocaleString()}</Text>
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
                    <Text style={styles.userBadgeText}>✓ Logged in</Text>
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
                  <Text style={styles.inputLabel}>Phone Number (For SMS / WhatsApp alert)</Text>
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
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Delivery Address / Estate</Text>
                    <TextInput
                      style={styles.textInput}
                      value={deliveryAddress}
                      onChangeText={setDeliveryAddress}
                      placeholder="e.g. Flat 3, Assurance CDA Estate, Mowe"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Order Note (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Any special packaging instructions..."
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
                  style={[styles.paymentRow, paymentMethod === "TRANSFER" && styles.paymentRowActive]}
                  onPress={() => setPaymentMethod("TRANSFER")}
                  activeOpacity={0.8}
                >
                  <View style={styles.radio}>
                    {paymentMethod === "TRANSFER" && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>Instant Bank Transfer</Text>
                    <Text style={styles.paymentSubtitle}>Direct transfer to Tuta Grab & Go dedicated account</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paymentRow, paymentMethod === "POS_COUNTER" && styles.paymentRowActive]}
                  onPress={() => setPaymentMethod("POS_COUNTER")}
                  activeOpacity={0.8}
                >
                  <View style={styles.radio}>
                    {paymentMethod === "POS_COUNTER" && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>
                      {fulfillmentMode === "PICKUP" ? "Pay at Counter (POS / Cash)" : "Pay on Delivery (POS / Cash)"}
                    </Text>
                    <Text style={styles.paymentSubtitle}>Pay when collecting meal or upon arrival of rider</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

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
                  <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                  <Text style={styles.totalVal}>₦{grandTotal.toLocaleString()}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          {cartItems.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.checkoutBtn, isSubmitting && styles.checkoutBtnDisabled]}
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.white,
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
    borderRadius: 10,
    marginBottom: 14,
  },
  switchOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
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
    borderRadius: 12,
    padding: 12,
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
    fontWeight: "800",
    color: COLORS.white,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },
  stepperValue: {
    paddingHorizontal: 8,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  addonsList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    gap: 3,
  },
  addonTag: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  instructionNote: {
    fontSize: 11,
    color: COLORS.accentOrange,
    fontStyle: "italic",
    marginTop: 2,
  },
  section: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  userBadgeText: {
    fontSize: 11,
    color: COLORS.accentGreen,
    fontWeight: "800",
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
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  paymentRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  summaryVal: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "700",
  },
  freeText: {
    color: COLORS.accentGreen,
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.white,
  },
  totalVal: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
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
