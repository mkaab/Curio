"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@curio/ui";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage("Check your phone for the verification code!");
      }
    } catch (err) {
      setMessage("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-warm px-6 py-12">
      <div className="w-full max-w-[480px] space-y-8 animate-fade-in">
        <div className="text-center">
           <Link href="/" className="inline-flex items-center space-x-2 group mb-8">
              <div className="h-10 w-10 rounded-full bg-brand-green flex items-center justify-center text-white font-bold transition-transform group-hover:rotate-12">C</div>
              <span className="text-2xl font-bold text-brand-green uppercase tracking-[0.2em]">Curio</span>
           </Link>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader className="space-y-4 pt-10 pb-8 px-10 text-center">
            <CardTitle className="text-4xl font-bold text-brand-green tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-lg text-text-black-soft leading-relaxed">
              Sign in to your Curio account with your phone number.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-12">
            <form onSubmit={handleLogin} className="space-y-8">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+92 300 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-16"
              />
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full h-16 text-lg shadow-lg shadow-accent-green/20"
                disabled={loading}
              >
                {loading ? "Sending Code..." : "Continue"}
              </Button>

              {message && (
                <div className={cn(
                  "p-4 rounded-lg text-sm font-medium text-center animate-spring",
                  message.startsWith("Error") ? "bg-red-50 text-red-600 border border-red-100" : "bg-accent-green/10 text-brand-green border border-accent-green/20"
                )}>
                  {message}
                </div>
              )}
            </form>

            <div className="mt-10 pt-10 border-t border-ceramic text-center">
               <p className="text-sm text-text-black-soft mb-4">New to Curio?</p>
               <Link href="/signup">
                 <Button variant="dark-outline" className="w-full h-14">Create an account</Button>
               </Link>
            </div>
            
            <p className="mt-8 text-center text-[10px] uppercase tracking-widest text-text-black-soft/60 px-6 leading-relaxed">
              By continuing, you agree to Curio&apos;s <a href="#" className="underline hover:text-brand-green">Terms of Service</a> and <a href="#" className="underline hover:text-brand-green">Privacy Policy</a>.
            </p>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-text-black-soft">
           <Link href="/" className="hover:text-brand-green transition-colors">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}

// Helper for local usage if @curio/ui doesn't export cn directly to this context in some setups
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
