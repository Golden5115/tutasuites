import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native"
import { COLORS } from "../constants/theme"

interface CartModalProps {
  visible: boolean
  onClose: () => void
  cartItems: any[]
  onUpdateQty: (id: string, delta: number) => void
  onCheckout: (orderData: any) => void
  currentAddress: string
}

export const CartModal: React.FC<CartModalProps> = ({
  visible,
  onClose,
  cartItems,
  onUpdateQty,
  onCheckout,
  currentAddress,
}) => {
  const [customerName, setCustomerName] = useState("Guest Customer")
  const [customerPhone, setCustomerPhone] = useState("08012345678")
  const [address, setAddress] = useState(currentAddress)
  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("TRANSFER") // TRANSFER, CARD, COD

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const deliveryFee = 1200
  const serviceFee = 200
  const grandTotal = subtotal + deliveryFee + serviceFee

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return
    if (!customerPhone || !address) {
      alert("Please enter your phone number and delivery address.")
      return
    }

    onCheckout({
      type: "MEAL",
      items: cartItems,
      customerName,
      customerPhone,
      deliveryAddress: address,
      deliveryArea: address.includes("Magboro") ? "Magboro" : address.includes("Ibafo") ? "Ibafo" : "Mowe",
      deliveryNotes: notes,
      paymentMethod,
      subtotal,
      deliveryFee,
      serviceFee,
      totalAmount: grandTotal,
    })
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Your Cart</Text>
              <Text style={styles.headerSub}>Tuta Suites In-House Restaurant</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍽</Text>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptySub}>Add some delicious meals from our kitchen!</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* Delivery ETA Pill */}
              <View style={styles.etaPill}>
                <Text style={styles.etaIcon}>⚡</Text>
                <View>
                  <Text style={styles.etaTitle}>Estimated Delivery Time: 25 - 35 mins</Text>
                  <Text style={styles.etaSub}>Packed hot from Tuta kitchen in thermal box</Text>
                </View>
              </View>

              {/* Items List */}
              <View style={styles.itemsSection}>
                <Text style={styles.sectionHeader}>ORDER ITEMS ({cartItems.length})</Text>
                {cartItems.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.proteins?.length > 0 && (
                        <Text style={styles.itemAddons}>+ {item.proteins.join(", ")}</Text>
                      )}
                      {item.sides?.length > 0 && (
                        <Text style={styles.itemAddons}>+ {item.sides.join(", ")}</Text>
                      )}
                      {item.instructions?.length > 0 && (
                        <Text style={styles.itemNotes}>Note: {item.instructions}</Text>
                      )}
                      <Text style={styles.itemPrice}>₦{item.totalPrice.toLocaleString()}</Text>
                    </View>

                    <View style={styles.qtyControl}>
                      <TouchableOpacity
                        onPress={() => onUpdateQty(item.id, -1)}
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyNum}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => onUpdateQty(item.id, 1)}
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Delivery Details */}
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>DELIVERY DESTINATION</Text>
                <TextInput
                  placeholder="Street Address & Estate / Apartment No"
                  placeholderTextColor={COLORS.textMuted}
                  value={address}
                  onChangeText={setAddress}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Phone Number for Dispatch Rider"
                  placeholderTextColor={COLORS.textMuted}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
                <TextInput
                  placeholder="Gate / Delivery Instructions (e.g. Call on arrival)"
                  placeholderTextColor={COLORS.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  style={styles.input}
                />
              </View>

              {/* Payment Methods */}
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>PAYMENT METHOD</Text>
                <View style={styles.payMethods}>
                  {[
                    { id: "TRANSFER", label: "Bank Transfer", icon: "🏦" },
                    { id: "CARD", label: "Debit Card", icon: "💳" },
                    { id: "COD", label: "Cash on Delivery", icon: "💵" },
                  ].map((p) => {
                    const isSelected = paymentMethod === p.id
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => setPaymentMethod(p.id)}
                        style={[styles.payBtn, isSelected && styles.payBtnActive]}
                      >
                        <Text style={styles.payIcon}>{p.icon}</Text>
                        <Text style={[styles.payLabel, isSelected && styles.payLabelActive]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              {/* Bill Breakdown */}
              <View style={styles.billCard}>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Item Subtotal</Text>
                  <Text style={styles.billValue}>₦{subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  <Text style={styles.billValue}>₦{deliveryFee.toLocaleString()}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Packaging & Service</Text>
                  <Text style={styles.billValue}>₦{serviceFee.toLocaleString()}</Text>
                </View>
                <View style={[styles.billRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>₦{grandTotal.toLocaleString()}</Text>
                </View>
              </View>
            </ScrollView>
          )}

          {cartItems.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity activeOpacity={0.85} onPress={handlePlaceOrder} style={styles.orderBtn}>
                <Text style={styles.orderBtnText}>
                  Place Order • ₦{grandTotal.toLocaleString()}
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.white,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "700",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 20,
  },
  etaPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentGreenLight,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    marginBottom: 16,
    gap: 10,
  },
  etaIcon: {
    fontSize: 20,
  },
  etaTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.accentGreen,
  },
  etaSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 18,
  },
  itemsSection: {
    marginBottom: 18,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 2,
  },
  itemAddons: {
    fontSize: 11,
    color: COLORS.primary,
    marginBottom: 1,
  },
  itemNotes: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: "italic",
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
    marginTop: 2,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 4,
    gap: 6,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  qtyNum: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
    minWidth: 14,
    textAlign: "center",
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    color: COLORS.white,
    padding: 12,
    fontSize: 13,
    marginBottom: 8,
  },
  payMethods: {
    flexDirection: "row",
    gap: 8,
  },
  payBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  payBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
  },
  payIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  payLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  payLabelActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  billCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 8,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  billLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  billValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 8,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    backgroundColor: COLORS.surface,
  },
  orderBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  orderBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
})
