import React from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native"
import { COLORS } from "../constants/theme"
import { UserProfile } from "./AuthModal"

interface ProfileModalProps {
  visible: boolean
  onClose: () => void
  user: UserProfile | null
  onLogout: () => void
  onReorder?: (order: any) => void
  onTrackOrder?: (order: any) => void
  pastOrders?: any[]
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  user,
  onLogout,
  onReorder,
  onTrackOrder,
  pastOrders = [],
}) => {
  if (!user) return null

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Customer Account</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* User Profile Card */}
            <View style={styles.userCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {((user.name || user.email || "TU").trim().slice(0, 2) || "TU").toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name || "Tuta Customer"}</Text>
                {user.phone ? <Text style={styles.userPhone}>📱 {user.phone}</Text> : null}
                {user.email ? <Text style={styles.userEmail}>✉️ {user.email}</Text> : null}
              </View>
            </View>

            {/* Saved Delivery Address */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Default Delivery Address</Text>
              </View>
              <View style={styles.addressBox}>
                <Text style={styles.addressIcon}>📍</Text>
                <Text style={styles.addressText}>{user.address || "Mowe, Assurance CDA Estate"}</Text>
              </View>
            </View>

            {/* Order History */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Order History & Receipts</Text>
                <Text style={styles.orderCountBadge}>{pastOrders.length} orders</Text>
              </View>

              {pastOrders.length === 0 ? (
                <View style={styles.emptyOrders}>
                  <Text style={styles.emptyOrdersIcon}>🥡</Text>
                  <Text style={styles.emptyOrdersTitle}>No past orders yet</Text>
                  <Text style={styles.emptyOrdersSub}>
                    Your completed Grab & Go meals and receipts will appear here.
                  </Text>
                </View>
              ) : (
                <View style={styles.ordersList}>
                  {pastOrders.map((ord, idx) => (
                    <View key={ord.id || idx} style={styles.orderItemCard}>
                      <View style={styles.orderItemHeader}>
                        <Text style={styles.orderTicketId}>
                          {ord.orderNumber || ord.trackingId || ord.id}
                          {ord.pickupToken ? ` (${ord.pickupToken})` : ""}
                        </Text>
                        <View style={styles.statusPill}>
                          <Text style={styles.statusText}>
                            {String(ord.status || "PLACED").replace(/_/g, " ")}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.orderDate}>
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleString() : "Recent"} •{" "}
                        {ord.fulfillmentType === "DELIVERY" ? "Doorstep Delivery" : "Counter Pickup"}
                      </Text>
                      <Text style={styles.orderItemsSummary} numberOfLines={2}>
                        {Array.isArray(ord.items) && ord.items.length > 0
                          ? ord.items
                              .map((i: any) => `${i.quantity || 1}x ${i.itemName || i.name || "Item"}`)
                              .join(", ")
                          : "Custom Plate"}
                      </Text>
                      <View style={styles.orderBottomRow}>
                        <Text style={styles.orderTotal}>₦{Number(ord.totalAmount || 0).toLocaleString()}</Text>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          {onTrackOrder && (
                            <TouchableOpacity
                              style={styles.reorderBtn}
                              onPress={() => {
                                onClose()
                                setTimeout(() => onTrackOrder(ord), 180)
                              }}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.reorderBtnText}>Track</Text>
                            </TouchableOpacity>
                          )}
                          {onReorder && (
                            <TouchableOpacity
                              style={styles.reorderBtn}
                              onPress={() => {
                                onReorder(ord)
                                onClose()
                              }}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.reorderBtnText}>Reorder ↻</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                onLogout()
                onClose()
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutBtnText}>Sign Out from Device</Text>
            </TouchableOpacity>
          </ScrollView>
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
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "82%",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.white,
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
    fontSize: 14,
    fontWeight: "bold",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "900",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  userEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionCard: {
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
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  orderCountBadge: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "800",
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 8,
  },
  addressIcon: {
    fontSize: 14,
  },
  addressText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  emptyOrders: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyOrdersIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyOrdersTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
  },
  emptyOrdersSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
  ordersList: {
    gap: 10,
  },
  orderItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  orderItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  orderTicketId: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  statusPill: {
    backgroundColor: COLORS.accentGreenLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    color: COLORS.accentGreen,
    fontSize: 10,
    fontWeight: "800",
  },
  orderDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  orderItemsSummary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  orderBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 8,
  },
  orderTotal: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.white,
  },
  reorderBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  reorderBtnText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "800",
  },
  logoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 30,
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "800",
  },
})

