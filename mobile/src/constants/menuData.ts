export type MobileMenuCategory =
  | "Rice"
  | "Swallow & Soup"
  | "Proteins"
  | "Sides & Shawarma"
  | "Drinks"
  | "Extras";

export interface MenuItem {
  id: string;
  slug?: string | null;
  name: string;
  category: MobileMenuCategory;
  backendCategory?: string;
  itemKind?: string;
  price: number;
  desc: string;
  prepTime: string;
  image: string;
  isPopular?: boolean;
  isAvailable?: boolean;
}

export interface AddonCatalogItem {
  id: string;
  slug?: string | null;
  name: string;
  price: number;
}

export interface DeliveryZoneOption {
  id: string;
  slug: string;
  name: string;
  corridor: string;
  deliveryFee: number;
  etaMinMinutes: number;
  etaMaxMinutes: number;
}

const DEFAULT_FOOD_IMAGES: Record<string, string> = {
  "smokey-jollof-rice":
    "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop",
  "fried-rice":
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop",
  "white-rice-and-stew":
    "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&auto=format&fit=crop",
  "pounded-yam":
    "https://images.unsplash.com/photo-1514944298352-7e181e1a5349?w=600&auto=format&fit=crop",
  eba: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop",
  amala:
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop",
  semovita:
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop",
  fufu: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop",
  "crispy-grilled-turkey":
    "https://images.unsplash.com/photo-1527477378408-1bc43f07a4e9?w=600&auto=format&fit=crop",
  "peppered-chicken":
    "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop",
  "titus-fish":
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop",
  "croaker-fish":
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop",
  "goat-meat":
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop",
  "assorted-meat":
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop",
  beef: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&auto=format&fit=crop",
  ponmo:
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop",
  "boiled-egg":
    "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=600&auto=format&fit=crop",
  "creamy-chicken-shawarma":
    "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop",
  "fried-plantain-dodo":
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop",
  coleslaw:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop",
  "chilled-zobo-special":
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop",
  "bottled-water":
    "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop",
  "thermal-takeaway-pack":
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop",
};

export function mapBackendCategoryToMobile(category: string): MobileMenuCategory {
  const c = (category || "").trim();
  if (c === "Rice") return "Rice";
  if (c === "Swallow" || c === "Soup" || c === "Soups" || c === "Swallow & Soup") {
    return "Swallow & Soup";
  }
  if (c === "Protein" || c === "Proteins") return "Proteins";
  if (
    c === "Specialty" ||
    c === "Side" ||
    c === "Sides" ||
    c === "Sides & Shawarma"
  ) {
    return "Sides & Shawarma";
  }
  if (c === "Drink" || c === "Drinks") return "Drinks";
  return "Extras";
}

export function mapServerMenuItem(raw: Record<string, unknown>): MenuItem {
  const slug = typeof raw.slug === "string" ? raw.slug : null;
  const id = String(raw.id || slug || "");
  const name = String(raw.name || "Dish");
  const backendCat = String(raw.category || "Rice");
  const prepMins = Number(raw.prepTimeMinutes || 10);

  return {
    id,
    slug,
    name,
    category: mapBackendCategoryToMobile(backendCat),
    backendCategory: backendCat,
    itemKind: typeof raw.itemKind === "string" ? raw.itemKind : undefined,
    price: Number(raw.price ?? 0),
    desc:
      typeof raw.description === "string" && raw.description
        ? raw.description
        : "Freshly prepared daily in Tuta Express Kitchen.",
    prepTime: `${prepMins} mins`,
    image:
      (typeof raw.imageUrl === "string" && raw.imageUrl) ||
      (slug ? DEFAULT_FOOD_IMAGES[slug] : "") ||
      DEFAULT_FOOD_IMAGES["smokey-jollof-rice"],
    isAvailable: raw.isAvailable !== false,
    isPopular:
      slug === "smokey-jollof-rice" ||
      slug === "crispy-grilled-turkey" ||
      slug === "creamy-chicken-shawarma" ||
      slug === "pounded-yam",
  };
}

