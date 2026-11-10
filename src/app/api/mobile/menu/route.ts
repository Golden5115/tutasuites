import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Official Tuta Grab & Go fallback catalog
const FALLBACK_GRAB_AND_GO_MENU = [
  // Rice
  { id: "rice-jollof", name: "Jollof Rice", price: 500, category: "Rice", desc: "Signature firewood-smoked long-grain jollof rice.", prepTime: "5 - 10 mins", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop" },
  { id: "rice-fried", name: "Fried Rice", price: 500, category: "Rice", desc: "Fluffy wok-tossed seasoned rice with sweet corn, carrots, and spring onions.", prepTime: "5 - 10 mins", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop" },
  { id: "rice-native", name: "Native Rice", price: 700, category: "Rice", desc: "Aromatic palm oil jollof rice cooked with smoked fish, crayfish, and scent leaves.", prepTime: "5 - 10 mins", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop" },
  { id: "rice-white", name: "White Rice", price: 500, category: "Rice", desc: "Steamed fluffy white rice portion.", prepTime: "5 mins", image: "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&auto=format&fit=crop" },

  // Swallow & Soups
  { id: "swallow-eba", name: "Eba", price: 500, category: "Swallow & Soup", desc: "Yellow cassava swallow served with choice of Egusi or Efo Riro.", prepTime: "5 - 10 mins", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop" },
  { id: "swallow-semo", name: "Semo", price: 500, category: "Swallow & Soup", desc: "Silky semovita swallow served with choice of Egusi or Efo Riro.", prepTime: "5 - 10 mins", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop" },
  { id: "swallow-poundo", name: "Poundo", price: 700, category: "Swallow & Soup", desc: "Pounded yam portion served with savory soup.", prepTime: "5 - 10 mins", image: "https://images.unsplash.com/photo-1514944298352-7e181e1a5349?w=600&auto=format&fit=crop" },
  { id: "soup-egusi", name: "Egusi Soup", price: 0, category: "Swallow & Soup", desc: "Rich melon seed soup with bitter leaf and crayfish.", prepTime: "5 mins", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop" },
  { id: "soup-efo", name: "Efo Riro", price: 0, category: "Swallow & Soup", desc: "Savory Lagos-style spinach vegetable soup.", prepTime: "5 mins", image: "https://images.unsplash.com/photo-1514944298352-7e181e1a5349?w=600&auto=format&fit=crop" },

  // Proteins
  { id: "prot-turkey", name: "Turkey", price: 4000, category: "Proteins", desc: "Crispy grilled peppered turkey wing portion.", prepTime: "5 - 10 mins", image: "https://images.unsplash.com/photo-1527477378408-1bc43f07a4e9?w=600&auto=format&fit=crop" },
  { id: "prot-chicken", name: "Chicken", price: 3000, category: "Proteins", desc: "Crispy fried peppered chicken piece.", prepTime: "5 - 10 mins", image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop" },
  { id: "prot-fish", name: "Fish", price: 1500, category: "Proteins", desc: "Fried seasoned fish portion.", prepTime: "5 mins", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop" },
  { id: "prot-goat", name: "Goat Meat", price: 1000, category: "Proteins", desc: "Tender spicy goat meat chunk.", prepTime: "5 mins", image: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop" },
  { id: "prot-beef", name: "Beef", price: 500, category: "Proteins", desc: "Seasoned beef chunk.", prepTime: "5 mins", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop" },
  { id: "prot-egg", name: "Egg", price: 500, category: "Proteins", desc: "Boiled or fried egg.", prepTime: "5 mins", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop" },

  // Sides & Shawarma
  { id: "side-shawarma", name: "Shawarma", price: 2500, category: "Sides & Shawarma", desc: "Double-wrapped juicy chicken or beef shawarma with sausages.", prepTime: "10 - 15 mins", image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop" },
  { id: "side-plantain", name: "Plantain (Dodo)", price: 500, category: "Sides & Shawarma", desc: "Sweet golden ripe fried plantains.", prepTime: "5 mins", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop" },
  { id: "side-salad", name: "Salad", price: 500, category: "Sides & Shawarma", desc: "Fresh cabbage, carrot, and sweet corn salad with dressing.", prepTime: "5 mins", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop" },

  // Drinks
  { id: "dr-zobo", name: "Zobo Special", price: 1000, category: "Drinks", desc: "Chilled pure hibiscus and ginger infusion.", prepTime: "2 mins", image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop" },
  { id: "dr-juice", name: "Juice", price: 1500, category: "Drinks", desc: "Chilled fruit juice pack.", prepTime: "2 mins", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&auto=format&fit=crop" },
  { id: "dr-coke", name: "Coke", price: 500, category: "Drinks", desc: "Chilled Coca-Cola 50cl.", prepTime: "2 mins", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop" },
  { id: "dr-sprite", name: "Sprite", price: 500, category: "Drinks", desc: "Chilled Sprite 50cl.", prepTime: "2 mins", image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&auto=format&fit=crop" },
  { id: "dr-water-300", name: "Water (Bottle)", price: 300, category: "Drinks", desc: "Chilled bottled table water.", prepTime: "2 mins", image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop" },

  // Extras
  { id: "extra-takeaway", name: "Take Away Pack", price: 300, category: "Extras", desc: "Hygienic sealed takeaway pack.", prepTime: "Instant", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop" },
  { id: "extra-water-200", name: "Water (Cup)", price: 200, category: "Extras", desc: "Sealed pure drinking water portion.", prepTime: "Instant", image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop" },
]

export async function GET() {
  try {
    const grabAndGoDbItems: any[] = await prisma
      .$queryRawUnsafe<any[]>(
        `SELECT "id", "name", "price", "category", "stock", "isAvailable"
         FROM "GrabAndGoItem"
         WHERE "isAvailable" = true
         ORDER BY "name" ASC`
      )
      .catch(() => [])

    if (grabAndGoDbItems && grabAndGoDbItems.length > 0) {
      const items = grabAndGoDbItems.map((item) => {
        const fallback = FALLBACK_GRAB_AND_GO_MENU.find(
          (f) => f.name.toLowerCase() === item.name.toLowerCase()
        )
        return {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          category: item.category || fallback?.category || "Meals",
          desc: fallback?.desc || `Freshly prepared ${item.name} from Tuta Grab & Go counter.`,
          prepTime: fallback?.prepTime || "5 - 10 mins",
          stock: item.stock,
          image: fallback?.image || "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop",
        }
      })

      const categories = Array.from(new Set(items.map((i) => i.category)))

      return NextResponse.json({
        success: true,
        source: "database",
        categories: ["All", ...categories],
        items,
      })
    }
  } catch (e) {
    console.warn("Using fallback Grab & Go menu data:", e)
  }

  // Fallback
  const categories = Array.from(new Set(FALLBACK_GRAB_AND_GO_MENU.map((i) => i.category)))
  return NextResponse.json({
    success: true,
    source: "fallback",
    categories: ["All", ...categories],
    items: FALLBACK_GRAB_AND_GO_MENU,
  })
}
