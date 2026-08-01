'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContactsManager } from '@/components/ContactsManager';
import { TokenShareCard } from '@/components/TokenShareCard';
import { Users, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { EmergencyContact } from '@/types';
import { signInWithGoogle } from '@/lib/supabase';
import { useAuthSession } from '@/lib/useAuthSession';

export default function ContactsPage() {
  const { user, loading: authLoading } = useAuthSession();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const fetchContacts = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/ping?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.contacts) setContacts(data.contacts);
      if (data.user?.emergencyToken) setToken(data.user.emergencyToken);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchContacts(user.id);
    }
  }, [user?.id, fetchContacts]);

  const handleLogin = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setSigningIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Chargement de vos contacts...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 text-center space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Connexion requise</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Veuillez vous connecter avec votre compte Google pour gérer vos contacts d'urgence et obtenir votre lien de suivi personnalisé.
          </p>
        </div>
        <button
          onClick={handleLogin}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
        >
          {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Se connecter avec Google</span>}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const fallbackToken = token || ('tok_' + user.id.replace(/-/g, '').substring(0, 12));

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Gestion des Proches & Liens de Suivi</h1>
            <p className="text-sm text-slate-400 mt-1">
              Partagez votre lien de sécurité universel ou générez un lien dédié personnalisé pour chaque proche.
            </p>
          </div>
        </div>
      </div>

      {/* Universal Emergency Token Sharing Card */}
      <TokenShareCard token={fallbackToken} userId={user.id} />

      {/* Per-Contact Dedicated Links Manager */}
      <ContactsManager
        initialContacts={contacts}
        userId={user.id}
        userEmergencyToken={fallbackToken}
        onContactsChange={() => fetchContacts(user.id)}
      />

    </div>
  );
}
