"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data.session) {
        setMessage("Sign in successful! Checking account details...");
        
        const { data: dbUser } = await supabase
          .from("user")
          .select("*")
          .eq("id", data.session.user.id)
          .single();

        if (dbUser) {
          setMessage("Welcome back! Redirecting to feed...");
          setTimeout(() => router.push("/"), 1000);
        } else {
          setMessage("Account verification completed. Setting up your profile...");
          setTimeout(() => router.push("/"), 1000);
        }
      }
    } catch (err) {
      setMessage("Error: Unable to connect to Supabase Auth.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setMessage(`Error: ${err.message || "Unable to connect to Google."}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white md:bg-neutral-warm px-6 py-12">
      <div className="w-full max-w-[420px] animate-fade-in">
        <div className="text-center mb-10">
           <Link href="/" className="inline-flex items-center space-x-2 group cursor-pointer">
              <div className="h-10 w-10 shrink-0 rounded-full bg-brand-green flex items-center justify-center text-white font-bold transition-transform group-hover:rotate-12 shadow-sm">C</div>
              <span className="text-2xl font-bold text-brand-green uppercase tracking-[0.2em]">Curio</span>
           </Link>
        </div>

        <Card className="border-none shadow-none md:shadow-2xl md:border md:border-ceramic/50 rounded-[24px]">
          <CardContent className="p-0 md:p-10">
            <h1 className="text-2xl font-bold text-text-black text-center mb-2 tracking-tight">Log in to your account</h1>
            <p className="text-sm text-text-black-soft text-center mb-8">Welcome back! Please enter your details.</p>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              isDisabled={loading}
              variant="outline"
              className="w-full h-14 text-base font-semibold border-ceramic text-text-black hover:bg-neutral-warm/50 flex items-center justify-center gap-3 mb-6"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative flex items-center py-5">
              <div className="flex-grow border-t border-ceramic"></div>
              <span className="flex-shrink-0 mx-4 text-text-black-soft text-sm">or log in with email</span>
              <div className="flex-grow border-t border-ceramic"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-text-black">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-ceramic rounded-xl focus:ring-1 focus:ring-brand-green focus:border-brand-green outline-none text-text-black text-sm transition-all"
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-text-black">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-ceramic rounded-xl focus:ring-1 focus:ring-brand-green focus:border-brand-green outline-none text-text-black text-sm transition-all"
                  required
                />
              </div>
              
              <Button
                type="submit"
                variant="primary"
                className="w-full h-14 text-base font-bold shadow-lg shadow-brand-green/20"
                isDisabled={loading}
              >
                {loading ? "Signing in..." : "Log In"}
              </Button>
            </form>

            {message && (
              <div className={cn(
                "p-4 mt-6 rounded-xl text-sm font-medium text-center animate-spring",
                message.startsWith("Error") ? "bg-red-50 text-red-600 border border-red-100" : "bg-brand-green/10 text-brand-green border border-brand-green/20"
              )}>
                {message}
              </div>
            )}

            <div className="mt-8 text-center">
               <p className="text-sm text-text-black-soft">
                 Don&apos;t have an account?{' '}
                 <Link href="/signup" className="text-brand-green font-bold hover:underline">
                   Sign up
                 </Link>
               </p>
            </div>
            
            <p className="mt-8 text-center text-xs text-text-black-soft/60 px-6 leading-relaxed">
              By continuing, you agree to Curio&apos;s <a href="#" className="underline hover:text-brand-green">Terms of Service</a> and <a href="#" className="underline hover:text-brand-green">Privacy Policy</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

