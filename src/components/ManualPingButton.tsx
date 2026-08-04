'use client';

import { useState } from 'react';
import { Heart, MapPin, MessageSquare, Check, Loader2 } from 'lucide-react';

interface ManualPingButtonProps {
  onPingSuccess?: () => void;
  userId?: string;
}

export function ManualPingButton({ onPingSuccess }: ManualPingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [message, setMessage] = useState('');
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchLocation = () => {
    if ('geolocation' in navigator) {
      setLocationStatus('Recherche GPS...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationStatus('📍 GPS obtenu');
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setLocationStatus('GPS non disponible');
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  };

  const handlePing = async () => {
    setIsLoading(true);
    setSuccessMessage(null);

    // Haptic vibration feedback if supported
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }

    try {
      const response = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pingType: 'MANUAL',
          latitude: coords.lat,
          longitude: coords.lng,
          locationName: coords.lat ? `GPS (${coords.lat.toFixed(4)}, ${coords.lng?.toFixed(4)})` : 'Localisation manuelle',
          message: message.trim() || 'Je vais bien ! (Ping manuel 1-Tap)',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('🟢 Check-in validé ! Vos proches savent que vous allez bien.');
        setMessage('');
        setShowExtra(false);
        if (onPingSuccess) onPingSuccess();
      }
    } catch (err) {
      console.error('Ping error:', err);
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 sm:p-14 rounded-3xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden text-center min-h-[420px]">
      
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Main 1-Tap Button */}
      <div className="relative group my-4">
        {/* Pulsing ring animation */}
        <div className="absolute -inset-5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60 blur-2xl group-hover:opacity-90 animate-pulse transition duration-1000" />

        <button
          onClick={handlePing}
          disabled={isLoading}
          className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-1 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center text-white font-extrabold focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
        >
          <div className="w-full h-full rounded-full bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 border-2 border-emerald-400/40 hover:bg-slate-950/70 transition-colors">
            {isLoading ? (
              <Loader2 className="w-16 h-16 text-emerald-400 animate-spin" />
            ) : (
              <>
                <Heart className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-400 fill-emerald-400/20 drop-shadow-md mb-2 animate-bounce" />
                <span className="text-lg sm:text-2xl tracking-wide sm:tracking-wider uppercase font-black bg-gradient-to-r from-emerald-200 to-white bg-clip-text text-transparent whitespace-nowrap">
                  JE VAIS BIEN{' !'}
                </span>
                <span className="text-[11px] font-bold text-emerald-400 mt-1 uppercase tracking-widest">
                  1-TAP CHECK-IN
                </span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Geolocation status indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
        <button
          onClick={fetchLocation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>{locationStatus || 'Joindre la position GPS'}</span>
        </button>
      </div>

      {/* Success alert banner */}
      {successMessage && (
        <div className="mt-5 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2.5 animate-fade-in shadow-xl max-w-md w-full">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Optional message toggle */}
      <div className="w-full max-w-md mt-6">
        {!showExtra ? (
          <button
            onClick={() => {
              setShowExtra(true);
              fetchLocation();
            }}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Ajouter un message ou une localisation</span>
          </button>
        ) : (
          <div className="space-y-3 bg-slate-950/90 p-5 rounded-2xl border border-slate-800 text-left animate-fade-in shadow-2xl">
            <label className="block text-xs font-bold text-slate-200">Message optionnel :</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: En balade au parc, tout est nickel !"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowExtra(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
