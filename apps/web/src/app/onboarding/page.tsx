"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select, Textarea } from "@curio/ui";
import { useRouter } from "next/navigation";
import Image from "next/image";

const PK_CITIES = [
  { label: "Lahore", value: "lahore" },
  { label: "Karachi", value: "karachi" },
  { label: "Islamabad", value: "islamabad" },
  { label: "Rawalpindi", value: "rawalpindi" },
  { label: "Faisalabad", value: "faisalabad" },
  { label: "Multan", value: "multan" },
  { label: "Peshawar", value: "peshawar" },
  { label: "Quetta", value: "quetta" },
  { label: "Sialkot", value: "sialkot" },
  { label: "Gujranwala", value: "gujranwala" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    city: "",
    bio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call to update profile
    setTimeout(() => {
      setLoading(false);
      router.push("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-warm flex flex-col items-center py-12 px-6 md:py-24">
      <div className="w-full max-w-2xl space-y-10 animate-fade-in">
        <div className="text-center space-y-4">
           <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-green text-white text-3xl font-bold mb-4 shadow-xl">C</div>
           <h1 className="text-4xl md:text-5xl font-bold text-brand-green tracking-tight">Set up your profile</h1>
           <p className="text-lg text-text-black-soft max-w-md mx-auto">
             Complete your details to start buying and selling on Pakistan&apos;s curated marketplace.
           </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="border-none shadow-2xl overflow-hidden">
            <div className="h-32 bg-brand-green relative">
               <div className="absolute -bottom-12 left-10 h-24 w-24 rounded-full border-4 border-white bg-ceramic overflow-hidden shadow-lg group cursor-pointer">
                  <div className="h-full w-full flex items-center justify-center text-text-black-soft/20 transition-colors group-hover:bg-black/5">
                     <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </div>
               </div>
            </div>
            
            <CardContent className="pt-20 px-10 pb-12 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input 
                   label="Full Name" 
                   value={formData.fullName}
                   onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                   required
                 />
                 <Input 
                   label="Username" 
                   value={formData.username}
                   onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                   required
                   placeholder="@username"
                 />
               </div>

               <Select 
                 label="Select City" 
                 options={PK_CITIES}
                 value={formData.city}
                 onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                 required
               />

               <Textarea 
                 label="Bio" 
                 placeholder="Tell the community about your style..."
                 value={formData.bio}
                 onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                 required
               />

               <div className="pt-6">
                 <Button 
                   type="submit" 
                   variant="primary" 
                   size="lg" 
                   className="w-full h-16 text-lg shadow-xl shadow-accent-green/20"
                   disabled={loading}
                 >
                   {loading ? "Saving Profile..." : "Complete Setup"}
                 </Button>
               </div>
            </CardContent>
          </Card>
        </form>
        
        <p className="text-center text-xs text-text-black-soft/60 uppercase tracking-widest">
          Curio Marketplace • Premium Pre-loved Fashion
        </p>
      </div>
    </div>
  );
}
