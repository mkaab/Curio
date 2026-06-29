import { cookies } from "next/headers";
import { dictionaries, Locale, getNestedTranslation } from "./dictionaries";

export async function getServerTranslation() {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("curio_locale")?.value as Locale;
  const locale: Locale = (savedLocale === "en" || savedLocale === "ur") ? savedLocale : "en";
  
  const t = (path: string) => {
    const dict = dictionaries[locale];
    return getNestedTranslation(dict, path);
  };

  return { t, locale };
}
