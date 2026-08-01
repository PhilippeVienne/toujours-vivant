'use client';

import { useState, useEffect } from 'react';
import { useAuthSession } from '@/lib/useAuthSession';
import { AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import Link from 'next/link';

export function TermsAcceptanceModal() {
  const { user, loading } = useAuthSession();
  const [mustAccept, setMustAccept] = useState<boolean>(false);
  const [acceptedCheckbox, setAcceptedCheckbox] = useState<boolean>(false);

  useEffect(() => {
    if (user && !loading) {
      const storageKey = `toujours_vivant_terms_accepted_${user.id}`;
      const hasAccepted = localStorage.getItem(storageKey);
      if (!hasAccepted) {
        setMustAccept(true);
      } else {
        setMustAccept(false);
      }
    } else {
      setMustAccept(false);
    }
  }, [user, loading]);

  const handleConfirmAcceptance = () => {
    if (user && acceptedCheckbox) {
      const storageKey = `toujours_vivant_terms_accepted_${user.id}`;
      localStorage.setItem(storageKey, 'true');
      setMustAccept(false);
    }
  };

  if (!mustAccept) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-[#090d16] border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative">
        
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0 mt-1">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">Conditions d'Utilisation & Avertissement</h2>
            <p className="text-xs text-amber-400 font-semibold mt-0.5">
              Veuillez lire et accepter les limitations de responsabilité avant d'accéder à votre compte.
            </p>
          </div>
        </div>

        {/* Disclaimer Notice Body */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-3 leading-relaxed max-h-[220px] overflow-y-auto">
          <p>
            <strong>1. Service Fourni "EN L'ÉTAT" (0% SLA) :</strong><br />
            Le service <em>Toujours Vivant</em> est mis à disposition à titre personnel et bénévolement. Il ne fournit <strong>aucune garantie de fonctionnement, de disponibilité réseau ou d'acheminement des alertes</strong>.
          </p>
          <p>
            <strong>2. Pas un Service de Secours Officiel :</strong><br />
            Cette application ne remplace pas les services officiels d'urgence. En cas de détresse ou de danger immédiat, contactez les services de secours (112, 15, 18).
          </p>
          <p>
            <strong>3. Exonération de Responsabilité :</strong><br />
            L'éditeur ne peut être tenu responsable en cas de retard, dysfonctionnement technique ou non-délivrance d'un e-mail d'alerte.
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            Consulter l'intégralité des <Link href="/legal" target="_blank" className="text-emerald-400 underline">Mentions Légales & RGPD</Link>.
          </p>
        </div>

        {/* Checkbox */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <input
            type="checkbox"
            id="acceptTermsCheckbox"
            checked={acceptedCheckbox}
            onChange={(e) => setAcceptedCheckbox(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 shrink-0 cursor-pointer"
          />
          <label htmlFor="acceptTermsCheckbox" className="text-xs text-slate-200 font-medium leading-tight cursor-pointer select-none">
            J'ai lu et j'accepte les conditions d'utilisation, et je reconnais expressément l'absence de garantie de fonctionnement du service.
          </label>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmAcceptance}
          disabled={!acceptedCheckbox}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Valider et Accéder à mon Espace</span>
        </button>

      </div>
    </div>
  );
}
