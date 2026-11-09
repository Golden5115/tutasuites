import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Fallback menu matching Tuta Suites catalog
const FALLBACK_MENU = [
  // Rice Dishes
  { id: "rice-1", name: "Jollof Rice & Plantain", price: 2500, category: "Rice Dishes", desc: "Signature firewood-smoked jollof rice served with golden fried plantains.", prepTime: "20 mins", image: "/dsc_1006.jpg" },
  { id: "rice-2", name: "Special Fried Rice", price: 2750, category: "Rice Dishes", desc: "Wok-tossed seasoned rice with sweet corn, carrots, liver, and bell peppers.", prepTime: "25 mins", image: "/dsc_0982.jpg" },
  { id: "rice-3", name: "Asun Fried Rice", price: 4000, category: "Rice Dishes", desc: "Spicy basmati rice tossed with tender peppery goat meat chunks.", prepTime: "25 mins", image: "/dsc_1002.jpg" },
  { id: "rice-4", name: "Village Rice (Native Jollof)", price: 3500, category: "Rice Dishes", desc: "Traditional palm oil jollof cooked with dried fish, crayfish, and scent leaves.", prepTime: "30 mins", image: "/dsc_1005.jpg" },

  // Soups & Swallow
  { id: "soup-1", name: "Egusi Soup Special", price: 2500, category: "Soups & Swallow", desc: "Rich melon seed soup prepared with bitter leaf, stock fish, and crayfish.", prepTime: "25 mins", image: "/dsc_0990.jpg" },
  { id: "soup-2", name: "Ila Alasepo (Okro Special)", price: 2500, category: "Soups & Swallow", desc: "Fresh diced okro soup enriched with seafood, prawns, and crabs.", prepTime: "20 mins", image: "/dsc_1018.jpg" },
  { id: "soup-3", name: "Efo Riro (Vegetable Soup)", price: 2500, category: "Soups & Swallow", desc: "Savory Lagos-style spinach soup infused with locust beans and assorted meats.", prepTime: "25 mins", image: "/dsc_0986.jpg" },
  { id: "swallow-1", name: "Amala / Eba / Poundo Portion", price: 1000, category: "Soups & Swallow", desc: "Smooth, piping hot swallow of your choice.", prepTime: "10 mins", image: "/dsc_0996.jpg" },

  // Pepper Soups & Grills
  { id: "pepper-1", name: "Catfish Point & Kill Pepper Soup", price: 11000, category: "Pepper Soup & Grills", desc: "Whole fresh catfish simmered in aromatic indigenous herbs and spices.", prepTime: "35 mins", image: "/dsc_1019.jpg" },
  { id: "pepper-2", name: "Goat Meat Pepper Soup", price: 7000, category: "Pepper Soup & Grills", desc: "Tender goat meat bites in zesty broth with scent leaves.", prepTime: "25 mins", image: "/dsc_1022.jpg" },
  { id: "pepper-3", name: "Crispy Grilled Turkey", price: 6000, category: "Pepper Soup & Grills", desc: "Succulent turkey marinated in chili glaze and grilled to perfection.", prepTime: "20 mins", image: "/dsc_1025.jpg" },
  { id: "pepper-4", name: "Peppered Chicken", price: 4000, category: "Pepper Soup & Grills", desc: "Crispy fried chicken tossed in sweet and spicy pepper sauce.", prepTime: "15 mins", image: "/dsc_1032.jpg" },

  // Breakfast & Light Bites
  { id: "bf-1", name: "Noodles & Fried Egg", price: 4000, category: "Breakfast & Bites", desc: "Spicy stir-fried Indomie noodles garnished with peppers and 2 eggs.", prepTime: "15 mins", image: "/dsc_0982.jpg" },
  { id: "bf-2", name: "Tea, Bread & Sausage", price: 3000, category: "Breakfast & Bites", desc: "Fresh Agege bread with fried omelette and hot chocolate or coffee.", prepTime: "15 mins", image: "/dsc_1006.jpg" },
  { id: "bf-3", name: "Fried Plantain (Dodo)", price: 1000, category: "Sides & Extras", desc: "Sweet, ripe fried plantain discs.", prepTime: "10 mins", image: "/dsc_1002.jpg" },

  // Drinks & Beverages
  { id: "bev-1", name: "Signature Tuta Chapman", price: 3000, category: "Drinks & Bar", desc: "Classic Nigerian cocktail with cucumber slices, lime, and Angostura bitters.", prepTime: "5 mins", image: "/dsc_1005.jpg" },
  { id: "bev-2", name: "Chilled Heineken / Guinness", price: 2000, category: "Drinks & Bar", desc: "Ice-cold premium beer served in a frosted glass.", prepTime: "5 mins", image: "/dsc_0990.jpg" },
  { id: "bev-3", name: "Fresh Juice / Energy Drink", price: 2000, category: "Drinks & Bar", desc: "Refreshing fruit juice or chilled energy beverage.", prepTime: "5 mins", image: "/dsc_1018.jpg" },
]

export async function GET() {
  try {
    const [restaurantItems, barItems] = await Promise.all([
      prisma.restaurantItem.findMany({ orderBy: { name: "asc" } }).catch(() => []),
      prisma.barItem.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    ])

    if (restaurantItems.length > 0 || barItems.length > 0) {
      const items = [
        ...restaurantItems.map((r) => ({
          id: r.id,
          name: r.name,
          price: r.price,
          category: r.category || "Meals",
          desc: `Freshly prepared ${r.name} from Tuta Suites kitchen.`,
          prepTime: "20 - 30 mins",
          stock: r.stock,
          image: "/dsc_1006.jpg",
        })),
        ...barItems.map((b) => ({
          id: b.id,
          name: b.name,
          price: b.price,
          category: "Drinks & Bar",
          desc: `Chilled ${b.name} from Tuta Lounge.`,
          prepTime: "5 - 10 mins",
          stock: b.stock,
          image: "/dsc_1005.jpg",
        })),
      ]

      const categories = Array.from(new Set(items.map((i) => i.category)))

      return NextResponse.json({
        success: true,
        source: "database",
        categories: ["All", ...categories],
        items,
      })
    }
  } catch (e) {
    console.warn("Using fallback menu data:", e)
  }

  // Fallback
  const categories = Array.from(new Set(FALLBACK_MENU.map((i) => i.category)))
  return NextResponse.json({
    success: true,
    source: "fallback",
    categories: ["All", ...categories],
    items: FALLBACK_MENU,
  })
}
