export const dictionaries = {
  en: {
    header: {
      searchPlaceholder: "Search for items, brands, or styles...",
      sell: "Sell",
      login: "Log in",
      signup: "Sign up",
    },
    waitlist: {
      howItWorks: "How it works",
      heroTitle: "Buy. Sell. Browse.\nShop curated pre-loved items with ease.",
      heroSubtitle: "Zero fees. High aesthetic. Join the exclusive waitlist today.",
      joinWaitlist: "Join Exclusive Waitlist",
      comingSoon: "Coming Soon",
    }
  },
  ur: {
    header: {
      searchPlaceholder: "اشیاء، برانڈز، یا اسٹائلز تلاش کریں...",
      sell: "بیچیں",
      login: "لاگ ان کریں",
      signup: "سائن اپ کریں",
    },
    waitlist: {
      howItWorks: "یہ کیسے کام کرتا ہے",
      heroTitle: "خریدیں۔ بیچیں۔ براؤز کریں۔\nبہترین پری-لوڈ اشیاء آسانی سے خریدیں۔",
      heroSubtitle: "کوئی فیس نہیں۔ بہترین جمالیات۔ آج ہی خصوصی ویٹ لسٹ میں شامل ہوں۔",
      joinWaitlist: "خصوصی ویٹ لسٹ میں شامل ہوں",
      comingSoon: "جلد آ رہا ہے",
    }
  }
};

export type Locale = keyof typeof dictionaries;
export type DictionaryPath = string; // In a full app, we'd strongly type the dot notation paths.

// Helper to get nested value by dot notation (e.g. "header.sell")
export function getNestedTranslation(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || path;
}
