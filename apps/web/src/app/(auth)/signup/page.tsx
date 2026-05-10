"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@curio/ui";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // In a real flow, we would register the user in Supabase Auth
      // and then create a profile in the 'profiles' table.
      // For now, we simulate the OTP send.
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage("Verification code sent! Redirecting to setup...");
        setTimeout(() => {
          router.push("/onboarding");
        }, 1000);
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
            <CardTitle className="text-4xl font-bold text-brand-green tracking-tight">Join Curio</CardTitle>
            <CardDescription className="text-lg text-text-black-soft leading-relaxed">
              Create an account to start buying and selling curated fashion.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-12">
            <form onSubmit={handleSignup} className="space-y-6">
              <Input
                label="Full Name"
                type="text"
                placeholder="Andrej Karpathy"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-16"
              />
              <Input
                label="Username"
                type="text"
                placeholder="andrej_k"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-16"
              />
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
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

              {message && (
                <div className="p-4 rounded-lg text-sm font-medium text-center animate-spring bg-accent-green/10 text-brand-green border border-accent-green/20">
                  {message}
                </div>
              )}
            </form>

            <div className="mt-10 pt-10 border-t border-ceramic text-center">
               <p className="text-sm text-text-black-soft mb-4">Already have an account?</p>
               <Link href="/login" className="w-full">
                 <Button variant="dark-outline" className="w-full h-14">Sign in</Button>
               </Link>
            </div>
            
            <p className="mt-8 text-center text-[10px] uppercase tracking-widest text-text-black-soft/60 px-6 leading-relaxed">
              By joining, you agree to Curio&apos;s <a href="#" className="underline hover:text-brand-green">Terms of Service</a> and <a href="#" className="underline hover:text-brand-green">Privacy Policy</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
