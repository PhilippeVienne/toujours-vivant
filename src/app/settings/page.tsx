'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, Clock, MapPin, Bell, ShieldCheck, User as UserIcon, LogOut, Check, ArrowRight, Loader2, Sliders } from 'lucide-react';
import { signOutUser, signInWithGoogle } from '@/lib/supabase';
import { useAuthSession } from '@/lib/useAuthSession';

export default function SettingsPage() {
  const { user, loading: authLoading, setUser } = useAuthSession();
  const [saving, setSaving] = useState(false);
  const [pingFrequency, setPingFrequency] = useState<number>(30);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('30');
  const [attachLocation, setAttachLocation] = useState<boolean>(true);
  const [pushReminder, setPushReminder] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const fetchUserSettings = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/user/settings?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.pingFrequencyMinutes) {
        const mins = Number(data.pingFrequencyMinutes);
        setPingFrequency(mins);
        setCustomInput(String(mins));
        if (![15, 30, 45, 60, 120, 240].includes(mins)) {
          setIsCustomMode(true);
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchUserSettings(user.id);
    }
  }, [user?.id, fetchUserSettings]);

  const handlePresetSelect = (mins: number) => {
    setIsCustomMode(false);
    setPingFrequency(mins);
    setCustomInput(String(mins));
  };

  const handleCustomInputChange = (val: string) => {
    setCustomInput(val);
    const num = Number(val);
    if (!isNaN(num) && num >= 5 && num <= 1440) {
      setPingFrequency(num);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const targetMins = isCustomMode ? Number(customInput) : pingFrequency;
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          pingFrequencyMinutes: targetMins,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPingFrequency(targetMins);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
  };

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
        <p className="text-sm font-medium text-slate-400">Chargement de vos paramètres...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 text-center space-y-6 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
          <Settings className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Connexion requise</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Veuillez vous connecter avec votre compte Google pour personnaliser vos paramètres de sécurité et vos préférences de notification.
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

  const userAvatar = user.user_metadata?.avatar_url;
  const userName = user.user_metadata?.full_name || user.email || 'Utilisateur';

  const presetValues = [
    { mins: 15, label: '15 min', sub: 'Urgence accrue' },
    { mins: 30, label: '30 min', sub: 'Recommandé (Par défaut)' },
    { mins: 45, label: '45 min', sub: 'Modéré' },
    { mins: 60, label: '1 heure', sub: 'Standard' },
    { mins: 120, label: '2 heures', sub: 'Étendu' },
    { mins: 240, label: '4 heures', sub: 'Longue durée' },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Settings className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Paramètres de Sécurité</h1>
            <p className="text-sm text-slate-400 mt-1">
              Ajustez la durée du compte à rebours de check-in et gérez vos préférences.
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="w-12 h-12 rounded-full border-2 border-emerald-500/40 object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-bold border border-emerald-500/30">
              <UserIcon className="w-6 h-6" />
            </div>
          )}
          <div>
            <h3 className="text-base font-bold text-white">{userName}</h3>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Check-in Delay Adjustment Section */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-white">Ajustement du Délai de Check-in</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Délai d'inactivité autorisé avant que le système ne déclenche automatiquement l'alerte d'urgence à vos proches.
              </p>
            </div>
          </div>

          <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-sm shrink-0">
            {pingFrequency} min
          </div>
        </div>

        {/* Preset Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {presetValues.map((preset) => (
            <button
              key={preset.mins}
              onClick={() => handlePresetSelect(preset.mins)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                !isCustomMode && pingFrequency === preset.mins
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-base font-black font-mono">{preset.label}</span>
                {!isCustomMode && pingFrequency === preset.mins && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <span className="text-[11px] text-slate-400">{preset.sub}</span>
            </button>
          ))}
        </div>

        {/* Custom Duration Input Option */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white"
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Saisir une durée personnalisée (en minutes)</span>
            </button>
            <span className="text-[10px] text-slate-500">Entre 5 et 1440 min (24h)</span>
          </div>

          {isCustomMode && (
            <div className="flex items-center gap-3 pt-1">
              <div className="relative flex-1 max-w-xs">
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={customInput}
                  onChange={(e) => handleCustomInputChange(e.target.value)}
                  placeholder="Ex: 90"
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">minutes</span>
              </div>
              <p className="text-xs text-slate-400">
                Soit <strong className="text-emerald-400 font-mono">{(Number(customInput) / 60).toFixed(1)} h</strong> de sécurité.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preferences Toggles */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span>Options de Confidentialité & Notifications</span>
        </h3>

        {/* GPS Location Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-200">Joindre la position GPS aux pings</p>
              <p className="text-[11px] text-slate-400">Transmet la dernière position connue à vos proches uniquement en cas d'alerte.</p>
            </div>
          </div>
          <button
            onClick={() => setAttachLocation(!attachLocation)}
            className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
              attachLocation ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Push Notification Toggle */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-800/80 pt-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-200">Rappels de pré-alerte (Push & Son)</p>
              <p className="text-[11px] text-slate-400">Envoie une notification 5 minutes avant l'échéance pour éviter les fausses alertes.</p>
            </div>
          </div>
          <button
            onClick={() => setPushReminder(!pushReminder)}
            className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
              pushReminder ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        {savedSuccess && (
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-fade-in bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
            <Check className="w-4 h-4" />
            <span>Nouveau délai enregistré ({pingFrequency} min) !</span>
          </span>
        )}
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          <span>Enregistrer les modifications</span>
        </button>
      </div>

    </div>
  );
}
