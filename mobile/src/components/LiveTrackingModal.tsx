import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native"
import { COLORS } from "../constants/theme"

interface LiveTrackingModalProps {
  visible: boolean
  onClose: () => void
  order: any
}

const STAGES = [
  { key: "PLACED", title: "Order Confirmed", subtitle: "Tuta Kitchen received your order", icon: "✓" },
  { key: "PREPARING", title: "Preparing Your Meal", subtitle: "Chef cooking fresh & packing thermal box", icon: "🍳" },
  { key: "RIDER_PICKED", title: "Rider Picked Up", subtitle: "Dispatched from Tuta Suites HQ", icon: "📦" },
  { key: "IN_TRANSIT", title: "Rider on the Way", subtitle: "Heading to your gate on Mowe corridor", icon: "🏍" },
  { key: "DELIVERED", title: "Delivered", subtitle: "Handed over safely with care", icon: "🎉" },
]

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  visible,
  onClose,
  order,
}) => {
  if (!order) return null

  const [currentStageIdx, setCurrentStageIdx] = useState(2) // Defaults to RIDER_PICKED / IN_TRANSIT
  const [countdownMinutes, setCountdownMinutes] = useState(order.estimatedMinutes || 24)

  // Countdown timer simulation
  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setCountdownMinutes((prev: number) => Math.max(1, prev - 1))
    }, 60000)
    return () => clearInterval(interval)
  }, [visible])

  const handleCallRider = () => {
    Linking.openURL("tel:07075733866")
  }

  const handleWhatsAppRider = () => {
    const text = `Hello Babatunde, regarding my Tuta order #${order.trackingId || order.id}...`
    Linking.openURL(`https://wa.me/2347075733866?text=${encodeURIComponent(text)}`)
  }

  const advanceStage = () => {
    setCurrentStageIdx((prev) => Math.min(STAGES.length - 1, prev + 1))
  }

  const rewindStage = () => {
    setCurrentStageIdx((prev) => Math.max(0, prev - 1))
  }

  const currentStage = STAGES[currentStageIdx]

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Live Order Tracking</Text>
            <Text style={styles.headerTrackingId}>#{order.trackingId || order.id}</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
          {/* Main ETA Hero Card (Chowdeck Style) */}
          <View style={styles.etaCard}>
            <Text style={styles.etaLabel}>ESTIMATED ARRIVAL</Text>
            <View style={styles.etaRow}>
              <Text style={styles.etaMinutes}>⚡ {countdownMinutes} mins</Text>
              <View style={styles.etaStatusPill}>
                <Text style={styles.etaStatusText}>{currentStage.title}</Text>
              </View>
            </View>
            <Text style={styles.etaAddress} numberOfLines={1}>
              📍 Delivering to: {order.deliveryAddress || "Mowe, Ogun State"}
            </Text>

            {/* Stage Progress Bar */}
            <View style={styles.progressBar}>
              {STAGES.map((s, idx) => {
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

          {/* Interactive Simulated Route Map Graphic */}
          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <Text style={styles.mapTitle}>Route corridor</Text>
              <Text style={styles.mapDistance}>4.2 km • Mowe Expressway</Text>
            </View>

            {/* Visual Route Canvas */}
            <View style={styles.routeCanvas}>
              {/* Origin: Tuta Suites */}
              <View style={styles.routeNode}>
                <View style={styles.nodeIconBg}>
                  <Text style={styles.nodeIcon}>🏨</Text>
                </View>
                <View>
                  <Text style={styles.nodeTitle}>Tuta Suites Hotel</Text>
                  <Text style={styles.nodeSub}>No 3 Assurance CDA, Orimerunmu</Text>
                </View>
              </View>

              {/* Highway Corridor Line & Rider Icon */}
              <View style={styles.routeLineContainer}>
                <View style={styles.routeDottedLine} />
                <View style={[styles.riderMarker, { top: `${20 + currentStageIdx * 18}%` as any }]}>
                  <Text style={styles.riderIcon}>🏍</Text>
                  <View style={styles.riderTooltip}>
                    <Text style={styles.riderTooltipText}>Rider en route</Text>
                  </View>
                </View>
              </View>

              {/* Destination: Customer Address */}
              <View style={styles.routeNode}>
                <View style={[styles.nodeIconBg, styles.destIconBg]}>
                  <Text style={styles.nodeIcon}>📍</Text>
                </View>
                <View>
                  <Text style={styles.nodeTitle}>Your Delivery Gate</Text>
                  <Text style={styles.nodeSub}>{order.deliveryAddress || "Mowe"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Rider Profile Card (Glovo / Chowdeck Signature) */}
          <View style={styles.riderCard}>
            <View style={styles.riderTopRow}>
              <View style={styles.riderAvatar}>
                <Text style={styles.riderAvatarText}>BK</Text>
              </View>
              <View style={styles.riderInfo}>
                <View style={styles.riderNameRow}>
                  <Text style={styles.riderName}>Babatunde K.</Text>
                  <View style={styles.riderRating}>
                    <Text style={styles.ratingText}>★ 4.9</Text>
                  </View>
                </View>
                <Text style={styles.riderVehicle}>Bajaj Boxer 150 • Plate: OGN-842-KT</Text>
                <Text style={styles.riderCount}>184 deliveries completed with care</Text>
              </View>
            </View>

            {/* Direct Contact Buttons */}
            <View style={styles.riderActionRow}>
              <TouchableOpacity activeOpacity={0.8} onPress={handleCallRider} style={styles.riderCallBtn}>
                <Text style={styles.riderCallText}>📞 Call Rider</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={handleWhatsAppRider} style={styles.riderWaBtn}>
                <Text style={styles.riderWaText}>💬 WhatsApp Rider</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Timeline Milestones */}
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>STATUS TIMELINE</Text>
            {STAGES.map((s, idx) => {
              const isPassed = idx <= currentStageIdx
              const isCurrent = idx === currentStageIdx
              return (
                <View key={s.key} style={styles.timelineRow}>
                  <View style={[styles.timelineDot, isPassed && styles.timelineDotPassed]}>
                    <Text style={styles.dotIcon}>{s.icon}</Text>
                  </View>
                  <View style={styles.timelineTextWrap}>
                    <Text style={[styles.timelineStageTitle, isCurrent && styles.timelineStageCurrent]}>
                      {s.title}
                    </Text>
                    <Text style={styles.timelineStageSub}>{s.subtitle}</Text>
                  </View>
                  {isPassed && <Text style={styles.passedCheck}>✓</Text>}
                </View>
              )
            })}
          </View>

          {/* Order Summary Dropdown */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>ORDER SUMMARY</Text>
            {order.items?.map((item: any, i: number) => (
              <View key={i} style={styles.summaryItemRow}>
                <Text style={styles.summaryItemQty}>{item.quantity}x</Text>
                <Text style={styles.summaryItemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.summaryItemPrice}>₦{item.totalPrice?.toLocaleString()}</Text>
              </View>
            ))}
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total Paid</Text>
              <Text style={styles.summaryTotalVal}>₦{order.totalAmount?.toLocaleString()}</Text>
            </View>
          </View>

          {/* Demo Simulation Controls */}
          <View style={styles.demoControls}>
            <Text style={styles.demoTitle}>🎮 Simulation Controls (Test Order Flow):</Text>
            <View style={styles.demoBtnRow}>
              <TouchableOpacity onPress={rewindStage} style={styles.demoBtn}>
                <Text style={styles.demoBtnText}>◀ Previous Stage</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={advanceStage} style={[styles.demoBtn, styles.demoBtnGold]}>
                <Text style={[styles.demoBtnText, styles.demoBtnTextGold]}>Next Stage ▶</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
  },
  backText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
  },
  headerTrackingId: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.danger,
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  etaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 16,
  },
  etaLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  etaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  etaMinutes: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.accentGreen,
  },
  etaStatusPill: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  etaStatusText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
  },
  etaAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  progressBar: {
    flexDirection: "row",
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: "hidden",
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    backgroundColor: COLORS.cardBorder,
  },
  progressSegmentPassed: {
    backgroundColor: COLORS.accentGreen,
  },
  progressSegmentCurrent: {
    backgroundColor: COLORS.primary,
  },
  mapCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  mapTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
    textTransform: "uppercase",
  },
  mapDistance: {
    fontSize: 11,
    color: COLORS.accentGreen,
    fontWeight: "700",
  },
  routeCanvas: {
    backgroundColor: "#0F1318",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    position: "relative",
  },
  routeNode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nodeIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  destIconBg: {
    borderColor: COLORS.accentGreen,
    backgroundColor: COLORS.accentGreenLight,
  },
  nodeIcon: {
    fontSize: 18,
  },
  nodeTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
  nodeSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  routeLineContainer: {
    height: 80,
    marginLeft: 18,
    position: "relative",
  },
  routeDottedLine: {
    width: 2,
    height: "100%",
    backgroundColor: COLORS.primary,
    opacity: 0.5,
  },
  riderMarker: {
    position: "absolute",
    left: -12,
    flexDirection: "row",
    alignItems: "center",
  },
  riderIcon: {
    fontSize: 24,
  },
  riderTooltip: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  riderTooltipText: {
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
  riderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  riderAvatarText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000",
  },
  riderInfo: {
    flex: 1,
  },
  riderNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  riderName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
  riderRating: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
  },
  riderVehicle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  riderCount: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  riderActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  riderCallBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 12,
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
    paddingVertical: 12,
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
  timelineTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  timelineDotPassed: {
    backgroundColor: COLORS.accentGreen,
    borderColor: COLORS.accentGreen,
  },
  dotIcon: {
    fontSize: 11,
  },
  timelineTextWrap: {
    flex: 1,
  },
  timelineStageTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  timelineStageCurrent: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  timelineStageSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  passedCheck: {
    color: COLORS.accentGreen,
    fontSize: 14,
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
  summaryTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  summaryItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  summaryItemQty: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    width: 28,
  },
  summaryItemName: {
    flex: 1,
    fontSize: 12,
    color: COLORS.white,
  },
  summaryItemPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },
  summaryTotalVal: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primary,
  },
  demoControls: {
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  demoBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  demoBtnGold: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.white,
  },
  demoBtnTextGold: {
    color: "#000",
  },
})
