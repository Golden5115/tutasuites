export interface MenuItem {
  id: string
  name: string
  category: "Rice" | "Swallow & Soup" | "Proteins" | "Sides & Shawarma" | "Drinks" | "Extras"
  price: number
  desc: string
  prepTime: string
  image: string
  isPopular?: boolean
}

export const MENU_ITEMS: MenuItem[] = [
  // Rice Dishes
  {
    id: "rice-jollof",
    name: "Smokey Jollof Rice",
    category: "Rice",
    price: 500,
    desc: "Signature firewood-smoked long-grain jollof rice seasoned with traditional spices.",
    prepTime: "5 - 10 mins",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "rice-fried",
    name: "Golden Fried Rice",
    category: "Rice",
    price: 500,
    desc: "Fluffy wok-tossed seasoned rice with sweet corn, carrots, liver bits, and spring onions.",
    prepTime: "5 - 10 mins",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "rice-native",
    name: "Native Village Rice",
    category: "Rice",
    price: 700,
    desc: "Aromatic palm oil jollof rice cooked with smoked fish, crayfish, scent leaf, and dry pepper.",
    prepTime: "5 - 10 mins",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "rice-white",
    name: "Steamed White Rice",
    category: "Rice",
    price: 500,
    desc: "Perfect fluffy white rice ready to pair with rich chicken, beef, or vegetable stew.",
    prepTime: "5 mins",
    image: "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&auto=format&fit=crop",
  },

  // Swallow & Soup
  {
    id: "swallow-eba",
    name: "Smooth Yellow Eba",
    category: "Swallow & Soup",
    price: 500,
    desc: "Steaming hot, lump-free cassava swallow. Served with your choice of Egusi or Efo Riro.",
    prepTime: "5 - 10 mins",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "swallow-semo",
    name: "Piping Hot Semo",
    category: "Swallow & Soup",
    price: 500,
    desc: "Silky, well-stirred semovita swallow. Paired with rich Egusi soup or savory Efo Riro.",
    prepTime: "5 - 10 mins",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop",
  },
  {
    id: "swallow-poundo",
    name: "Poundo Yam Portion",
    category: "Swallow & Soup",
    price: 700,
    desc: "Fluffy, premium pounded yam portion served with our signature savory vegetable or melon soup.",
    prepTime: "5 - 10 mins",
    image: "https://images.unsplash.com/photo-1514944298352-7e181e1a5349?w=600&auto=format&fit=crop",
    isPopular: true,
  },

  // Proteins
  {
    id: "prot-turkey",
    name: "Crispy Grilled Turkey",
    category: "Proteins",
    price: 4000,
    desc: "Generous succulent turkey portion marinated in spicy scotch bonnet marinade and grilled golden.",
    prepTime: "5 - 10 mins",
    image: "https://images.unsplash.com/photo-1527477378408-1bc43f07a4e9?w=600&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "prot-chicken",
    name: "Peppered Chicken",
    category: "Proteins",
    price: 3000,
    desc: "Tender fried chicken quarter tossed in rich Nigerian peppered onion sauce.",
    prepTime: "5 - 10 mins",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "prot-fish",
    name: "Seasoned Fried Fish",
    category: "Proteins",
    price: 1500,
    desc: "Fresh, deep-fried seasoned fish steak with crispy skin and juicy center.",
    prepTime: "5 mins",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop",
  },
  {
    id: "prot-goat",
    name: "Tender Goat Meat",
    category: "Proteins",
    price: 1000,
    desc: "Chewy, well-seasoned peppery goat meat chunk cooked until fork tender.",
    prepTime: "5 mins",
    image: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "prot-beef",
    name: "Spiced Beef Chunk",
    category: "Proteins",
    price: 500,
    desc: "Traditional seasoned beef chunk simmered in peppery beef stock.",
    prepTime: "5 mins",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop",
  },
  {
    id: "prot-egg",
    name: "Boiled / Fried Egg",
    category: "Proteins",
    price: 500,
    desc: "Fresh egg prepared boiled or lightly pan-fried to complement your rice.",
    prepTime: "5 mins",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop",
  },

  // Sides & Shawarma
  {
    id: "side-shawarma",
    name: "Tuta Special Shawarma",
    category: "Sides & Shawarma",
    price: 2500,
    desc: "Juicy, double-wrapped chicken or beef shawarma stuffed with sausages, fresh cabbage, and creamy sauce.",
    prepTime: "10 - 15 mins",
    image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "side-plantain",
    name: "Sweet Fried Plantain (Dodo)",
    category: "Sides & Shawarma",
    price: 500,
    desc: "Sweet, caramelised golden ripe plantain cuts fried to perfection.",
    prepTime: "5 mins",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "side-salad",
    name: "Fresh Veggie Salad",
    category: "Sides & Shawarma",
    price: 500,
    desc: "Crisp shredded lettuce, cabbage, sweet corn, and carrots with salad cream dressing.",
    prepTime: "5 mins",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop",
  },

  // Drinks
  {
    id: "dr-zobo",
    name: "Chilled Zobo Special",
    category: "Drinks",
    price: 1000,
    desc: "Pure hibiscus drink infused with fresh ginger, pineapple chunks, and cloves. Ultra refreshing.",
    prepTime: "2 mins",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "dr-juice",
    name: "Chilled Fruit Juice",
    category: "Drinks",
    price: 1500,
    desc: "Ice-cold premium packaged fruit nectar (Orange / Apple / Exotic blend).",
    prepTime: "2 mins",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&auto=format&fit=crop",
  },
  {
    id: "dr-coke",
    name: "Coca-Cola 50cl",
    category: "Drinks",
    price: 500,
    desc: "Classic ice-cold Coca-Cola bottle/can.",
    prepTime: "2 mins",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop",
  },
  {
    id: "dr-sprite",
    name: "Sprite 50cl",
    category: "Drinks",
    price: 500,
    desc: "Crisp, cold lemon-lime soda.",
    prepTime: "2 mins",
    image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&auto=format&fit=crop",
  },
  {
    id: "dr-water-300",
    name: "Chilled Table Water 75cl",
    category: "Drinks",
    price: 300,
    desc: "Cold bottled spring water.",
    prepTime: "2 mins",
    image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop",
  },

  // Extras
  {
    id: "extra-takeaway",
    name: "Take Away Pack",
    category: "Extras",
    price: 300,
    desc: "Heavy-duty hygienic food pack with cutlery and paper serviette.",
    prepTime: "Instant",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "extra-water-200",
    name: "Dispenser Water Cup",
    category: "Extras",
    price: 200,
    desc: "Sealed pure drinking water portion.",
    prepTime: "Instant",
    image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop",
  },
]

