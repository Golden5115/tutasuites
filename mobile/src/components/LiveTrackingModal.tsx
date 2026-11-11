import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  SafeAreaView,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { COLORS, SHADOWS } from "../constants/theme"

interface LiveTrackingModalProps {
  visible: boolean
  onClose: () => void
  order: any
}

const DELIVERY_STAGES = [
  { key: "PLACED", title: "Order Confirmed", subtitle: "Tuta Kitchen accepted your order", icon: "✓" },
  { key: "PREPARING", title: "Cooking Fresh", subtitle: "Chef firing wok, grill & packaging", icon: "🍳" },
  { key: "RIDER_PICKED", title: "Dispatched", subtitle: "Picked up from Tuta Suites HQ", icon: "📦" },
  { key: "IN_TRANSIT", title: "Rider En Route", subtitle: "Cruising along Mowe corridor to you", icon: "🏍" },
  { key: "DELIVERED", title: "Delivered", subtitle: "Handed over warm at your doorstep", icon: "🎉" },
]

const PICKUP_STAGES = [
  { key: "PLACED", title: "Order Confirmed", subtitle: "Tuta Kitchen received your order", icon: "✓" },
  { key: "PREPARING", title: "Chef Preparing Meal", subtitle: "Cooking fresh & sealing in thermal pack", icon: "🍳" },
  { key: "READY", title: "Ready for Pickup", subtitle: "Waiting at Tuta Express Counter lobby", icon: "🛍️" },
  { key: "COLLECTED", title: "Collected", subtitle: "Handed to customer • Enjoy your meal!", icon: "🎉" },
]

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  visible,
  onClose,
  order,
}) => {
  if (!order) return null

  const isPickup = (order.fulfillmentMode || order.orderType) === "PICKUP" || order.orderType === "TAKEAWAY"
  const stages = isPickup ? PICKUP_STAGES : DELIVERY_STAGES

  const [currentStageIdx, setCurrentStageIdx] = useState(isPickup ? 1 : 2)
  const [countdownMinutes, setCountdownMinutes] = useState(order.estimatedMinutes || (isPickup ? 8 : 22))

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setCountdownMinutes((prev: number) => Math.max(1, prev - 1))
    }, 60000)
    return () => clearInterval(interval)
  }, [visible])

  const handleCall = (phone: string = "07075733866") => {
    Linking.openURL(`tel:${phone}`)
  }

  const handleWhatsAppRider = () => {
    const text = `Hello Babatunde, regarding my Tuta Grab & Go order #${order.trackingId || order.id}...`
    Linking.openURL(`https://wa.me/2347075733866?text=${encodeURIComponent(text)}`)
  }

  const advanceStage = () => {
    setCurrentStageIdx((prev) => Math.min(stages.length - 1, prev + 1))
  }

  const rewindStage = () => {
    setCurrentStageIdx((prev) => Math.max(0, prev - 1))
  }

  const currentStage = stages[Math.min(currentStageIdx, stages.length - 1)]

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
            <Text style={styles.headerTitle}>Order #{order.trackingId || order.id}</Text>
          </View>

          <View style={styles.liveBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
          {/* PICKUP DIGITAL PASS / COUNTER TOKEN */}
          {isPickup ? (
            <View style={[styles.pickupPassCard, SHADOWS.card]}>
              <View style={styles.passHeader}>
                <View>
                  <Text style={styles.passLabel}>DIGITAL PICKUP PASS</Text>
                  <Text style={styles.passSub}>Show this token at the Express Counter</Text>
                </View>
                <View style={styles.passCrownBadge}>
                  <Text style={styles.passCrownText}>👑 TUTA VIP</Text>
                </View>
              </View>

              <View style={styles.tokenHighlightBox}>
                <Text style={styles.tokenLabel}>TOKEN NUMBER</Text>
                <Text style={styles.tokenNumber}>#{order.trackingId || order.id}</Text>
                <View style={styles.tokenStatusBadge}>
                  <Text style={styles.tokenStatusText}>{currentStage.title.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.pickupEtaRow}>
                <View>
                  <Text style={styles.pickupEtaTitle}>Estimated Counter Ready</Text>
                  <Text style={styles.pickupEtaSub}>Hot from the kitchen</Text>
                </View>
                <Text style={styles.pickupEtaValue}>~{countdownMinutes} mins</Text>
              </View>

              {/* Progress Segments */}
              <View style={styles.progressBar}>
                {stages.map((s, idx) => {
                  const isPassed = idx <= currentStageIdx
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

              {/* Counter Location */}
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
                <Text style={styles.callCounterText}>📞 Call Front Desk / Kitchen (07075733866)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* DELIVERY ETA HERO CARD */
            <View style={[styles.deliveryHeroCard, SHADOWS.card]}>
              <View style={styles.etaHeaderRow}>
                <View>
                  <Text style={styles.etaMicroLabel}>ESTIMATED DELIVERY</Text>
                  <Text style={styles.etaLargeValue}>⚡ {countdownMinutes} mins</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{currentStage.title}</Text>
                </View>
              </View>

              <Text style={styles.etaDeliveringTo} numberOfLines={1}>
                📍 Delivering to: {order.deliveryAddress || "Mowe, Ogun State"}
              </Text>

              {/* Progress Bar */}
              <View style={styles.progressBar}>
                {stages.map((s, idx) => {
                  const isPassed = idx <= currentStageIdx
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

          {/* DELIVERY ROUTE CORRIDOR MAP GRAPHIC (If delivery) */}
          {!isPickup && (
            <View style={[styles.mapCard, SHADOWS.card]}>
              <View style={styles.mapHeaderRow}>
                <Text style={styles.mapTitle}>MOWE HIGHWAY CORRIDOR</Text>
                <Text style={styles.mapDistance}>4.2 km • Express Transit</Text>
              </View>

              <View style={styles.routeCanvas}>
                {/* Kitchen Origin */}
                <View style={styles.routePoint}>
                  <View style={styles.routePointIconBox}>
                    <Text style={styles.routePointEmoji}>🏨</Text>
                  </View>
                  <View>
                    <Text style={styles.routePointTitle}>Tuta Suites Hotel Kitchen</Text>
                    <Text style={styles.routePointSub}>No 3 Assurance CDA, Orimerunmu</Text>
                  </View>
                </View>

                {/* Vertical Corridor Line */}
                <View style={styles.corridorLineContainer}>
                  <View style={styles.corridorTrack} />
                  <View
                    style={[
                      styles.riderPillMarker,
                      { top: `${Math.min(75, 15 + currentStageIdx * 18)}%` as any },
                    ]}
                  >
                    <Text style={styles.riderPillEmoji}>🏍</Text>
                    <View style={styles.riderPillBadge}>
                      <Text style={styles.riderPillText}>Rider Moving</Text>
                    </View>
                  </View>
                </View>

                {/* Customer Destination */}
                <View style={styles.routePoint}>
                  <View style={[styles.routePointIconBox, styles.destIconBox]}>
                    <Text style={styles.routePointEmoji}>📍</Text>
                  </View>
                  <View>
                    <Text style={styles.routePointTitle}>Your Delivery Address</Text>
                    <Text style={styles.routePointSub}>{order.deliveryAddress || "Mowe"}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* RIDER PROFILE CARD (If delivery) */}
          {!isPickup && (
            <View style={[styles.riderCard, SHADOWS.card]}>
              <View style={styles.riderHeader}>
                <View style={styles.riderAvatar}>
                  <Text style={styles.riderAvatarText}>BK</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.riderNameRow}>
                    <Text style={styles.riderName}>Babatunde K.</Text>
                    <View style={styles.riderRatingPill}>
                      <Text style={styles.riderRatingText}>★ 4.9</Text>
                    </View>
                  </View>
                  <Text style={styles.riderVehicle}>Bajaj Boxer 150 • Thermal Hot-Box</Text>
                  <Text style={styles.riderDeliveries}>184 deliveries completed with care</Text>
                </View>
              </View>

              <View style={styles.riderActions}>
                <TouchableOpacity
                  onPress={() => handleCall("07075733866")}
                  style={styles.riderCallBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.riderCallText}>📞 Call Babatunde</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleWhatsAppRider}
                  style={styles.riderWaBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.riderWaText}>💬 WhatsApp Rider</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TIMELINE MILESTONES */}
          <View style={[styles.timelineCard, SHADOWS.card]}>
            <Text style={styles.timelineHeader}>KITCHEN & DISPATCH PROGRESS</Text>
            {stages.map((s, idx) => {
              const isPassed = idx <= currentStageIdx
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

          {/* ORDER ITEMS SUMMARY */}
          <View style={[styles.summaryCard, SHADOWS.card]}>
            <View style={styles.summaryTopRow}>
              <Text style={styles.summaryTitle}>ORDER BREAKDOWN</Text>
              <Text style={styles.summaryFulfillmentTag}>
                {isPickup ? "🛍️ Express Pickup" : "🛵 Corridor Delivery"}
              </Text>
            </View>

            {order.items?.map((item: any, i: number) => (
              <View key={i} style={styles.summaryRow}>
                <Text style={styles.summaryQty}>{item.quantity}x</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.proteins && item.proteins.length > 0 && (
                    <Text style={styles.summaryAddon}>
                      + {item.proteins.map((p: any) => p.name).join(", ")}
                    </Text>
                  )}
                  {item.soup && <Text style={styles.summaryAddon}>+ {item.soup}</Text>}
                </View>
                <Text style={styles.summaryItemPrice}>₦{item.totalPrice?.toLocaleString()}</Text>
              </View>
            ))}

            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total Paid</Text>
              <Text style={styles.summaryTotalValue}>₦{order.totalAmount?.toLocaleString()}</Text>
            </View>
          </View>

          {/* SIMULATION TEST CONTROLS (Easily cycle through stages) */}
          <View style={styles.simCard}>
            <Text style={styles.simTitle}>⚡ Interactive Stage Preview</Text>
            <View style={styles.simButtonRow}>
              <TouchableOpacity
                onPress={rewindStage}
                style={styles.simBtn}
                disabled={currentStageIdx === 0}
              >
                <Text style={styles.simBtnText}>◀ Previous Stage</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={advanceStage}
                style={[styles.simBtn, styles.simBtnGold]}
                disabled={currentStageIdx === stages.length - 1}
              >
                <Text style={[styles.simBtnText, styles.simBtnTextGold]}>Next Stage ▶</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
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
    fontFamily: "monospace",
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
  simCard: {
    backgroundColor: "rgba(230, 198, 101, 0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorderGoldSubtle,
  },
  simTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
  },
  simButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  simBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  simBtnGold: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  simBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.white,
  },
  simBtnTextGold: {
    color: "#000",
  },
})
