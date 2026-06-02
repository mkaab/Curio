"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Input, Select, Textarea } from "@curio/ui";
import { CATEGORIES, getChildCategories } from "@curio/types";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

const CONDITIONS = [
  { value: "New", label: "New with tags", desc: "Never worn, original tags still attached." },
  { value: "Like New", label: "Like new", desc: "Worn once or twice, no flaws or signs of wear." },
  { value: "Good", label: "Good", desc: "Lightly worn, minor signs of wear, well cared for." },
  { value: "Fair", label: "Fair", desc: "Worn frequently, visible wear or minor flaws described in text." },
];

const SIZES = [
  { label: "One Size (OS)", value: "OS" },
  { label: "Extra Small (XS)", value: "XS" },
  { label: "Small (S)", value: "S" },
  { label: "Medium (M)", value: "M" },
  { label: "Large (L)", value: "L" },
  { label: "Extra Large (XL)", value: "XL" },
  { label: "Double XL (XXL)", value: "XXL" },
];

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to 0.85 quality JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export default function SellPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // Wizard State
  const [step, setStep] = useState(1);

  // Form State
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [hasAcceptedGuidelines, setHasAcceptedGuidelines] = useState(false);
  const [guidelinesCheckbox, setGuidelinesCheckbox] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  
  const [lvl1, setLvl1] = useState("");
  const [lvl2, setLvl2] = useState("");
  const [lvl3, setLvl3] = useState("");
  const [size, setSize] = useState("M");
  const [brand, setBrand] = useState("Unknown");
  
  const [price, setPrice] = useState("");

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUserId(session.user.id);
      }
    }
    checkSession();
  }, [router, supabase]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = () => {
    if (!hasAcceptedGuidelines) {
      setShowGuidelines(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleAcceptGuidelines = () => {
    if (guidelinesCheckbox) {
      setHasAcceptedGuidelines(true);
      setShowGuidelines(false);
      setTimeout(() => fileInputRef.current?.click(), 100);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    const newPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      if (photos.length + newPhotos.length >= 10) break;
      const file = files[i];
      try {
        const compressed = await compressImage(file);
        newPhotos.push(compressed);
      } catch (err) {
        console.error("Error compressing file:", err);
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    setUploadingPhoto(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (step === 1 && photos.length === 0) {
      setMessage("Please upload at least one photo.");
      return;
    }
    if (step === 2 && (!title || !description || !condition || !lvl3)) {
      setMessage("Please fill out details, condition, and select a category.");
      return;
    }
    setMessage("");
    setStep(s => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!userId) return;
    if (!price) {
      setMessage("Please enter a valid price.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const lvl1Cat = CATEGORIES.find(c => c.id === lvl1);
      const lvl2Cat = CATEGORIES.find(c => c.id === lvl2);
      const lvl3Cat = CATEGORIES.find(c => c.id === lvl3);

      const { error } = await supabase.from("listing").insert({
        seller_id: userId,
        title: title.trim(),
        description: description.trim(),
        department: lvl1Cat ? lvl1Cat.name : "Unknown",
        subcategory: lvl2Cat ? lvl2Cat.name : "Unknown",
        category: lvl3Cat ? lvl3Cat.name : "Unknown",
        brand: brand ? brand.trim() : "",
        condition,
        size: size ? size.trim() : "",
        price: parseFloat(price),
        images: photos,
        status: "active",
        moderation_status: "pending",
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage("Listing published successfully!");
        setTimeout(() => router.push("/"), 1000);
      }
    } catch (err) {
      setMessage("Error: Unable to connect to database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white md:bg-neutral-warm pb-32 font-sans flex flex-col">
      {/* Top Nav */}
      <nav className="h-[60px] md:h-[72px] bg-white border-b border-ceramic flex items-center justify-between px-4 md:px-10 sticky top-0 z-50 shadow-sm">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="h-8 w-8 rounded-full bg-brand-green flex items-center justify-center text-white font-bold transition-transform group-hover:rotate-12 shadow-inner">C</div>
          <span className="text-lg font-bold text-brand-green uppercase tracking-wider hidden sm:block">Curio</span>
        </Link>
        
        {/* Progress Bar */}
        <div className="flex items-center space-x-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 w-8 md:w-12 rounded-full transition-colors ${step >= s ? "bg-brand-green" : "bg-ceramic"}`} />
          ))}
        </div>

        <Link href="/">
          <Button variant="outline" size="sm" className="font-bold text-text-black-soft hover:text-text-black border-none">Cancel</Button>
        </Link>
      </nav>

      <div className="max-w-xl w-full mx-auto px-4 mt-8 md:mt-16 flex-1">
        {step === 1 && (
          <div className="space-y-6 animate-slide-in">
            <div>
              <h1 className="text-3xl font-extrabold text-text-black tracking-tight mb-2">Upload Photos</h1>
              <p className="text-text-black-soft text-base">Add up to 10 photos of your item. Make sure they are clear and well lit.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((url, index) => (
                <div key={index} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-ceramic group bg-ceramic shadow-inner">
                  <Image src={url} alt={`Upload ${index + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/80 backdrop-blur-md text-text-black flex items-center justify-center hover:bg-white transition-colors text-xs font-bold shadow z-10"
                  >
                    ✕
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 bg-brand-green text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md shadow-lg backdrop-blur-md z-10">Cover</span>
                  )}
                </div>
              ))}
              
              {photos.length < 10 && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="aspect-[3/4] border-2 border-dashed border-ceramic rounded-2xl flex flex-col items-center justify-center text-text-black-soft hover:border-brand-green/60 hover:text-brand-green transition-all bg-ceramic/10 cursor-pointer"
                  >
                    {uploadingPhoto ? (
                      <span className="text-xs font-bold animate-pulse">Uploading...</span>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-full bg-brand-green/10 flex items-center justify-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Add Photo</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-slide-in">
            <div>
              <h1 className="text-3xl font-extrabold text-text-black tracking-tight mb-2">Item Details</h1>
              <p className="text-text-black-soft text-base">Tell buyers about your item and its condition.</p>
            </div>
            
            <div className="space-y-6">
              <Input
                label="Listing Title"
                placeholder="e.g., Vintage Silk Maxi Dress"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="relative">
                <label className="block text-sm font-bold text-text-black mb-2">Description</label>
                <textarea
                  className="w-full min-h-[120px] p-4 text-base text-text-black bg-white border border-ceramic rounded-2xl outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all resize-y"
                  placeholder="Describe the item, any flaws, and how it fits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="pt-4">
                <label className="block text-sm font-bold text-text-black mb-3">Condition</label>
                <div className="space-y-3">
                  {CONDITIONS.map((cond) => (
                    <button
                      key={cond.value}
                      type="button"
                      onClick={() => setCondition(cond.value)}
                      className={`w-full p-4 text-left rounded-2xl border-2 transition-all flex flex-col space-y-1 ${
                        condition === cond.value
                          ? "border-brand-green bg-brand-green/5"
                          : "border-ceramic bg-white hover:border-ceramic/80"
                      }`}
                    >
                      <span className="font-bold text-text-black text-base">{cond.label}</span>
                      <span className="text-sm text-text-black-soft leading-tight">{cond.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-ceramic/60">
                <label className="block text-sm font-bold text-text-black mb-3">Category</label>
                
                {/* Category Picker Breadcrumbs */}
                {(lvl1 || lvl2 || lvl3) && (
                  <div className="flex items-center space-x-2 mb-4 bg-neutral-warm/40 border border-ceramic p-3.5 rounded-2xl text-xs font-bold text-brand-green">
                    <span className="cursor-pointer hover:underline" onClick={() => { setLvl1(""); setLvl2(""); setLvl3(""); }}>Category</span>
                    {lvl1 && (
                      <>
                        <span className="text-text-black-soft/60">/</span>
                        <span className="cursor-pointer hover:underline text-text-black" onClick={() => { setLvl2(""); setLvl3(""); }}>
                          {CATEGORIES.find(c => c.id === lvl1)?.name}
                        </span>
                      </>
                    )}
                    {lvl2 && (
                      <>
                        <span className="text-text-black-soft/60">/</span>
                        <span className="cursor-pointer hover:underline text-text-black" onClick={() => { setLvl3(""); }}>
                          {CATEGORIES.find(c => c.id === lvl2)?.name}
                        </span>
                      </>
                    )}
                    {lvl3 && (
                      <>
                        <span className="text-text-black-soft/60">/</span>
                        <span className="text-brand-green">
                          {CATEGORIES.find(c => c.id === lvl3)?.name}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Level 1: Audience Grid */}
                {!lvl1 && (
                  <div className="grid grid-cols-4 gap-2.5 animate-slide-in">
                    {CATEGORIES.filter(c => c.level === 1).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setLvl1(cat.id); setLvl2(""); setLvl3(""); }}
                        className="p-3.5 rounded-xl border-2 border-ceramic bg-white text-center hover:border-brand-green/60 text-xs font-extrabold text-text-black hover:bg-neutral-warm/10 transition-all cursor-pointer active:scale-95"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Level 2: Department Selection */}
                {lvl1 && !lvl2 && (
                  <div className="grid grid-cols-3 gap-2.5 animate-slide-in">
                    {getChildCategories(lvl1).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setLvl2(cat.id); setLvl3(""); }}
                        className="p-3.5 rounded-xl border-2 border-ceramic bg-white text-center hover:border-brand-green/60 text-xs font-extrabold text-text-black hover:bg-neutral-warm/10 transition-all cursor-pointer active:scale-95"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Level 3: Specific Category Selection */}
                {lvl2 && !lvl3 && (
                  <div className="grid grid-cols-2 gap-2.5 animate-slide-in">
                    {getChildCategories(lvl2).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setLvl3(cat.id)}
                        className="p-3.5 rounded-xl border-2 border-ceramic bg-white text-center hover:border-brand-green/60 text-xs font-extrabold text-text-black hover:bg-neutral-warm/10 transition-all cursor-pointer active:scale-95"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Finished State showing selection */}
                {lvl3 && (
                  <div className="flex items-center justify-between p-4 bg-brand-green/5 border-2 border-brand-green/20 rounded-2xl animate-slide-in">
                    <div>
                      <p className="text-[10px] font-bold text-text-black-soft/80 uppercase tracking-wider mb-0.5">Selected Category</p>
                      <p className="text-sm font-extrabold text-text-black">
                        {CATEGORIES.find(c => c.id === lvl1)?.name} &gt; {CATEGORIES.find(c => c.id === lvl2)?.name} &gt; {CATEGORIES.find(c => c.id === lvl3)?.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setLvl1(""); setLvl2(""); setLvl3(""); }}
                      className="px-3.5 py-1.5 border-2 border-ceramic hover:border-text-black text-xs font-bold bg-white text-text-black rounded-xl cursor-pointer transition-all duration-300 active:scale-95"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-slide-in">
            <div>
              <h1 className="text-3xl font-extrabold text-text-black tracking-tight mb-2">Set your price</h1>
              <p className="text-text-black-soft text-base">You keep 100% of what you earn on Curio.</p>
            </div>
            
            <div className="relative group pt-4">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10 pt-4">
                <span className="text-3xl font-bold text-text-black-soft">₨</span>
              </div>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-full pl-16 pr-6 py-6 text-4xl font-extrabold text-text-black bg-white border-2 border-ceramic rounded-3xl outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all placeholder:text-ceramic/80"
              />
            </div>

            <div className="pt-6 grid grid-cols-2 gap-4">
                <Select
                  label="Size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  options={SIZES}
                />
                <Input
                  label="Brand"
                  placeholder="e.g., Khaadi"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-ceramic p-4 px-6 md:p-6 flex items-center justify-between z-50 md:bg-transparent md:border-none md:max-w-xl md:mx-auto md:w-full md:pb-10">
        <div className="flex-1">
          {step > 1 ? (
             <Button variant="outline" size="lg" onClick={prevStep} className="h-14 font-bold border-2 border-ceramic rounded-2xl w-32 bg-white">Back</Button>
          ) : (
             <div />
          )}
        </div>
        
        <div className="flex-1 flex justify-end">
          {message && <span className="absolute -top-12 right-6 px-4 py-2 bg-brand-green text-white text-xs font-bold rounded-lg shadow-lg animate-fade-in">{message}</span>}
          
          {step < 3 ? (
            <Button variant="primary" size="lg" onClick={nextStep} className="h-14 font-bold text-lg rounded-2xl w-40 shadow-xl shadow-brand-green/20">Next</Button>
          ) : (
            <Button variant="primary" size="lg" onClick={handleSubmit} disabled={loading} className="h-14 font-bold text-lg rounded-2xl w-48 shadow-xl shadow-brand-green/20">
              {loading ? "Publishing..." : "Publish Item"}
            </Button>
          )}
        </div>
      </div>
      
      {/* Guidelines Modal */}
      {showGuidelines && (
        <div className="fixed inset-0 z-[100] bg-[#1E3932]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-slide-in">
            <button onClick={() => setShowGuidelines(false)} className="absolute top-6 right-6 text-[#1E3932]/50 hover:text-[#1E3932] font-bold text-xl leading-none">✕</button>
            <h3 className="text-2xl font-black text-[#1E3932] mb-2">Before you upload</h3>
            <p className="text-[#1E3932]/70 text-sm mb-6 font-medium">Great photos sell 3x faster. Follow these rules.</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-[#00754A]/10 text-[#00754A] flex items-center justify-center text-xs font-bold mr-3 shrink-0">1</div>
                <p className="text-sm text-[#1E3932]"><strong className="font-extrabold">Bright, natural lighting.</strong> No dark rooms or harsh flash.</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-[#00754A]/10 text-[#00754A] flex items-center justify-center text-xs font-bold mr-3 shrink-0">2</div>
                <p className="text-sm text-[#1E3932]"><strong className="font-extrabold">Show all angles.</strong> Include tags, soles, and any flaws.</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 rounded-full bg-[#00754A]/10 text-[#00754A] flex items-center justify-center text-xs font-bold mr-3 shrink-0">3</div>
                <p className="text-sm text-[#1E3932]"><strong className="font-extrabold">Clean background.</strong> Avoid messy beds or cluttered floors.</p>
              </div>
            </div>

            <label className="flex items-start space-x-3 mb-8 cursor-pointer bg-[#f2f0eb] p-4 rounded-xl border border-ceramic hover:border-[#00754A]/30 transition-colors">
              <input 
                type="checkbox" 
                checked={guidelinesCheckbox} 
                onChange={(e) => setGuidelinesCheckbox(e.target.checked)} 
                className="mt-0.5 w-5 h-5 rounded border-ceramic text-[#00754A] focus:ring-[#00754A]" 
              />
              <span className="text-sm font-bold text-[#1E3932] leading-tight">I promise to upload high-quality, honest photos.</span>
            </label>

            <Button 
              variant="primary" 
              onClick={handleAcceptGuidelines} 
              disabled={!guidelinesCheckbox} 
              className="w-full h-12 text-base rounded-xl font-bold"
            >
              Continue to Upload
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
