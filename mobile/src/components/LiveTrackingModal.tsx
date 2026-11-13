import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  AppState,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { COLORS, SHADOWS } from "../constants/theme"
import { ENDPOINTS } from "../constants/config"
import { authenticatedFetch } from "../services/authService"

interface LiveTrackingModalProps {
  visible: boolean
  onClose: () => void
  order: any
  onOrderUpdated?: (updatedOrder: any) => void
}

const DELIVERY_STAGES = [
  { key: "PLACED", title: "Order Confirmed", subtitle: "Received in Tuta Kitchen queue", icon: "✓" },
  { key: "ACCEPTED", title: "Kitchen Accepted", subtitle: "Chefs confirmed your ticket & ETA", icon: "👨‍🍳" },
  { key: "PREPARING", title: "Cooking Fresh", subtitle: "Preparing & sealing your plate", icon: "🍳" },
  { key: "READY", title: "Packed & Ready", subtitle: "Waiting at dispatch counter for rider", icon: "📦" },
  { key: "OUT_FOR_DELIVERY", title: "Out for Delivery", subtitle: "Assigned rider heading along Mowe corridor", icon: "🏍" },
  { key: "COMPLETED", title: "Delivered", subtitle: "Handed over warm at your doorstep", icon: "🎉" },
]

const PICKUP_STAGES = [
  { key: "PLACED", title: "Order Confirmed", subtitle: "Received in Tuta Kitchen queue", icon: "✓" },
  { key: "ACCEPTED", title: "Kitchen Accepted", subtitle: "Chefs confirmed your pickup order", icon: "👨‍🍳" },
  { key: "PREPARING", title: "Chef Preparing Meal", subtitle: "Cooking fresh & sealing thermal pack", icon: "🍳" },
  { key: "READY", title: "Ready for Counter Pickup", subtitle: "Show your #TGG pickup code at counter", icon: "🛍️" },
  { key: "COMPLETED", title: "Collected", subtitle: "Handed to customer • Enjoy your meal!", icon: "🎉" },
]

const TERMINAL_STATUSES = new Set(["COMPLETED", "REJECTED", "CANCELLED", "REFUNDED"])

function mapStatusToStageIndex(status: string, isPickup: boolean): number {
  const s = (status || "").toUpperCase()
  if (s === "PENDING_PAYMENT" || s === "PAYMENT_REVIEW" || s === "PLACED") return 0
  if (s === "ACCEPTED") return 1
  if (s === "PREPARING") return 2
  if (s === "READY") return 3
  if (s === "OUT_FOR_DELIVERY") return isPickup ? 3 : 4
  if (s === "COMPLETED") return isPickup ? 4 : 5
  return -1
}

