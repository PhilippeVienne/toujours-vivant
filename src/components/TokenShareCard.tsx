'use client';

import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, ShieldCheck, RefreshCw, AlertTriangle, Loader2, MessageCircle } from 'lucide-react';
import { getAuthHeaders } from '@/lib/supabase';

interface TokenShareCardProps {
  token: string;
  userId?: string;
  onTokenRevoked?: (newToken: string) => void;
}

export function TokenShareCard({ token: initialToken, userId, onTokenRevoked }: TokenShareCardProps) {
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState(false);

  const getPublicUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/status/${token}`;
    }
    return `https://toujours-vivant.fr/status/${token}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const url = getPublicUrl();
    const message = `Bonjour, voici mon lien de sécurité Toujours Vivant pour consulter mon statut en temps réel : ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRevokeToken = async () => {
    if (!userId) return;
    try {
      setRevoking(true);
      const res = await fetch('/api/user/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (data.success && data.emergencyToken) {
        setToken(data.emergencyToken);
        setShowRevokeConfirm(false);
        setRevokeSuccess(true);
        if (onTokenRevoked) onTokenRevoked(data.emergencyToken);
        setTimeout(() => setRevokeSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error revoking token:', err);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 backdrop-blur-xl p-7 sm:p-8 shadow-2xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-400 shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Lien Universel pour les Proches</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Transmettez ce lien unique à vos proches pour qu'ils puissent consulter votre statut à tout moment.
            </p>
          </div>
        </div>

        {userId && (
          <button
            onClick={() => setShowRevokeConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all self-start sm:self-auto shrink-0"
            title="Révoquer le lien actuel et en générer un nouveau"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Révoquer & Régénérer</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            readOnly
            value={getPublicUrl()}
            className="w-full px-4 py-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none select-all"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-600/30 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              title="Partager sur WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {revokeSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>🟢 Lien universel révoqué ! L'ancien lien n'est plus fonctionnel. Nouveau lien généré.</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400 pt-1">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Aperçu WhatsApp & Réseaux sociaux enrichi
          </span>
          <a
            href={getPublicUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Tester le lien universel</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Revoke confirmation modal */}
      {showRevokeConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-start gap-3.5 text-amber-400">
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-100">Révoquer le lien universel ?</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  L'ancien lien deviendra <strong>immédiatement inopérant</strong>. Toute personne disposant de l'ancien lien ne pourra plus consulter votre statut.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300">
              Ancien jeton : {token}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRevokeConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRevokeToken}
                disabled={revoking}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Confirmer la révocation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
