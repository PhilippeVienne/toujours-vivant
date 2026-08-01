import { ShieldCheck, Mail, Lock, FileText, User, Server, AlertTriangle, Code } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Mentions Légales, RGPD & Licence AGPL - Toujours Vivant',
  description: 'Mentions légales, limitations de responsabilité, licence AGPLv3 et politique de confidentialité de Toujours Vivant.',
};

export default function LegalPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto py-4">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <FileText className="w-4 h-4" />
          <span>Cadre Juridique & RGPD</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Mentions Légales, Conditions & Licence AGPLv3</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Dernière mise à jour : 1er août 2026. Conformité aux dispositions de la loi Informatique et Libertés et au Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679).
        </p>
      </div>

      {/* 1. Éditeur de l'application */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-400" />
          <span>1. Éditeur et Directeur de la Publication</span>
        </h2>
        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            L'application Web et le service <strong>Toujours Vivant</strong> sont édités, gérés et publiés à titre strictement personnel, bénévole et non commercial par :
          </p>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 space-y-1">
            <p><strong>Éditeur :</strong> Philippe Vienne (Personne Physique)</p>
            <p><strong>Statut :</strong> Projet Open Source personnel à titre non commercial</p>
            <p><strong>Contact E-mail :</strong> <a href="mailto:philippegeek@gmail.com" className="text-emerald-400 hover:underline">philippegeek@gmail.com</a></p>
          </div>
        </div>
      </div>

      {/* 2. Limites de Stabilité & Absence de Garantie (AVERTISSEMENT MAJEUR) */}
      <div className="p-6 rounded-2xl border border-amber-500/40 bg-amber-950/20 backdrop-blur-md space-y-4">
        <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>2. Limites de Stabilité & Absence de Garantie de Fonctionnement</span>
        </h2>

        <div className="space-y-3 text-xs text-slate-200 leading-relaxed">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
            <p className="font-bold text-sm text-amber-300">⚠️ AVERTISSEMENT IMPORTANT DE SÉCURITÉ ET DE RESPONSABILITÉ :</p>
            <p>
              Le service <strong>Toujours Vivant</strong> est fourni <strong>"EN L'ÉTAT" ("AS IS")</strong>, à titre d'outil d'aide personnelle et d'expérimentation, <strong>SANS AUCUNE GARANTIE DE FONCTIONNEMENT, DE DISPONIBILITÉ OU DE FIABILITÉ (0% SLA)</strong>.
            </p>
          </div>

          <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
            <li>
              <strong>Pas un service de secours d'urgence :</strong> Toujours Vivant ne remplace en aucun cas les services officiels de secours (SAMU 15, Pompiers 18, Numéro d'urgence européen 112).
            </li>
            <li>
              <strong>Absence de garantie d'acheminement des alertes :</strong> La délivrance des pings et des e-mails d'alerte dépend d'infrastructures tierces (réseau mobile, serveurs e-mail, filtres anti-spam, fournisseurs cloud). Aucun acheminement ne peut être garanti à 100%.
            </li>
            <li>
              <strong>Exonération totale de responsabilité :</strong> L'éditeur ne saurait être tenu responsable d'aucun dommage direct ou indirect, panne réseau, dysfonctionnement technique, retard d'alerte ou non-réception d'un message par vos contacts d'urgence.
            </li>
          </ul>
        </div>
      </div>

      {/* 3. Protection des Données Personnelles (RGPD) */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-purple-400" />
          <span>3. Politique de Confidentialité & Protection des Données (RGPD)</span>
        </h2>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div>
            <h3 className="font-bold text-slate-100 text-sm mb-1">A. Responsable du Traitement</h3>
            <p>
              Le responsable du traitement des données personnelles est Philippe Vienne (<a href="mailto:philippegeek@gmail.com" className="text-emerald-400 hover:underline">philippegeek@gmail.com</a>).
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-100 text-sm mb-1">B. Données Collectées & Finalité</h3>
            <p className="mb-2">L'application traite uniquement les données strictement nécessaires au fonctionnement du service de check-in et d'alerte :</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
              <li><strong>Données de profil utilisateur :</strong> Nom, prénom, adresse e-mail (fournis via l'authentification Google).</li>
              <li><strong>Contacts d'urgence :</strong> Noms et adresses e-mail des personnes de confiance désignées par l'utilisateur.</li>
              <li><strong>Données de check-in :</strong> Horodatage des pings, fréquence sélectionnée et coordonnées GPS temporaires (si partagées).</li>
            </ul>
            <p className="mt-2">
              <strong>Finalité exclusive :</strong> Envoi automatique d'e-mails d'alerte à vos contacts de confiance. Vos données ne sont ni revendues, ni cédées à des tiers.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-100 text-sm mb-1">C. Vos Droits (Accès, Rectification, Suppression)</h3>
            <p>
              Conformément au RGPD (Articles 15 à 22), vous disposez d'un droit d'accès, de rectification et d'effacement complet de vos données. Pour exercer ce droit, contactez : <a href="mailto:philippegeek@gmail.com" className="text-emerald-400 hover:underline">philippegeek@gmail.com</a>.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Licence Logicielle Open Source (GNU AGPLv3) */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-indigo-400" />
          <span>4. Licence Open Source GNU Affero General Public License (AGPL-3.0)</span>
        </h2>
        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            Le code source complet du projet <strong>Toujours Vivant</strong> est publié sous licence libre <strong>GNU AGPLv3 (GNU Affero General Public License v3.0)</strong>.
          </p>
          <p>
            Vous êtes libre de consulter, modifier, auditer et auto-héberger le code source. Toute redistribution ou version modifiée hébergée sur réseau doit obligatoirement rendre son code source accessible sous licence AGPLv3.
          </p>
        </div>
      </div>

      {/* Back to Home */}
      <div className="pt-2 flex justify-center">
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
        >
          &larr; Retour au Tableau de Bord
        </Link>
      </div>

    </div>
  );
}