function formatRealEtaLabel(order: any, isPickup: boolean): string {
  const s = (order?.status || "").toUpperCase()
  if (s === "COMPLETED") return isPickup ? "Collected" : "Delivered"
  if (s === "REJECTED") return "Rejected"
  if (s === "CANCELLED") return "Cancelled"
  if (s === "REFUND_PENDING" || s === "REFUNDED") return "Refund"
  if (s === "PAYMENT_REVIEW") return "Awaiting Payment Review"
  if (s === "PENDING_PAYMENT") return "Awaiting Payment"

  const targetIso = isPickup ? order?.estimatedReadyAt : order?.estimatedDeliveryAt || order?.estimatedReadyAt
  if (targetIso) {
    const mins = Math.max(1, Math.round((new Date(targetIso).getTime() - Date.now()) / 60000))
    return `~${mins} mins`
  }
  if (order?.estimatedPrepMinutes) {
    return `~${order.estimatedPrepMinutes} mins`
  }
  return "Awaiting Kitchen ETA"
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  visible,
  onClose,
  order,
  onOrderUpdated,
}) => {
  const [liveOrder, setLiveOrder] = useState<any>(order)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const inFlightRef = useRef(false)

  useEffect(() => {
    setLiveOrder(order)
  }, [order])

  const pollServer = useCallback(async () => {
    const target = liveOrder || order
    if (!visible || !target) return
    const currentStatus = String(target.status || "").toUpperCase()
    if (TERMINAL_STATUSES.has(currentStatus)) return
    if (inFlightRef.current) return

    const lookupId = target.id || target.orderNumber || target.trackingId
    if (!lookupId && !target.trackingToken) return

    inFlightRef.current = true
    setIsPolling(true)
    try {
      const url = lookupId
        ? ENDPOINTS.orderById(lookupId)
        : ENDPOINTS.orderByTrackingToken(target.trackingToken)
      const res = await authenticatedFetch(url)
      if (res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.order) {
          setLiveOrder(data.order)
          onOrderUpdated?.(data.order)
        }
      }
    } catch {
      // Transient connectivity issue — keeps current verified server snapshot
    } finally {
      inFlightRef.current = false
      setIsPolling(false)
    }
  }, [visible, liveOrder, order, onOrderUpdated])

  // Real-time guarded backend polling (stops on terminal states)
  useEffect(() => {
    if (!visible || !liveOrder) return
    const status = String(liveOrder.status || "").toUpperCase()
    if (TERMINAL_STATUSES.has(status)) return

    void pollServer()
    const interval = setInterval(() => {
      void pollServer()
    }, 8000)
    return () => clearInterval(interval)
  }, [visible, liveOrder?.id, liveOrder?.status, pollServer])

  // Refresh immediately when app returns to foreground
  useEffect(() => {
    if (!visible) return
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void pollServer()
      }
    })
    return () => sub.remove()
  }, [visible, pollServer])

  if (!liveOrder) return null

  const activeData = liveOrder
  const isPickup =
    activeData.fulfillmentType === "PICKUP" ||
    activeData.fulfillmentMode === "PICKUP" ||
    activeData.orderType === "TAKEAWAY"
  const stages = isPickup ? PICKUP_STAGES : DELIVERY_STAGES
  const normalizedStatus = String(activeData.status || "PLACED").toUpperCase()
  const currentStageIdx = mapStatusToStageIndex(normalizedStatus, isPickup)
  const isExceptionStatus =
    normalizedStatus === "REJECTED" ||
    normalizedStatus === "CANCELLED" ||
    normalizedStatus === "REFUND_PENDING" ||
    normalizedStatus === "REFUNDED"
  const isCancelableByCustomer =
    normalizedStatus === "PENDING_PAYMENT" ||
    normalizedStatus === "PAYMENT_REVIEW" ||
    normalizedStatus === "PLACED"
  const etaLabel = formatRealEtaLabel(activeData, isPickup)
  const assignment = activeData.assignment || null
  const displayOrderNumber = activeData.orderNumber || activeData.trackingId || activeData.id

  const handleCall = (phone: string = "07075733866") => {
    Linking.openURL(`tel:${phone}`)
  }

  const handleWhatsAppRider = (phone: string, riderName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "")
    const intlPhone = cleanPhone.startsWith("0") ? `234${cleanPhone.slice(1)}` : cleanPhone
    const text = `Hello ${riderName}, regarding my Tuta Grab & Go order ${displayOrderNumber}...`
    Linking.openURL(`https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`)
  }

  const handleRequestCancel = () => {
    Alert.alert(
      "Cancel Order?",
      `Are you sure you want to cancel order ${displayOrderNumber}? This cannot be undone.`,
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: async () => {
            setIsCancelling(true)
            try {
              const targetId = activeData.id || displayOrderNumber
              const res = await authenticatedFetch(ENDPOINTS.orderCancel(targetId), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "Cancelled by customer via mobile app" }),
              })
              const data = await res.json().catch(() => ({}))
              if (!res.ok || !data?.order) {
                Alert.alert(
                  "Cannot Cancel Order",
                  data?.error || "Kitchen has already started preparing your meal.",
                )
                return
              }
              setLiveOrder(data.order)
              onOrderUpdated?.(data.order)
            } catch {
              Alert.alert("Network Error", "Could not reach server to cancel order.")
            } finally {
              setIsCancelling(false)
            }
          },
        },
      ],
    )
  }

  const currentStage =
    currentStageIdx >= 0 ? stages[Math.min(currentStageIdx, stages.length - 1)] : null

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>
              {isPickup ? "EXPRESS COUNTER PICKUP" : "EXPRESS DELIVERY"}
            </Text>
            <Text style={styles.headerTitle}>Order {displayOrderNumber}</Text>
          </View>

          <TouchableOpacity
            onPress={() => void pollServer()}
            style={styles.liveBadge}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.livePulseDot,
                TERMINAL_STATUSES.has(normalizedStatus) && { backgroundColor: COLORS.textMuted },
              ]}
            />
            <Text style={styles.liveBadgeText}>{isPolling ? "SYNC..." : "LIVE"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
          {/* PAYMENT REVIEW / PENDING PAYMENT / REJECTION / CANCELLATION NOTICE */}
          {(normalizedStatus === "PAYMENT_REVIEW" ||
            normalizedStatus === "PENDING_PAYMENT" ||
            isExceptionStatus) && (
            <View style={[styles.exceptionCard, isExceptionStatus && styles.exceptionCardAlert]}>
              <Text style={styles.exceptionTitle}>
                {normalizedStatus === "PAYMENT_REVIEW"
                  ? "⏳ Verifying Bank Transfer"
                  : normalizedStatus === "PENDING_PAYMENT"
                    ? "💳 Payment Required"
                    : `Order ${normalizedStatus.replace(/_/g, " ")}`}
              </Text>
              <Text style={styles.exceptionBody}>
                {normalizedStatus === "PAYMENT_REVIEW"
                  ? "Our counter cashier is confirming your bank transfer. Kitchen preparation begins immediately upon verification."
                  : normalizedStatus === "PENDING_PAYMENT"
                    ? "Complete your payment so the kitchen can receive your order."
                    : activeData.rejectedReason ||
                      activeData.cancelledReason ||
                      "This order is no longer active."}
              </Text>
            </View>
          )}

          {/* PICKUP DIGITAL PASS / COUNTER TOKEN */}
          {isPickup ? (
            <View style={[styles.pickupPassCard, SHADOWS.card]}>
              <View style={styles.passHeader}>
                <View>
                  <Text style={styles.passLabel}>DIGITAL PICKUP PASS</Text>
                  <Text style={styles.passSub}>Present this daily token at Express Counter</Text>
                </View>
                <View style={styles.passCrownBadge}>
                  <Text style={styles.passCrownText}>
                    {activeData.paymentStatus === "PAID" ? "✓ PAID" : activeData.paymentStatus || "UNPAID"}
                  </Text>
                </View>
              </View>

              <View style={styles.tokenHighlightBox}>
                <Text style={styles.tokenLabel}>COUNTER PICKUP CODE</Text>
                <Text style={styles.tokenNumber}>
                  {activeData.pickupToken || displayOrderNumber}
                </Text>
                <View style={styles.tokenStatusBadge}>
                  <Text style={styles.tokenStatusText}>
                    {currentStage ? currentStage.title.toUpperCase() : normalizedStatus.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>

              <View style={styles.pickupEtaRow}>
                <View>
                  <Text style={styles.pickupEtaTitle}>Kitchen Target Ready</Text>
                  <Text style={styles.pickupEtaSub}>Backed by live kitchen queue</Text>
                </View>
                <Text style={styles.pickupEtaValue}>{etaLabel}</Text>
              </View>

              {/* Progress Segments */}
              <View style={styles.progressBar}>
                {stages.map((s, idx) => {
                  const isPassed = currentStageIdx >= 0 && idx <= currentStageIdx
                  const isCurrent = idx === currentStageIdx
                  return (
                    <View
                      key={s.key}
                      style={[
                        styles.progressSegment,
                        isPassed && styles.progressSegmentPassed,
                        isCurrent && styles.progressSegmentCurrent,
                      ]}
                    />
                  )
                })}
              </View>

              <View style={styles.counterLocationCard}>
                <View style={styles.counterIconBox}>
                  <Text style={styles.counterIcon}>🏨</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.counterName}>Tuta Express Kitchen & Counter</Text>
                  <Text style={styles.counterAddr}>No 3 Assurance CDA, Orimerunmu, Mowe</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleCall("07075733866")}
                style={styles.callCounterBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.callCounterText}>📞 Call Kitchen Counter (07075733866)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* DELIVERY ETA HERO CARD */
            <View style={[styles.deliveryHeroCard, SHADOWS.card]}>
              <View style={styles.etaHeaderRow}>
                <View>
                  <Text style={styles.etaMicroLabel}>ESTIMATED DELIVERY</Text>
                  <Text style={styles.etaLargeValue}>{etaLabel}</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {currentStage ? currentStage.title : normalizedStatus.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>

              <Text style={styles.etaDeliveringTo} numberOfLines={2}>
                📍 {activeData.deliveryZoneName ? `${activeData.deliveryZoneName} — ` : ""}
                {activeData.deliveryAddress || "Mowe, Ogun State"}
              </Text>

              <View style={styles.progressBar}>
                {stages.map((s, idx) => {
                  const isPassed = currentStageIdx >= 0 && idx <= currentStageIdx
                  const isCurrent = idx === currentStageIdx
                  return (
                    <View
                      key={s.key}
                      style={[
                        styles.progressSegment,
                        isPassed && styles.progressSegmentPassed,
                        isCurrent && styles.progressSegmentCurrent,
                      ]}
                    />
                  )
                })}
              </View>
            </View>
          )}

          {/* REAL ASSIGNED RIDER CARD (Or Unassigned Pending Dispatch — Zero Placeholder Rider) */}
          {!isPickup && !isExceptionStatus && (
            assignment ? (
              <View style={[styles.riderCard, SHADOWS.card]}>
                <View style={styles.riderHeader}>
                  <View style={styles.riderAvatar}>
                    <Text style={styles.riderAvatarText}>
                      {String(assignment.riderName || "TR").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.riderNameRow}>
                      <Text style={styles.riderName}>{assignment.riderName}</Text>
                      <View style={styles.riderRatingPill}>
                        <Text style={styles.riderRatingText}>ASSIGNED</Text>
                      </View>
                    </View>
                    <Text style={styles.riderVehicle}>
                      {assignment.vehicleInfo || "Tuta Express Dispatch Bike"}
                    </Text>
                    <Text style={styles.riderDeliveries}>Phone: {assignment.riderPhone}</Text>
                  </View>
                </View>

                <View style={styles.riderActions}>
                  <TouchableOpacity
                    onPress={() => handleCall(assignment.riderPhone)}
                    style={styles.riderCallBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.riderCallText}>📞 Call Rider</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleWhatsAppRider(assignment.riderPhone, assignment.riderName)}
                    style={styles.riderWaBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.riderWaText}>💬 WhatsApp Rider</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.riderCard, SHADOWS.card]}>
                <Text style={styles.riderPendingTitle}>🛵 Rider Assignment Pending</Text>
                <Text style={styles.riderDeliveries}>
                  A verified Tuta Express dispatcher will assign a rider as soon as your meal is packed and ready.
                </Text>
              </View>
            )
          )}

          {/* TIMELINE MILESTONES */}
          {!isExceptionStatus && (
            <View style={[styles.timelineCard, SHADOWS.card]}>
              <Text style={styles.timelineHeader}>LIVE KITCHEN &amp; DISPATCH PROGRESS</Text>
              {stages.map((s, idx) => {
                const isPassed = currentStageIdx >= 0 && idx <= currentStageIdx
                const isCurrent = idx === currentStageIdx
                return (
                  <View key={s.key} style={styles.timelineItem}>
                    <View
                      style={[
                        styles.timelineCircle,
                        isPassed && styles.timelineCirclePassed,
                        isCurrent && styles.timelineCircleCurrent,
                      ]}
                    >
                      <Text style={styles.timelineCircleText}>{s.icon}</Text>
                    </View>
                    <View style={styles.timelineInfo}>
                      <Text
                        style={[
                          styles.timelineStageTitle,
                          isCurrent && styles.timelineStageTitleCurrent,
                        ]}
                      >
                        {s.title}
                      </Text>
                      <Text style={styles.timelineStageSubtitle}>{s.subtitle}</Text>
                    </View>
                    {isPassed && <Text style={styles.timelineCheckmark}>✓</Text>}
                  </View>
                )
              })}
            </View>
          )}

          {/* ORDER ITEMS SUMMARY */}
          <View style={[styles.summaryCard, SHADOWS.card]}>
            <View style={styles.summaryTopRow}>
              <Text style={styles.summaryTitle}>ORDER BREAKDOWN</Text>
              <Text style={styles.summaryFulfillmentTag}>
                {activeData.paymentMethod} • {activeData.paymentStatus || "UNPAID"}
              </Text>
            </View>

            {activeData.items?.map((item: any, i: number) => (
              <View key={item.id || i} style={styles.summaryRow}>
                <Text style={styles.summaryQty}>{item.quantity}x</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryItemName} numberOfLines={1}>
                    {item.itemName || item.name}
                  </Text>
                  {item.addonsSummary ? (
                    <Text style={styles.summaryAddon}>+ {item.addonsSummary}</Text>
                  ) : null}
                </View>
                <Text style={styles.summaryItemPrice}>
                  ₦{Number(item.totalPrice ?? 0).toLocaleString()}
                </Text>
              </View>
            ))}

            {Number(activeData.deliveryFee || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryQty}>🛵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryItemName}>
                    Delivery ({activeData.deliveryZoneName || "Corridor"})
                  </Text>
                </View>
                <Text style={styles.summaryItemPrice}>
                  ₦{Number(activeData.deliveryFee).toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total Amount</Text>
              <Text style={styles.summaryTotalValue}>
                ₦{Number(activeData.totalAmount ?? 0).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* CUSTOMER CANCELLATION BUTTON (Allowed strictly before ACCEPTED/PREPARING) */}
          {isCancelableByCustomer && (
            <TouchableOpacity
              onPress={handleRequestCancel}
              disabled={isCancelling}
              style={styles.cancelOrderBtn}
              activeOpacity={0.85}
            >
              {isCancelling ? (
                <ActivityIndicator color="#FCA5A5" />
              ) : (
                <Text style={styles.cancelOrderBtnText}>✕ Cancel Order Before Prep Starts</Text>
              )}
            </TouchableOpacity>
          )}

          {/* LIVE SYNC BADGE */}
          <View style={[styles.liveSyncCard, SHADOWS.card]}>
            <View style={styles.liveSyncTopRow}>
              <View style={styles.liveSyncDotBox}>
                <View style={styles.liveSyncDot} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.liveSyncTitle}>Authoritative Server Tracking</Text>
                <Text style={styles.liveSyncSubtitle}>
                  Every milestone updates directly from Tuta Kitchen &amp; Dispatch operations.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleCall("07075733866")}
              style={styles.liveSyncHotlineBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.liveSyncHotlineText}>📞 Front Desk & Kitchen: 07075733866</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  exceptionCard: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(230, 198, 101, 0.12)",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  exceptionCardAlert: {
    backgroundColor: "rgba(239, 68, 68, 0.14)",
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  exceptionTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 4,
  },
  exceptionBody: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  riderPendingTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  cancelOrderBtn: {
    marginBottom: 14,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.45)",
  },
  cancelOrderBtnText: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "800",
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  closeBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  closeBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 71, 87, 0.4)",
    gap: 5,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },
  liveBadgeText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  pickupPassCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorderGold,
    marginBottom: 16,
  },
  passHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  passLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  passSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  passCrownBadge: {
    backgroundColor: "rgba(230, 198, 101, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorderGoldSubtle,
  },
  passCrownText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primary,
  },
  tokenHighlightBox: {
    backgroundColor: "rgba(230, 198, 101, 0.08)",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorderGold,
    marginBottom: 16,
  },
  tokenLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  tokenNumber: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 2,
    marginVertical: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  tokenStatusBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  tokenStatusText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 0.5,
  },
  pickupEtaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  pickupEtaTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
  pickupEtaSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  pickupEtaValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.accentGreen,
  },
  progressBar: {
    flexDirection: "row",
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    gap: 4,
    marginBottom: 16,
  },
  progressSegment: {
    flex: 1,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
  },
  progressSegmentPassed: {
    backgroundColor: COLORS.accentGreen,
  },
  progressSegmentCurrent: {
    backgroundColor: COLORS.primary,
  },
  counterLocationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
  },
  counterIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  counterIcon: {
    fontSize: 18,
  },
  counterName: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.white,
  },
  counterAddr: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  callCounterBtn: {
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorderGoldSubtle,
  },
  callCounterText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  deliveryHeroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorderGold,
    marginBottom: 16,
  },
  etaHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  etaMicroLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  etaLargeValue: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.accentGreen,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: "rgba(230, 198, 101, 0.14)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorderGold,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
  },
  etaDeliveringTo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  mapCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  mapHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  mapTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.8,
  },
  mapDistance: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accentGreen,
  },
  routeCanvas: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  routePointIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  destIconBox: {
    borderColor: COLORS.accentGreen,
    backgroundColor: COLORS.accentGreenLight,
  },
  routePointEmoji: {
    fontSize: 17,
  },
  routePointTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.white,
  },
  routePointSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  corridorLineContainer: {
    height: 75,
    marginLeft: 17,
    position: "relative",
  },
  corridorTrack: {
    width: 2,
    height: "100%",
    backgroundColor: COLORS.primary,
    opacity: 0.35,
  },
  riderPillMarker: {
    position: "absolute",
    left: -14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  riderPillEmoji: {
    fontSize: 22,
  },
  riderPillBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  riderPillText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#000",
  },
  riderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  riderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  riderAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  riderAvatarText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000",
  },
  riderNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  riderName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
  },
  riderRatingPill: {
    backgroundColor: "rgba(230, 198, 101, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  riderRatingText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
  },
  riderVehicle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  riderDeliveries: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  riderActions: {
    flexDirection: "row",
    gap: 10,
  },
  riderCallBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  riderCallText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.white,
  },
  riderWaBtn: {
    flex: 1,
    backgroundColor: COLORS.accentGreen,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },
  riderWaText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000",
  },
  timelineCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  timelineHeader: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 14,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  timelineCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  timelineCirclePassed: {
    backgroundColor: COLORS.accentGreen,
    borderColor: COLORS.accentGreen,
  },
  timelineCircleCurrent: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  timelineCircleText: {
    fontSize: 11,
  },
  timelineInfo: {
    flex: 1,
  },
  timelineStageTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  timelineStageTitleCurrent: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  timelineStageSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  timelineCheckmark: {
    color: COLORS.accentGreen,
    fontSize: 13,
    fontWeight: "900",
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  summaryFulfillmentTag: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "800",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorderSubtle,
    gap: 10,
  },
  summaryQty: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    width: 24,
  },
  summaryItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
  summaryAddon: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  liveSyncCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorderGold,
    marginBottom: 16,
  },
  liveSyncTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  liveSyncDotBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accentGreenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  liveSyncDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accentGreen,
  },
  liveSyncTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
  liveSyncSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  liveSyncHotlineBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  liveSyncHotlineText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
})
