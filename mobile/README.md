# Tuta Suites Mobile Application (Chowdeck & Glovo Style)

A modern on-demand food ordering and courier dispatch mobile application built with **Expo (React Native)** for **Tuta Suites**, inspired by **Chowdeck** and **Glovo**.

---

## 🌟 Key Features

### 1. Meal Ordering & In-House Restaurant Delivery
- **Full Menu Browsing**: Jollof rice, Fried rice, Asun rice, Egusi soup, Seafood okro, Point & kill catfish pepper soup, Grilled turkey, Breakfast, and Chilled drinks.
- **Meal Customization**:
  - Add proteins (Grilled Chicken, Turkey, Fish, Beef, Egg)
  - Add sides (Plantain, Moi moi, Salad, Extra pepper sauce)
  - Chef cooking notes (e.g., "Extra spicy", "No onion", "Sauce separate")
- **Live Cart & Checkout**:
  - Item quantity controls
  - Dynamic fee calculation: Food Subtotal + Delivery Fee + Packaging & Service Fee
  - Payment methods: Bank Transfer, Card / Paystack, Cash on Delivery (COD)

### 2. Tuta Courier & Package Dispatch ("Send Anything")
- Directly send packages, documents, pharmacy medicine, gifts, or request an errand runner.
- Select from 11 corridor hubs: Mowe, Magboro, Ibafo, Arepo, OPIC, Wawa, Asese, Lotto, Sagamu.
- Instant estimated fare calculation based on route and package size.

### 3. Real-Time Live Order Tracking (Chowdeck Signature)
- **Live Countdown Timer**: "⚡ 24 mins remaining"
- **5-Stage Animated Milestone Progress**:
  1. *Order Confirmed* - Kitchen accepted order
  2. *Preparing Meal* - Chef cooking in Tuta Kitchen
  3. *Rider Picked Up* - Dispatch rider collected insulated bag from Tuta Suites HQ
  4. *Rider On The Way* - Heading to customer address with animated corridor map
  5. *Delivered* - Handed over safely
- **Rider Profile Card**:
  - Dispatch rider name: *Babatunde K.*
  - Rating: *4.9 ★ (184 deliveries)*
  - Vehicle: *Bajaj Boxer 150 (Plate: OGN-842-KT)*
  - Direct 1-tap *Call Rider* and *WhatsApp Rider* buttons
- **Interactive Simulation Controls**: Step forwards and backwards through delivery stages for instant testing and demos.

---

## 🚀 How to Run the Mobile App

### Prerequisites
Make sure you have Node.js and Expo CLI installed.

```bash
cd mobile
npm install
```

### Run with Expo Go (Scan on Phone)
```bash
npx expo start
```
- Open **Expo Go** on your Android or iPhone.
- Scan the QR code displayed in your terminal.
- Test hot-reloading in real time!

### Run on Web (Browser Preview)
```bash
npx expo start --web
```

---

## 🌐 Connected Backend API Endpoints (Next.js)

The mobile app connects with your Next.js backend:
- `GET /api/mobile/menu`: Restaurant food and bar items catalog
- `POST /api/mobile/orders`: Create new meal order or courier dispatch
- `GET /api/mobile/orders/[id]`: Real-time tracking status, ETA countdown, and rider milestones
