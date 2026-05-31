export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  level: 1 | 2 | 3;
}

export const CATEGORIES: Category[] = [
  // Level 1: Audience
  { id: "1", name: "Women", slug: "women", level: 1 },
  { id: "2", name: "Men", slug: "men", level: 1 },
  { id: "3", name: "Kids", slug: "kids", level: 1 },
  { id: "4", name: "Home", slug: "home", level: 1 },

  // Level 2: Departments (Women)
  { id: "10", name: "Clothing", slug: "women-clothing", parentId: "1", level: 2 },
  { id: "11", name: "Shoes", slug: "women-shoes", parentId: "1", level: 2 },
  { id: "12", name: "Accessories", slug: "women-accessories", parentId: "1", level: 2 },

  // Level 3: Types (Women Clothing)
  { id: "100", name: "Dresses", slug: "women-dresses", parentId: "10", level: 3 },
  { id: "101", name: "Tops & T-Shirts", slug: "women-tops", parentId: "10", level: 3 },
  { id: "102", name: "Outerwear", slug: "women-outerwear", parentId: "10", level: 3 },
  { id: "103", name: "Pants & Leggings", slug: "women-pants", parentId: "10", level: 3 },
  { id: "104", name: "Skirts", slug: "women-skirts", parentId: "10", level: 3 },
  { id: "105", name: "Knitwear & Sweaters", slug: "women-sweaters", parentId: "10", level: 3 },
  { id: "106", name: "Activewear", slug: "women-activewear", parentId: "10", level: 3 },
  { id: "107", name: "Traditional & Ethnic", slug: "women-traditional", parentId: "10", level: 3 },

  // Level 3: Types (Women Shoes)
  { id: "110", name: "Boots", slug: "women-boots", parentId: "11", level: 3 },
  { id: "111", name: "Heels", slug: "women-heels", parentId: "11", level: 3 },
  { id: "112", name: "Sneakers", slug: "women-sneakers", parentId: "11", level: 3 },
  { id: "113", name: "Flats & Sandals", slug: "women-sandals", parentId: "11", level: 3 },

  // Level 3: Types (Women Accessories)
  { id: "120", name: "Bags & Purses", slug: "women-bags", parentId: "12", level: 3 },
  { id: "121", name: "Jewelry", slug: "women-jewelry", parentId: "12", level: 3 },
  { id: "122", name: "Scarves & Shawls", slug: "women-scarves", parentId: "12", level: 3 },
  { id: "123", name: "Sunglasses", slug: "women-sunglasses", parentId: "12", level: 3 },

  // Level 2: Departments (Men)
  { id: "20", name: "Clothing", slug: "men-clothing", parentId: "2", level: 2 },
  { id: "21", name: "Shoes", slug: "men-shoes", parentId: "2", level: 2 },
  { id: "22", name: "Accessories", slug: "men-accessories", parentId: "2", level: 2 },

  // Level 3: Types (Men Clothing)
  { id: "200", name: "Shirts", slug: "men-shirts", parentId: "20", level: 3 },
  { id: "201", name: "T-Shirts & Polos", slug: "men-tshirts-polos", parentId: "20", level: 3 },
  { id: "202", name: "Outerwear", slug: "men-outerwear", parentId: "20", level: 3 },
  { id: "203", name: "Jeans & Pants", slug: "men-jeans-pants", parentId: "20", level: 3 },
  { id: "204", name: "Knitwear & Sweaters", slug: "men-sweaters", parentId: "20", level: 3 },
  { id: "205", name: "Suits & Blazers", slug: "men-suits", parentId: "20", level: 3 },
  { id: "206", name: "Traditional & Eastern", slug: "men-traditional", parentId: "20", level: 3 },

  // Level 3: Types (Men Shoes)
  { id: "210", name: "Boots", slug: "men-boots", parentId: "21", level: 3 },
  { id: "211", name: "Loafers & Formal", slug: "men-formal-shoes", parentId: "21", level: 3 },
  { id: "212", name: "Sneakers & Joggers", slug: "men-sneakers", parentId: "21", level: 3 },
  { id: "213", name: "Sandals & Slippers", slug: "men-sandals", parentId: "21", level: 3 },

  // Level 3: Types (Men Accessories)
  { id: "220", name: "Watches", slug: "men-watches", parentId: "22", level: 3 },
  { id: "221", name: "Belts", slug: "men-belts", parentId: "22", level: 3 },
  { id: "222", name: "Wallets", slug: "men-wallets", parentId: "22", level: 3 },
  { id: "223", name: "Sunglasses", slug: "men-sunglasses", parentId: "22", level: 3 },

  // Level 2: Departments (Kids)
  { id: "30", name: "Boys Clothing", slug: "kids-boys", parentId: "3", level: 2 },
  { id: "31", name: "Girls Clothing", slug: "kids-girls", parentId: "3", level: 2 },
  { id: "32", name: "Baby & Toddler", slug: "kids-baby", parentId: "3", level: 2 },

  // Level 3: Types (Kids Boys)
  { id: "300", name: "T-Shirts & Tops", slug: "boys-tops", parentId: "30", level: 3 },
  { id: "301", name: "Pants & Shorts", slug: "boys-pants", parentId: "30", level: 3 },

  // Level 3: Types (Kids Girls)
  { id: "310", name: "Dresses & Skirts", slug: "girls-dresses", parentId: "31", level: 3 },
  { id: "311", name: "Tops & Tees", slug: "girls-tops", parentId: "31", level: 3 },

  // Level 3: Types (Kids Baby)
  { id: "320", name: "Onesies & Rompers", slug: "baby-onesies", parentId: "32", level: 3 },

  // Level 2: Departments (Home)
  { id: "40", name: "Home Decor", slug: "home-decor", parentId: "4", level: 2 },
  { id: "41", name: "Kitchen & Dining", slug: "home-kitchen", parentId: "4", level: 2 },

  // Level 3: Types (Home Decor)
  { id: "400", name: "Candles & Cushions", slug: "decor-candles-cushions", parentId: "40", level: 3 },

  // Level 3: Types (Home Kitchen)
  { id: "410", name: "Mugs & Cups", slug: "kitchen-mugs-cups", parentId: "41", level: 3 },
];

export const getChildCategories = (parentId: string) => {
  return CATEGORIES.filter(c => c.parentId === parentId);
};

export const getCategoryPath = (categoryId: string): Category[] => {
  const path: Category[] = [];
  let current = CATEGORIES.find(c => c.id === categoryId);
  while (current) {
    path.unshift(current);
    current = CATEGORIES.find(c => c.id === current?.parentId);
  }
  return path;
};
