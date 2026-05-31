"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Button, 
  Input, 
  Dropdown, 
  DropdownTrigger, 
  DropdownPopover,
  DropdownMenu, 
  DropdownItem
} from "@heroui/react";

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  showSearch?: boolean;
}

export function Header({ searchQuery = "", setSearchQuery, showSearch = true }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        
        // Load User Profile
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  };

  const handleSearchSubmit = (val: string) => {
    if (setSearchQuery) {
      setSearchQuery(val);
    } else {
      router.push(`/?q=${encodeURIComponent(val)}`);
    }
  };

  const sellPath = user ? "/sell" : "/signup";

  return (
    <nav className="sticky top-0 z-50 flex h-[72px] items-center justify-between bg-white px-6 md:px-10 border-b border-ceramic shadow-sm">
      <div className="flex items-center flex-1 mr-8">
        <Link href="/" className="flex items-center space-x-2 mr-10 cursor-pointer">
          <div className="h-8 w-8 shrink-0 rounded-full bg-brand-green flex items-center justify-center text-white font-bold">C</div>
          <span className="text-xl font-bold text-brand-green uppercase tracking-wider hidden sm:block">Curio</span>
        </Link>

        {showSearch && (
          <div className="relative flex-1 max-w-xl group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-black-soft group-focus-within:text-brand-green transition-colors z-10 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search for items, brands, or styles..."
              value={searchQuery}
              onChange={(e) => handleSearchSubmit(e.target.value)}
              className="w-full h-10 bg-ceramic/40 hover:bg-ceramic/60 focus:bg-white rounded-full pl-11 pr-5 text-xs font-semibold text-text-black transition-all outline-none border border-ceramic/60 focus:border-brand-green/45 focus:ring-1 focus:ring-brand-green/30 shadow-inner"
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <Dropdown>
            <DropdownTrigger>
              <div className="h-9 w-9 rounded-full bg-brand-green/10 flex items-center justify-center text-xs font-bold text-brand-green border border-brand-green/20 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                {profile?.name ? profile.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
              </div>
            </DropdownTrigger>
            <DropdownPopover placement="bottom end" className="w-52 bg-white rounded-2xl shadow-xl border border-ceramic p-1 overflow-hidden z-50">
              <DropdownMenu aria-label="Profile Actions" className="outline-none">
                <DropdownItem key="profile" id="profile" onAction={() => router.push("/profile")} className="block px-4 py-2 text-sm font-bold text-text-black hover:bg-neutral-warm rounded-xl cursor-pointer">
                  Profile Settings
                </DropdownItem>
                <DropdownItem key="orders" id="orders" onAction={() => router.push("/profile?tab=orders")} className="block px-4 py-2 text-sm font-bold text-text-black hover:bg-neutral-warm rounded-xl cursor-pointer">
                  My Orders
                </DropdownItem>
                <DropdownItem key="listings" id="listings" onAction={() => router.push("/profile?tab=listings")} className="block px-4 py-2 text-sm font-bold text-text-black hover:bg-neutral-warm rounded-xl cursor-pointer">
                  My Listings
                </DropdownItem>
                <DropdownItem key="favorites" id="favorites" onAction={() => router.push("/profile?tab=favorites")} className="block px-4 py-2 text-sm font-bold text-text-black hover:bg-neutral-warm rounded-xl cursor-pointer">
                  Favorites
                </DropdownItem>
                <DropdownItem key="logout" id="logout" className="block px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer" onAction={handleSignOut}>
                  Sign Out
                </DropdownItem>
              </DropdownMenu>
            </DropdownPopover>
          </Dropdown>
          ) : (
            <>
              <div className="hidden sm:block">
                <Link href="/login">
                  <Button 
                    variant="outline" 
                    className="border-2 border-ceramic hover:border-brand-green/30 bg-white hover:bg-neutral-warm/20 text-text-black font-extrabold rounded-full px-5 h-[38px] text-xs shadow-sm hover:shadow transition-all duration-300 cursor-pointer"
                  >
                    Sign up | Log in
                  </Button>
                </Link>
              </div>
              <div className="block sm:hidden">
                <Link href="/login">
                  <div className="h-9 w-9 rounded-full border-2 border-ceramic flex items-center justify-center text-text-black-soft bg-white hover:bg-neutral-warm/20 active:scale-95 transition-all cursor-pointer shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                </Link>
              </div>
            </>
          )}

          <div className="hidden sm:block">
            <Link href={sellPath}>
              <Button 
                className="bg-brand-green hover:bg-accent-green text-white font-extrabold rounded-full px-6 h-[38px] text-xs shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-none cursor-pointer shrink-0"
              >
                Sell
              </Button>
            </Link>
          </div>
      </div>
    </nav>
  );
}
