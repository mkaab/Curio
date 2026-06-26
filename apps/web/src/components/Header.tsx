"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [localQuery, setLocalQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: prof } = await supabase
          .from("user_profile")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (prof) setProfile(prof);
      }
    }
    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

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
        <Link href="/" className="flex items-center space-x-2 mr-4 md:mr-10 cursor-pointer">
          <div className="h-8 w-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">C</div>
          <span className="text-xl font-serif font-bold text-primary uppercase tracking-wider hidden sm:block">Curio</span>
        </Link>

        {showSearch && (
          <div className="relative flex-1 max-w-xl group" ref={suggestionRef}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-tint group-focus-within:text-primary transition-colors z-10 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search for items, brands, or styles..."
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
                  Sell now
                </DropdownItem>
                {user ? (
                   <DropdownItem key="profile" onAction={() => router.push("/profile")} className="font-bold border-b border-surface-container/40 pb-3 mb-2">My Profile</DropdownItem>
                ) : (
                   <DropdownItem key="login" onAction={() => router.push("/login")} className="font-bold border-b border-surface-container/40 pb-3 mb-2">Sign up | Log in</DropdownItem>
                )}
                <DropdownItem key="women" className="font-semibold py-1.5" onAction={() => handleSearchSubmit("", "Women")}>Women</DropdownItem>
                <DropdownItem key="men" className="font-semibold py-1.5" onAction={() => handleSearchSubmit("", "Men")}>Men</DropdownItem>
                <DropdownItem key="kids" className="font-semibold py-1.5" onAction={() => handleSearchSubmit("", "Kids")}>Kids</DropdownItem>
                <DropdownItem key="home" className="font-semibold py-1.5" onAction={() => handleSearchSubmit("", "Home")}>Home</DropdownItem>
              </DropdownMenu>
            </DropdownPopover>
          </Dropdown>
        </div>

        {user ? (
          <div className="hidden sm:block">
            <Dropdown>
              <DropdownTrigger>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/20 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                {profile?.name ? profile.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
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
                  Sign up | Log in
                </Button>
              </Link>
            </div>
          )}

          <div className="hidden sm:block">
            <Link href={sellPath}>
              <Button 
                className="bg-primary hover:bg-primary-container text-on-primary font-extrabold rounded-full px-6 h-[38px] text-xs shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-none cursor-pointer shrink-0"
              >
                Sell
              </Button>
            </Link>
          </div>
      </div>
    </nav>
  );
}