export const MOWE_DELIVERY_ZONES: DeliveryZoneOption[] = [
  {
    id: "mowe-assurance-cda",
    slug: "mowe-assurance-cda",
    name: "Mowe Assurance CDA",
    corridor: "Mowe Corridor",
    deliveryFee: 1200,
    etaMinMinutes: 15,
    etaMaxMinutes: 30,
  },
  {
    id: "mowe-bus-stop",
    slug: "mowe-bus-stop",
    name: "Mowe Bus Stop",
    corridor: "Mowe Corridor",
    deliveryFee: 1200,
    etaMinMinutes: 15,
    etaMaxMinutes: 25,
  },
  {
    id: "ibafo",
    slug: "ibafo",
    name: "Ibafo",
    corridor: "Ibafo Corridor",
    deliveryFee: 1800,
    etaMinMinutes: 25,
    etaMaxMinutes: 40,
  },
  {
    id: "magboro",
    slug: "magboro",
    name: "Magboro",
    corridor: "Magboro Corridor",
    deliveryFee: 2200,
    etaMinMinutes: 30,
    etaMaxMinutes: 45,
  },
  {
    id: "arepo",
    slug: "arepo",
    name: "Arepo",
    corridor: "Magboro Corridor",
    deliveryFee: 2500,
    etaMinMinutes: 30,
    etaMaxMinutes: 50,
  },
  {
    id: "opic",
    slug: "opic",
    name: "OPIC",
    corridor: "OPIC Corridor",
    deliveryFee: 3000,
    etaMinMinutes: 40,
    etaMaxMinutes: 60,
  },
];

