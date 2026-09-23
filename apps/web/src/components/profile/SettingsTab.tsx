"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import Image from "next/image";

interface SettingsTabProps {
  profile: any;
  session: any;
  supabase: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  onSignOut: () => void;
}

export function SettingsTab({ profile, session, supabase, setProfile, onSignOut }: SettingsTabProps) {
  // Edit Profile State
  const [editName, setEditName] = useState(profile?.name || "");
  const [editBio, setEditBio] = useState(profile?.bio || "");
  const [editAvatar, setEditAvatar] = useState(profile?.image || "");
  const [editBankName, setEditBankName] = useState(profile?.bank_name || "");
  const [editBankAccountTitle, setEditBankAccountTitle] = useState(profile?.bank_account_title || "");
  const [editBankAccountNumber, setEditBankAccountNumber] = useState(profile?.bank_account_number || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  
  // CNIC Verification State
  const [cnicLoading, setCnicLoading] = useState(false);
  const [cnicError, setCnicError] = useState("");
  const [cnicSuccess, setCnicSuccess] = useState("");

  // Push Notifications State
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    async function checkPush() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setPushEnabled(!!subscription);
        }
      }
    }
    checkPush();
  }, []);

  const handleTogglePush = async (isSelected: boolean) => {
    setPushLoading(true);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert("Push notifications are not supported by your browser.");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        alert("Service worker not found.");
        return;
      }

      if (isSelected) {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert("Permission to show notifications was denied.");
          return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("VAPID public key not found in env.");
          return;
        }
        
        // Convert base64 to Uint8Array for the browser
        const padding = '='.repeat((4 - vapidPublicKey.length % 4) % 4);
        const base64 = (vapidPublicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });

        // Send to backend
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });
        
        if (res.ok) setPushEnabled(true);
      } else {
        // Unsubscribe
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          // Ideally also tell backend to delete, but for now just local is fine
          setPushEnabled(false);
        }
      }
    } catch (e) {
      console.error("Error toggling push:", e);
      alert("Failed to change push notification settings.");
    } finally {
      setPushLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const { error } = await supabase
        .from("user")
        .update({
          name: editName,
          bio: editBio,
          image: editAvatar,
          bank_name: editBankName,
          bank_account_title: editBankAccountTitle,
          bank_account_number: editBankAccountNumber,
        })
        .eq("id", session.user.id);
      
      if (error) throw error;

      setSaveMessage("Profile updated successfully!");
      setProfile((prev: any) => ({ ...prev, name: editName, bio: editBio, image: editAvatar }));
      window.dispatchEvent(new Event("profile-updated"));
    } catch (e: any) {
      console.error("Error saving profile:", JSON.stringify(e));
      setSaveMessage("Error saving profile: " + (e.message || JSON.stringify(e) || "Unknown error"));
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 5000);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      alert("File size exceeds 800KB. Please choose a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleCnicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setCnicError("File size exceeds 2MB. Please choose a smaller image.");
      return;
    }

    setCnicLoading(true);
    setCnicError("");
    setCnicSuccess("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const res = await fetch('/api/verify-cnic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          setCnicSuccess(`Verified successfully! CNIC: ${data.cnic}`);
          setProfile((prev: any) => ({ 
            ...prev, 
            cnic_number: data.cnic, 
            verification_status: 'verified' 
          }));
        } else {
          setCnicError(data.error || "Failed to verify CNIC. Please try again with a clearer image.");
        }
      } catch (err) {
        setCnicError("Network error occurred during verification.");
      } finally {
        setCnicLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl animate-slide-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif font-medium text-primary">Account Settings</h2>
        {saveMessage && <span className="text-primary font-bold text-sm bg-secondary-fixed px-3 py-1 rounded-full">{saveMessage}</span>}
      </div>
      <div className="space-y-8">
        {/* Avatar Upload */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative h-20 w-20 rounded-full bg-surface-container/50 border border-surface-container flex items-center justify-center overflow-hidden">
            {editAvatar ? (
              editAvatar.startsWith("data:image") ? (
                <img src={editAvatar} alt="Profile" className="object-cover w-full h-full" />
              ) : (
                <Image src={editAvatar} alt="Profile" fill className="object-cover" />
              )
            ) : (
              <span className="text-2xl text-surface-tint font-bold">{editName?.[0]?.toUpperCase() || "U"}</span>
            )}
          </div>
          <div className="flex flex-col items-start">
            <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            <label htmlFor="avatar-upload" className="mb-2 font-bold text-sm border-2 border-surface-container rounded-lg px-4 py-2 cursor-pointer hover:bg-surface-bright transition-colors text-on-surface">Change Picture</label>
            <p className="text-xs text-surface-tint">JPG, GIF or PNG. Max size of 800K</p>
          </div>
        </div>

        <div className="h-px w-full bg-surface-container/50" />

        <div>
          <label className="block text-sm font-bold text-primary mb-2">Full Name</label>
          <input 
            type="text" 
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Your display name"
            className="w-full px-4 py-3 bg-surface-bright border border-surface-container rounded focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-primary mb-2">Bio</label>
          <textarea 
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            placeholder="Tell buyers a little about your style..."
            className="w-full px-4 py-3 bg-surface-bright border border-surface-container rounded focus:outline-none focus:border-primary transition-colors min-h-[100px] resize-y"
          />
        </div>

        <div className="h-px w-full bg-surface-container/50 my-8" />
        
        <div>
          <h3 className="text-lg font-serif font-bold text-primary mb-4">Bank Details for Payouts</h3>
          <p className="text-xs text-surface-tint mb-4">Enter your bank details to withdraw funds from your Curio wallet.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Bank Name</label>
              <input 
                type="text" 
                value={editBankName}
                onChange={(e) => setEditBankName(e.target.value)}
                placeholder="e.g. Meezan Bank, HBL"
                className="w-full px-4 py-3 bg-surface-bright border border-surface-container rounded focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">Account Title</label>
              <input 
                type="text" 
                value={editBankAccountTitle}
                onChange={(e) => setEditBankAccountTitle(e.target.value)}
                placeholder="e.g. Muhammad Ali"
                className="w-full px-4 py-3 bg-surface-bright border border-surface-container rounded focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">IBAN or Account Number</label>
              <input 
                type="text" 
                value={editBankAccountNumber}
                onChange={(e) => setEditBankAccountNumber(e.target.value)}
                placeholder="PK00 MEEZ 0000 0000 0000 0000"
                className="w-full px-4 py-3 bg-surface-bright border border-surface-container rounded focus:outline-none focus:border-primary transition-colors text-sm font-mono"
              />
            </div>
          </div>
        </div>
        
        <div className="h-px w-full bg-surface-container/50 my-8" />
        
        <div>
          <h3 className="text-lg font-serif font-bold text-primary mb-4">Identity Verification</h3>
          {profile?.verification_status === 'verified' ? (
            <div className="bg-green-50 border border-green-200 p-4 rounded flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Identity Verified
                </p>
                <p className="text-xs text-green-700 mt-1">CNIC: {profile.cnic_number?.replace(/\d(?=\d{4})/g, "*")}</p>
              </div>
            </div>
          ) : (
            <div className="bg-surface-bright border border-surface-container p-4 rounded">
              <p className="text-sm font-bold text-on-surface mb-2">Verify Your Identity</p>
              <p className="text-xs text-surface-tint mb-4">Upload a clear photo of your CNIC. We will automatically extract the ID number and verify it instantly. Your image will not be saved.</p>
              
              {cnicError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-bold">
                  {cnicError}
                </div>
              )}
              
              {cnicSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-xs font-bold">
                  {cnicSuccess}
                </div>
              )}

              <div className="relative border-2 border-dashed border-surface-container rounded-lg p-6 flex flex-col items-center justify-center hover:bg-surface-dim transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleCnicUpload}
                  disabled={cnicLoading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                {cnicLoading ? (
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2"></div>
                    <span className="text-sm font-bold text-primary">Running AI Verification...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-surface-tint mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <span className="text-sm font-bold text-primary">Tap to upload CNIC</span>
                    <span className="text-xs text-surface-tint mt-1">JPEG/PNG under 2MB</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-px w-full bg-surface-container/50 my-8" />
        
        <div>
          <label className="block text-sm font-bold text-primary mb-2">Email Address</label>
          <input 
            type="email" 
            defaultValue={profile?.email || ""}
            className="w-full px-4 py-3 bg-surface-dim border border-surface-container rounded focus:outline-none text-on-surface-variant"
            disabled
          />
          <p className="text-xs text-on-surface-variant mt-2">Email changes currently require support assistance.</p>
        </div>

        <div className="h-px w-full bg-surface-container/50 my-8" />
        
        <div>
          <h3 className="text-lg font-serif font-bold text-primary mb-4">Push Notifications</h3>
          <div className="flex items-center justify-between bg-surface-bright border border-surface-container p-4 rounded">
            <div>
              <p className="text-sm font-bold text-on-surface">Enable Mobile & Desktop Push</p>
              <p className="text-xs text-surface-tint">Get instantly notified about new chats and orders.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={pushEnabled} 
                onChange={(e) => handleTogglePush(e.target.checked)} 
                disabled={pushLoading} 
              />
              <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-surface-container flex items-center justify-between">
          <Button onClick={onSignOut} variant="outline" className="h-12 font-bold text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded">
            Sign Out
          </Button>
          <Button onClick={handleSaveProfile} className="h-12 font-bold bg-primary hover:bg-primary-container text-on-primary px-8 rounded">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
