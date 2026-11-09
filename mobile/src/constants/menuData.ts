export interface MenuItem {
  id: string
  name: string
  category: "Rice" | "Soups" | "Pepper Soup" | "Breakfast" | "Proteins" | "Drinks"
  price: number
  desc: string
  prepTime: string
  image: string
  isPopular?: boolean
  calories?: string
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "rice-1",
    name: "Special Jollof Rice & Plantain",
    category: "Rice",
    price: 2500,
    desc: "Signature firewood-smoked jollof rice served with golden sweet fried plantains.",
    prepTime: "20 - 25 mins",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "rice-2",
    name: "Classic Fried Rice",
    category: "Rice",
    price: 2750,
    desc: "Wok-tossed seasoned basmati with sweet corn, carrots, liver chunks, and bell peppers.",
    prepTime: "20 - 30 mins",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "rice-3",
    name: "Asun Fried Rice Special",
    category: "Rice",
    price: 4000,
    desc: "Spicy basmati rice tossed with tender peppery goat meat bites and spring onions.",
    prepTime: "25 - 35 mins",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "rice-4",
    name: "Village Rice (Native Jollof)",
    category: "Rice",
    price: 3500,
    desc: "Traditional palm oil jollof cooked with dried fish, crayfish, scent leaf, and dry pepper.",
    prepTime: "25 - 30 mins",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop",
  },

  // Soups & Swallow
  {
    id: "soup-1",
    name: "Egusi Soup Special & Swallow",
    category: "Soups",
    price: 2500,
    desc: "Rich melon seed soup prepared with bitter leaf, stock fish, and crayfish with hot swallow.",
    prepTime: "25 - 30 mins",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "soup-2",
    name: "Ila Alasepo (Seafood Okro)",
    category: "Soups",
    price: 2500,
    desc: "Fresh diced okro soup enriched with seafood, prawns, crabs, and aromatic spices.",
    prepTime: "20 - 25 mins",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop",
  },
  {
    id: "soup-3",
    name: "Efo Riro Special",
    category: "Soups",
    price: 2500,
    desc: "Savory Lagos-style spinach soup infused with locust beans and assorted meats.",
    prepTime: "20 - 30 mins",
    image: "https://images.unsplash.com/photo-1514944298352-7e181e1a5349?w=500&auto=format&fit=crop",
  },

  // Pepper Soup & Grills
  {
    id: "ps-1",
    name: "Point & Kill Catfish Pepper Soup",
    category: "Pepper Soup",
    price: 11000,
    desc: "Whole live catfish simmered in aromatic indigenous broth with utazi and scent leaf.",
    prepTime: "30 - 45 mins",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "ps-2",
    name: "Goat Meat Pepper Soup (Asun Broth)",
    category: "Pepper Soup",
    price: 7000,
    desc: "Tender goat meat cubes in zesty pepper broth with traditional herbal seasonings.",
    prepTime: "25 - 35 mins",
    image: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "ps-3",
    name: "Crispy Grilled Turkey Wings",
    category: "Pepper Soup",
    price: 6000,
    desc: "Large succulent turkey wing marinated in scotch bonnet glaze and fire-grilled.",
    prepTime: "20 - 30 mins",
    image: "https://images.unsplash.com/photo-1527477378408-1bc43f07a4e9?w=500&auto=format&fit=crop",
  },

  // Breakfast
  {
    id: "bf-1",
    name: "Stir-Fried Noodles & 2 Eggs",
    category: "Breakfast",
    price: 4000,
    desc: "Spicy stir-fried Indomie noodles garnished with fresh vegetables and 2 fried eggs.",
    prepTime: "15 mins",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "bf-2",
    name: "Hot Tea, Fresh Bread & Sausage",
    category: "Breakfast",
    price: 3000,
    desc: "Warm bread with eggs, sausages, and your choice of hot coffee or chocolate tea.",
    prepTime: "15 mins",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500&auto=format&fit=crop",
  },

  // Drinks
  {
    id: "dr-1",
    name: "Tuta Signature Chapman",
    category: "Drinks",
    price: 3000,
    desc: "Iconic Nigerian mocktail/cocktail with cucumber slices, lime, and Angostura bitters.",
    prepTime: "5 mins",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop",
    isPopular: true,
  },
  {
    id: "dr-2",
    name: "Chilled Heineken Premium",
    category: "Drinks",
    price: 2000,
    desc: "Ice-cold premium bottled beer delivered in insulated packaging.",
    prepTime: "5 mins",
    image: "https://images.unsplash.com/photo-1608270199042-498c47d7f7e9?w=500&auto=format&fit=crop",
  },
]

export const PROTEIN_ADDONS = [
  { id: "prot-1", name: "Grilled Chicken", price: 4000 },
  { id: "prot-2", name: "Crispy Turkey", price: 6000 },
  { id: "prot-3", name: "Croaker Fish", price: 5000 },
  { id: "prot-4", name: "Tender Beef (2 pcs)", price: 2000 },
  { id: "prot-5", name: "Fried Egg (1 pc)", price: 1000 },
]

export const SIDE_ADDONS = [
  { id: "side-1", name: "Fried Plantain (Dodo)", price: 1000 },
  { id: "side-2", name: "Steamed Moi Moi", price: 2000 },
  { id: "side-3", name: "Coleslaw Salad", price: 1000 },
  { id: "side-4", name: "Extra Pepper Sauce", price: 500 },
]
