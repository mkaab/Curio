"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Bell } from "lucide-react";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { 
  Button, 
  Dropdown, 
  DropdownTrigger, 
  DropdownPopover,
  DropdownMenu, 
  DropdownItem
} from "@heroui/react";

interface HeaderProps {
  initialQuery?: string;
  showSearch?: boolean;
}

export function Header({ initialQuery = "", showSearch = true }: HeaderProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [localQuery, setLocalQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from("notification")
      .select("*")
      .eq("user_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  };

  const handleMarkAsRead = async (notif: any) => {
    await supabase.from("notification").update({ is_read: true }).eq("id", notif.id);
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    if (notif.link) {
      router.push(notif.link);
    }
  };

  useEffect(() => {
    setLocalQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: prof } = await supabase
          .from("user")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (prof) setProfile(prof);
        
        fetchNotifications(session.user.id);
      }
    }
    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        if (session) {
          setUser(session.user);
          fetchNotifications(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setNotifications([]);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const handleProfileUpdate = async () => {
      if (user?.id) {
        const { data } = await supabase.from("user").select("*").eq("id", user.id).single();
        if (data) setProfile(data);
      }
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [user, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  };

  const handleSearchSubmit = (query: string, category?: string) => {
    setIsFocused(false);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category && category !== "All") params.set("category", category);
    
    // Redirect to search page with params
    router.push(`/search?${params.toString()}`);
  };

  const sellPath = user ? "/sell" : "/signup";

  return (
    <nav className="sticky top-0 z-50 flex h-[72px] items-center justify-between bg-white px-6 md:px-10 border-b border-surface-container shadow-sm">
      <div className="flex items-center flex-1 mr-4 md:mr-8">
        <Logo className="text-xl hidden sm:flex mr-4 md:mr-10" />

        {showSearch && (
          <div className="relative flex-1 max-w-xl group" ref={suggestionRef}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-tint group-focus-within:text-primary transition-colors z-10 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <input
              type="text"
              placeholder={t("header.searchPlaceholder")}
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchSubmit(localQuery);
              }}
              className="w-full h-10 bg-surface-container/40 hover:bg-surface-container/60 focus:bg-surface-dim rounded-full pl-11 pr-5 text-xs font-semibold text-on-surface transition-all outline-none border border-surface-container/60 focus:border-primary/45 focus:ring-1 focus:ring-primary/30 shadow-inner"
            />
            
            {/* Vinted-style Generic Autocomplete */}
            {isFocused && localQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-surface-container py-2 z-50 overflow-hidden animate-slide-in">
                <div 
                  className="px-4 py-3 hover:bg-surface-dim cursor-pointer text-sm font-medium text-on-surface"
                  onClick={() => handleSearchSubmit(localQuery)}
                >
                  Search for <span className="font-bold">"{localQuery}"</span>
                </div>
                <div className="h-px bg-surface-container/50 my-1 mx-4" />
                {["Women", "Men", "Kids", "Home"].map(cat => (
                  <div 
                    key={cat}
                    className="px-4 py-2.5 hover:bg-surface-dim cursor-pointer text-sm text-surface-tint flex items-center justify-between transition-colors"
                    onClick={() => handleSearchSubmit(localQuery, cat)}
                  >
                    <span><span className="font-bold text-on-surface">"{localQuery}"</span> in {cat}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Mobile Hamburger */}
        <div className="block sm:hidden">
          <Dropdown>
            <DropdownTrigger>
              <div role="button" tabIndex={0} className="p-1.5 text-on-surface hover:bg-surface-container rounded-full transition-colors focus:outline-none cursor-pointer flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
              </div>
            </DropdownTrigger>
            <DropdownPopover placement="bottom end" className="w-56 bg-surface rounded-2xl shadow-2xl border border-surface-container p-2 overflow-hidden z-[100]">
              <DropdownMenu aria-label="Mobile Navigation" className="outline-none">
                <DropdownItem key="sell" className="font-extrabold text-primary mb-2 py-2" onAction={() => router.push(sellPath)}>
                  {t("header.sell")}
                </DropdownItem>
                {user ? (
                   <DropdownItem key="profile" onAction={() => router.push("/profile")} className="font-bold border-b border-surface-container/40 pb-3 mb-2">My Profile</DropdownItem>
                ) : (
                   <DropdownItem key="login" onAction={() => router.push("/login")} className="font-bold border-b border-surface-container/40 pb-3 mb-2">{t("header.signup")} | {t("header.login")}</DropdownItem>
                )}
                <DropdownItem key="women" className="font-semibold py-1.5" onAction={() => handleSearchSubmit("", "Women")}>Women</DropdownItem>
                <DropdownItem key="men" className="font-semibold py-1.5" onAction={() => handleSearchSubmit("", "Men")}>Men</DropdownItem>
                <DropdownItem key="kids" className="font-semibold py-1.5" onAction={() => handleSearchSubmit("", "Kids")}>Kids</DropdownItem>
                <DropdownItem key="home" className="font-semibold py-1.5" onAction={() => handleSearchSubmit("", "Home")}>Home</DropdownItem>
              </DropdownMenu>
            </DropdownPopover>
          </Dropdown>
        </div>

        <div className="hidden sm:block">
          <button 
            onClick={() => setLocale(locale === 'en' ? 'ur' : 'en')}
            className="font-bold text-[10px] px-3 border-2 border-surface-container rounded-full hover:bg-surface-dim transition-colors h-[38px] flex items-center justify-center cursor-pointer"
          >
            {locale === 'en' ? 'UR' : 'EN'}
          </button>
        </div>

        {user ? (
          <div className="hidden sm:flex items-center space-x-3">
            <Dropdown>
              <DropdownTrigger>
                <div className="relative h-9 w-9 rounded-full bg-surface-dim hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors border border-surface-container/50">
                  <Bell size={18} strokeWidth={2.5} />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
              </DropdownTrigger>
              <DropdownPopover placement="bottom end" className="w-80 bg-white rounded-2xl shadow-xl border border-surface-container overflow-hidden z-50">
                <div className="p-4 border-b border-surface-container/60 bg-surface-bright flex justify-between items-center">
                  <h3 className="font-bold text-primary">Notifications</h3>
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{notifications.length} unread</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-surface-tint text-sm font-medium">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleMarkAsRead(notif)}
                        className="p-4 border-b border-surface-container/30 hover:bg-surface-dim cursor-pointer transition-colors flex items-start gap-3"
                      >
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-on-surface leading-tight">{notif.message}</p>
                          <span className="text-[10px] text-surface-tint font-bold mt-1 block uppercase">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DropdownPopover>
            </Dropdown>

            <Dropdown>
              <DropdownTrigger>
                <div className="relative h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/20 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  {profile?.image ? (
                    profile.image.startsWith("data:image") ? (
                      <img src={profile.image} alt="Profile" className="object-cover w-full h-full" />
                    ) : (
                      <Image src={profile.image} alt="Profile" fill className="object-cover" />
                    )
                  ) : (
                    profile?.name ? profile.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')
                  )}
                </div>
              </DropdownTrigger>
              <DropdownPopover placement="bottom end" className="w-52 bg-white rounded-2xl shadow-xl border border-surface-container p-1 overflow-hidden z-50">
                <DropdownMenu aria-label="Profile Actions" className="outline-none">
                  <DropdownItem key="profile" id="profile" onAction={() => router.push("/profile")} className="block px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-dim rounded-xl cursor-pointer">
                    Profile Settings
                  </DropdownItem>
                  <DropdownItem key="orders" id="orders" onAction={() => router.push("/profile?tab=orders")} className="block px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-dim rounded-xl cursor-pointer">
                    My Orders
                  </DropdownItem>
                  <DropdownItem key="listings" id="listings" onAction={() => router.push("/profile?tab=listings")} className="block px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-dim rounded-xl cursor-pointer">
                    My Listings
                  </DropdownItem>
                  <DropdownItem key="favorites" id="favorites" onAction={() => router.push("/profile?tab=favorites")} className="block px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-dim rounded-xl cursor-pointer">
                    Favorites
                  </DropdownItem>
                  <DropdownItem key="logout" id="logout" className="block px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer" onAction={handleSignOut}>
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              </DropdownPopover>
            </Dropdown>
          </div>
        ) : (
          <div className="hidden sm:block">
            <Link href="/login">
              <Button 
                variant="outline" 
                className="border-2 border-surface-container hover:border-primary/30 bg-white hover:bg-surface-dim text-on-surface font-extrabold rounded-full px-5 h-[38px] text-xs shadow-sm hover:shadow transition-all duration-300 cursor-pointer"
              >
                {t("header.signup")} | {t("header.login")}
              </Button>
            </Link>
          </div>
        )}

        <div className="hidden sm:block">
          <Link href={sellPath}>
            <Button 
              className="bg-primary hover:bg-primary-container text-on-primary font-extrabold rounded-full px-6 h-[38px] text-xs shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-none cursor-pointer shrink-0"
            >
              {t("header.sell")}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