export const MENU_ITEMS: MenuItem[] = [
  // Rice & Combos
  {
    id: "smokey-jollof-rice",
    slug: "smokey-jollof-rice",
    name: "Smokey Jollof Rice",
    category: "Rice",
    backendCategory: "Rice",
    price: 500,
    desc: "Signature firewood-smoked Nigerian party jollof rice.",
    prepTime: "10 mins",
    image: DEFAULT_FOOD_IMAGES["smokey-jollof-rice"],
    isPopular: true,
  },
  {
    id: "fried-rice",
    slug: "fried-rice",
    name: "Fried Rice",
    category: "Rice",
    backendCategory: "Rice",
    price: 500,
    desc: "Golden basmati fried rice tossed with liver, sweet corn, and garden veggies.",
    prepTime: "10 mins",
    image: DEFAULT_FOOD_IMAGES["fried-rice"],
    isPopular: true,
  },
  {
    id: "white-rice-and-stew",
    slug: "white-rice-and-stew",
    name: "White Rice & Stew",
    category: "Rice",
    backendCategory: "Rice",
    price: 500,
    desc: "Steamed white rice paired with rich slow-simmered ata dindin peppered stew.",
    prepTime: "10 mins",
    image: DEFAULT_FOOD_IMAGES["white-rice-and-stew"],
  },

  // Swallow (₦500 each, 1 complimentary soup included)
  {
    id: "pounded-yam",
    slug: "pounded-yam",
    name: "Pounded Yam",
    category: "Swallow & Soup",
    backendCategory: "Swallow",
    price: 500,
    desc: "Hot smooth pounded yam served with one complimentary homemade Nigerian soup.",
    prepTime: "12 mins",
    image: DEFAULT_FOOD_IMAGES["pounded-yam"],
    isPopular: true,
  },
  {
    id: "eba",
    slug: "eba",
    name: "Eba",
    category: "Swallow & Soup",
    backendCategory: "Swallow",
    price: 500,
    desc: "Silky golden garri swallow served with one complimentary homemade soup.",
    prepTime: "8 mins",
    image: DEFAULT_FOOD_IMAGES["eba"],
    isPopular: true,
  },
  {
    id: "amala",
    slug: "amala",
    name: "Amala",
    category: "Swallow & Soup",
    backendCategory: "Swallow",
    price: 500,
    desc: "Classic smooth yam-flour amala served with one complimentary soup.",
    prepTime: "12 mins",
    image: DEFAULT_FOOD_IMAGES["amala"],
  },
  {
    id: "semovita",
    slug: "semovita",
    name: "Semovita",
    category: "Swallow & Soup",
    backendCategory: "Swallow",
    price: 500,
    desc: "Soft lump-free semovita wrap served with one complimentary soup.",
    prepTime: "10 mins",
    image: DEFAULT_FOOD_IMAGES["semovita"],
  },
  {
    id: "fufu",
    slug: "fufu",
    name: "Fufu",
    category: "Swallow & Soup",
    backendCategory: "Swallow",
    price: 500,
    desc: "Freshly prepared smooth fufu served with one complimentary soup.",
    prepTime: "10 mins",
    image: DEFAULT_FOOD_IMAGES["fufu"],
  },

  // Proteins
  {
    id: "crispy-grilled-turkey",
    slug: "crispy-grilled-turkey",
    name: "Crispy Grilled Turkey",
    category: "Proteins",
    backendCategory: "Protein",
    price: 4000,
    desc: "Chargrilled glazed turkey portion tossed in chef pepper sauce.",
    prepTime: "12 mins",
    image: DEFAULT_FOOD_IMAGES["crispy-grilled-turkey"],
    isPopular: true,
  },
  {
    id: "peppered-chicken",
    slug: "peppered-chicken",
    name: "Peppered Chicken",
    category: "Proteins",
    backendCategory: "Protein",
    price: 3000,
    desc: "Crispy golden chicken quarter finished in spicy pepper sauce.",
    prepTime: "10 mins",
    image: DEFAULT_FOOD_IMAGES["peppered-chicken"],
    isPopular: true,
  },
  {
    id: "titus-fish",
    slug: "titus-fish",
    name: "Titus Fish",
    category: "Proteins",
    backendCategory: "Protein",
    price: 2000,
    desc: "Succulent mackerel (Titus) cut pan-seared and stewed.",
    prepTime: "10 mins",
    image: DEFAULT_FOOD_IMAGES["titus-fish"],
  },
  {
    id: "croaker-fish",
    slug: "croaker-fish",
    name: "Croaker Fish",
    category: "Proteins",
    backendCategory: "Protein",
    price: 3000,
    desc: "Herb-marinated oven-grilled croaker steak.",
    prepTime: "15 mins",
    image: DEFAULT_FOOD_IMAGES["croaker-fish"],
  },
  {
    id: "goat-meat",
    slug: "goat-meat",
    name: "Goat Meat",
    category: "Proteins",
    backendCategory: "Protein",
    price: 1500,
    desc: "Tender slow-braised peppered goat meat cuts.",
    prepTime: "10 mins",
    image: DEFAULT_FOOD_IMAGES["goat-meat"],
  },
  {
    id: "assorted-meat",
    slug: "assorted-meat",
    name: "Assorted Meat",
    category: "Proteins",
    backendCategory: "Protein",
    price: 1500,
    desc: "Savory mix of shaki, round-about, cow foot, and beef in pepper sauce.",
    prepTime: "10 mins",
    image: DEFAULT_FOOD_IMAGES["assorted-meat"],
  },
  {
    id: "beef",
    slug: "beef",
    name: "Beef",
    category: "Proteins",
    backendCategory: "Protein",
    price: 500,
    desc: "Tender braised beef piece in seasoned ata stew.",
    prepTime: "8 mins",
    image: DEFAULT_FOOD_IMAGES["beef"],
  },
  {
    id: "ponmo",
    slug: "ponmo",
    name: "Ponmo",
    category: "Proteins",
    backendCategory: "Protein",
    price: 500,
    desc: "Soft spiced cowhide (ponmo) simmered in spicy pepper sauce.",
    prepTime: "5 mins",
    image: DEFAULT_FOOD_IMAGES["ponmo"],
  },
  {
    id: "boiled-egg",
    slug: "boiled-egg",
    name: "Boiled Egg",
    category: "Proteins",
    backendCategory: "Protein",
    price: 500,
    desc: "Farm-fresh boiled egg.",
    prepTime: "5 mins",
    image: DEFAULT_FOOD_IMAGES["boiled-egg"],
  },

  // Sides, Specialties, Drinks & Extras
  {
    id: "creamy-chicken-shawarma",
    slug: "creamy-chicken-shawarma",
    name: "Creamy Chicken Shawarma",
    category: "Sides & Shawarma",
    backendCategory: "Specialty",
    price: 2500,
    desc: "Loaded grilled chicken & sausage wrap with creamy garlic mayo and spice.",
    prepTime: "15 mins",
    image: DEFAULT_FOOD_IMAGES["creamy-chicken-shawarma"],
    isPopular: true,
  },
  {
    id: "fried-plantain-dodo",
    slug: "fried-plantain-dodo",
    name: "Fried Plantain (Dodo)",
    category: "Sides & Shawarma",
    backendCategory: "Side",
    price: 500,
    desc: "Sweet golden caramelized ripe plantain slices.",
    prepTime: "6 mins",
    image: DEFAULT_FOOD_IMAGES["fried-plantain-dodo"],
  },
  {
    id: "coleslaw",
    slug: "coleslaw",
    name: "Coleslaw",
    category: "Sides & Shawarma",
    backendCategory: "Side",
    price: 500,
    desc: "Crisp chilled shredded cabbage & carrot salad in sweet cream dressing.",
    prepTime: "5 mins",
    image: DEFAULT_FOOD_IMAGES["coleslaw"],
  },
  {
    id: "chilled-zobo-special",
    slug: "chilled-zobo-special",
    name: "Chilled Zobo Special",
    category: "Drinks",
    backendCategory: "Drink",
    price: 1000,
    desc: "Homemade hibiscus drink brewed with fresh pineapple, ginger, and cloves.",
    prepTime: "3 mins",
    image: DEFAULT_FOOD_IMAGES["chilled-zobo-special"],
    isPopular: true,
  },
  {
    id: "bottled-water",
    slug: "bottled-water",
    name: "Bottled Water",
    category: "Drinks",
    backendCategory: "Drink",
    price: 300,
    desc: "Chilled 75cl spring table water.",
    prepTime: "2 mins",
    image: DEFAULT_FOOD_IMAGES["bottled-water"],
  },
  {
    id: "thermal-takeaway-pack",
    slug: "thermal-takeaway-pack",
    name: "Thermal Takeaway Pack",
    category: "Extras",
    backendCategory: "Packaging",
    price: 300,
    desc: "Insulated sealed microwave-safe takeaway food pack.",
    prepTime: "2 mins",
    image: DEFAULT_FOOD_IMAGES["thermal-takeaway-pack"],
  },
];