// Addon groups for plate building / meal customizer
export const SOUP_OPTIONS = [
  { id: "soup-egusi", name: "Egusi Soup", price: 0 },
  { id: "soup-efo", name: "Efo Riro (Vegetable)", price: 0 },
]

export const PROTEIN_ADDONS = [
  { id: "prot-turkey", name: "Crispy Grilled Turkey", price: 4000 },
  { id: "prot-chicken", name: "Peppered Chicken", price: 3000 },
  { id: "prot-fish", name: "Fried Fish", price: 1500 },
  { id: "prot-goat", name: "Goat Meat Chunk", price: 1000 },
  { id: "prot-beef", name: "Seasoned Beef", price: 500 },
  { id: "prot-egg", name: "Boiled / Fried Egg", price: 500 },
]

export const SIDE_ADDONS = [
  { id: "side-shawarma", name: "Special Shawarma", price: 2500 },
  { id: "side-plantain", name: "Fried Plantain (Dodo)", price: 500 },
  { id: "side-salad", name: "Fresh Salad", price: 500 },
]

export const DRINK_ADDONS = [
  { id: "dr-zobo", name: "Chilled Zobo", price: 1000 },
  { id: "dr-juice", name: "Fruit Juice", price: 1500 },
  { id: "dr-coke", name: "Coke 50cl", price: 500 },
  { id: "dr-sprite", name: "Sprite 50cl", price: 500 },
  { id: "dr-water", name: "Water 75cl", price: 300 },
]

export const PACKAGING_ADDON = {
  id: "extra-takeaway",
  name: "Take Away Pack",
  price: 300,
}
