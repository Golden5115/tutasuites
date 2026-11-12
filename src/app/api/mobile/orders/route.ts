import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  ensureMobileAuthSchema,
  getAuthenticatedCustomerFromRequest,
} from "@/lib/mobile-auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const DATA_DIR = path.join(process.cwd(), ".delivery-orders");
const ORDERS_FILE = path.join(DATA_DIR, "mobile-orders.json");

function getOrders(): any[] {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return [];
    const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveOrders(orders: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write mobile orders file", e);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get("trackingId") || searchParams.get("id");
  const mineOnly = searchParams.get("mine") === "1" || searchParams.get("mine") === "true";

  // 1. Authenticated Customer Order History (?mine=1)
  if (mineOnly) {
    await ensureMobileAuthSchema();
    const authCtx = await getAuthenticatedCustomerFromRequest(req);
    if (!authCtx) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view order history." },
        { status: 401, headers: CORS_HEADERS }
      );
    }
    const customer = authCtx.customer;

    const mergedByTrackingId = new Map<string, any>();

    // Load from PostgreSQL GrabAndGoOrder linked to customer.id
    try {
      const dbOrders = await prisma.$queryRawUnsafe<
        Array<{
          id: string;
          orderNumber: string;
          customerName: string | null;
          orderType: string;
          paymentMethod: string;
          status: string;
          totalAmount: number;
          notes: string | null;
          createdAt: Date;
        }>
      >(
        `SELECT "id", "orderNumber", "customerName", "orderType", "paymentMethod",
                "status", "totalAmount", "notes", "createdAt"
         FROM "GrabAndGoOrder"
         WHERE "customerId" = $1
         ORDER BY "createdAt" DESC
         LIMIT 30`,
        customer.id
      );

      for (const dbOrder of dbOrders) {
        const items = await prisma.$queryRawUnsafe<
          Array<{
            itemId: string;
            itemName: string;
            category: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
          }>
        >(
          `SELECT "itemId", "itemName", "category", "quantity", "unitPrice", "totalPrice"
           FROM "GrabAndGoOrderItem"
           WHERE "orderId" = $1`,
          dbOrder.id
        );

        mergedByTrackingId.set(dbOrder.orderNumber, {
          id: dbOrder.orderNumber,
          trackingId: dbOrder.orderNumber,
          customerId: customer.id,
          customerName: dbOrder.customerName || customer.name,
          orderType: dbOrder.orderType,
          paymentMethod: dbOrder.paymentMethod,
          status: dbOrder.status,
          totalAmount: dbOrder.totalAmount,
          createdAt:
            dbOrder.createdAt instanceof Date
              ? dbOrder.createdAt.toISOString()
              : String(dbOrder.createdAt),
          items: items.map((it) => ({
            itemId: it.itemId,
            name: it.itemName,
            category: it.category,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
          })),
        });
      }
    } catch {
      // Fallback to file cache if DB query fails
    }

    // Merge local file cache orders owned by this customerId
    const fileOrders = getOrders();
    for (const o of fileOrders) {
      if (o.customerId === customer.id && !mergedByTrackingId.has(o.trackingId)) {
        mergedByTrackingId.set(o.trackingId, o);
      }
    }

    return NextResponse.json(
      {
        success: true,
        orders: Array.from(mergedByTrackingId.values()),
      },
      { headers: CORS_HEADERS }
    );
  }

  const orders = getOrders();

  // 2. Single Order Tracking (?trackingId=TGG-XXXX)
  if (trackingId) {
    let single = orders.find(
      (o: any) => o.trackingId === trackingId || o.id === trackingId
    );

    // Sync live status from PostgreSQL GrabAndGoOrder if available
    try {
      const dbRows = await prisma.$queryRawUnsafe<
        Array<{
          id: string;
          orderNumber: string;
          customerName: string | null;
          orderType: string;
          paymentMethod: string;
          status: string;
          totalAmount: number;
          createdAt: Date;
          updatedAt: Date;
        }>
      >(
        `SELECT "id", "orderNumber", "customerName", "orderType", "paymentMethod",
                "status", "totalAmount", "createdAt", "updatedAt"
         FROM "GrabAndGoOrder"
         WHERE "orderNumber" = $1 OR "id" = $1
         LIMIT 1`,
        trackingId
      );

      if (dbRows.length > 0) {
        const dbRow = dbRows[0];
        if (single) {
          single = {
            ...single,
            status: dbRow.status || single.status,
            updatedAt:
              dbRow.updatedAt instanceof Date
                ? dbRow.updatedAt.toISOString()
                : single.updatedAt,
          };
        } else {
          single = {
            id: dbRow.orderNumber,
            trackingId: dbRow.orderNumber,
            customerName: dbRow.customerName || "Mobile Customer",
            orderType: dbRow.orderType,
            paymentMethod: dbRow.paymentMethod,
            status: dbRow.status,
            totalAmount: dbRow.totalAmount,
            createdAt:
              dbRow.createdAt instanceof Date
                ? dbRow.createdAt.toISOString()
                : new Date().toISOString(),
            updatedAt:
              dbRow.updatedAt instanceof Date
                ? dbRow.updatedAt.toISOString()
                : new Date().toISOString(),
          };
        }
      }
    } catch {
      // Ignore DB lookup errors and fall back to local order
    }

    if (single) {
      return NextResponse.json(
        { success: true, order: single },
        { headers: CORS_HEADERS }
      );
    }
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    {
      success: true,
      orders,
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  try {
    await ensureMobileAuthSchema();
    const authCtx = await getAuthenticatedCustomerFromRequest(req);
    const authenticatedCustomer = authCtx?.customer || null;

    const body = await req.json();
    const {
      type = "GRAB_AND_GO",
      items = [],
      customerName = authenticatedCustomer?.name || "Mobile Customer",
      customerPhone = authenticatedCustomer?.phone || "",
      deliveryAddress = authenticatedCustomer?.address || "",
      deliveryArea = "Mowe",
      notes = "",
      paymentMethod = "TRANSFER",
      subtotal = 0,
      deliveryFee = 0,
      serviceFee = 0,
      totalAmount: explicitTotal,
      orderType = "TAKEAWAY",
    } = body;

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const trackingId = body.trackingId || `TGG-${randomDigits}`;
    const totalAmount = explicitTotal || subtotal + deliveryFee + serviceFee;

    const estimatedMinutes =
      orderType === "PICKUP" || orderType === "TAKEAWAY" ? 10 : 25;
    const estimatedArrival = new Date(
      Date.now() + estimatedMinutes * 60 * 1000
    ).toISOString();

    const rider = {
      name: "Babatunde K.",
      phone: "07075733866",
      vehicle: "Bajaj Boxer 150",
      plateNumber: "OGN-842-KT",
      rating: 4.9,
      deliveriesCount: 184,
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    };

    const verifiedCustomerId = authenticatedCustomer?.id || null;

    const newOrder = {
      id: trackingId,
      trackingId,
      customerId: verifiedCustomerId,
      type,
      orderType,
      items,
      customerName,
      customerPhone,
      deliveryAddress:
        deliveryAddress ||
        (orderType === "PICKUP" ? "Tuta Grab & Go Express Counter" : "Mowe"),
      deliveryArea,
      deliveryNotes: notes,
      paymentMethod,
      subtotal,
      deliveryFee,
      serviceFee,
      totalAmount,
      estimatedMinutes,
      estimatedArrival,
      status: "PREPARING",
      rider,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to local file cache
    const currentOrders = getOrders();
    saveOrders([newOrder, ...currentOrders]);

    // Save directly into GrabAndGoOrder PostgreSQL database if available
    try {
      const orderId = `ggo_${crypto.randomBytes(10).toString("hex")}`;
      const contactNote = [
        customerPhone ? `Phone: ${customerPhone}` : "",
        deliveryAddress ? `Address: ${deliveryAddress}` : "",
        notes ? `Note: ${notes}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      await prisma.$executeRawUnsafe(
        `INSERT INTO "GrabAndGoOrder" (
          "id", "orderNumber", "customerId", "customerName", "orderType", "paymentMethod", "cashierName", "status", "totalAmount", "notes", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, 'Mobile App', 'PENDING', $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        orderId,
        trackingId,
        verifiedCustomerId,
        customerName.trim() || "Mobile Customer",
        orderType === "PICKUP" || orderType === "TAKEAWAY" ? "TAKEAWAY" : "DELIVERY",
        paymentMethod || "TRANSFER",
        totalAmount,
        contactNote || null
      );

      if (items && Array.isArray(items)) {
        for (const it of items) {
          const orderItemId = `ggoi_${crypto.randomBytes(10).toString("hex")}`;
          await prisma.$executeRawUnsafe(
            `INSERT INTO "GrabAndGoOrderItem" (
              "id", "orderId", "itemId", "itemName", "category", "quantity", "unitPrice", "totalPrice", "createdAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
            orderItemId,
            orderId,
            it.itemId || `item_${Date.now()}`,
            it.name || "Meal Portion",
            it.category || "Rice",
            it.quantity || 1,
            it.unitPrice ||
              it.price ||
              (it.totalPrice ? it.totalPrice / (it.quantity || 1) : 500),
            it.totalPrice || (it.unitPrice || 500) * (it.quantity || 1)
          );
        }
      }
    } catch (dbErr) {
      console.warn(
        "Notice: Database direct write bypassed (file cache retained):",
        dbErr instanceof Error ? dbErr.message : "DB error"
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully!",
        order: newOrder,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