// Authoritative Complimentary Soups (₦0 each with any Swallow)
export const SOUP_OPTIONS: AddonCatalogItem[] = [
  { id: "egusi-soup", slug: "egusi-soup", name: "Egusi Soup", price: 0 },
  { id: "efo-riro", slug: "efo-riro", name: "Efo Riro", price: 0 },
  { id: "afang-soup", slug: "afang-soup", name: "Afang Soup", price: 0 },
  { id: "edikaikong-soup", slug: "edikaikong-soup", name: "Edikaikong Soup", price: 0 },
  { id: "ogbono-soup", slug: "ogbono-soup", name: "Ogbono Soup", price: 0 },
  { id: "ewedu-soup", slug: "ewedu-soup", name: "Ewedu", price: 0 },
  { id: "gbegiri-soup", slug: "gbegiri-soup", name: "Gbegiri", price: 0 },
];

export const PROTEIN_ADDONS: AddonCatalogItem[] = [
  { id: "crispy-grilled-turkey", slug: "crispy-grilled-turkey", name: "Crispy Grilled Turkey", price: 4000 },
  { id: "peppered-chicken", slug: "peppered-chicken", name: "Peppered Chicken", price: 3000 },
  { id: "croaker-fish", slug: "croaker-fish", name: "Croaker Fish", price: 3000 },
  { id: "titus-fish", slug: "titus-fish", name: "Titus Fish", price: 2000 },
  { id: "goat-meat", slug: "goat-meat", name: "Goat Meat", price: 1500 },
  { id: "assorted-meat", slug: "assorted-meat", name: "Assorted Meat", price: 1500 },
  { id: "beef", slug: "beef", name: "Beef", price: 500 },
  { id: "ponmo", slug: "ponmo", name: "Ponmo", price: 500 },
  { id: "boiled-egg", slug: "boiled-egg", name: "Boiled Egg", price: 500 },
];

export const SIDE_ADDONS: AddonCatalogItem[] = [
  { id: "fried-plantain-dodo", slug: "fried-plantain-dodo", name: "Fried Plantain (Dodo)", price: 500 },
  { id: "coleslaw", slug: "coleslaw", name: "Coleslaw", price: 500 },
];

export const DRINK_ADDONS: AddonCatalogItem[] = [
  { id: "chilled-zobo-special", slug: "chilled-zobo-special", name: "Chilled Zobo Special", price: 1000 },
  { id: "bottled-water", slug: "bottled-water", name: "Bottled Water", price: 300 },
];

export const PACKAGING_ADDON: AddonCatalogItem = {
  id: "thermal-takeaway-pack",
  slug: "thermal-takeaway-pack",
  name: "Thermal Takeaway Pack",
  price: 300,
};
