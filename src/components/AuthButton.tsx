'use client';

import { useState } from 'react';
import { 
  signInWithGoogle, 
  signOutUser, 
  isSupabaseConfigured 
} from '@/lib/supabase';
import { useAuthSession } from '@/lib/useAuthSession';
import { LogOut, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';

export function AuthButton() {
  const { user, loading, setUser } = useAuthSession();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConfigNotice, setShowConfigNotice] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      setShowConfigNotice(true);
      return;
    }

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err?.message || 'Échec de l\'authentification Google.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (err: any) {
      setAuthError('Erreur de déconnexion.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 text-xs font-medium">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        <span>Chargement...</span>
      </div>
    );
  }

  // User is logged in
  if (user) {
    const userAvatar = user.user_metadata?.avatar_url;
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';

    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 shadow-inner">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={userName} 
              className="w-6 h-6 rounded-full border border-emerald-500/40 object-cover" 
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="text-xs font-medium text-slate-200 max-w-[120px] truncate">
            {userName}
          </span>
        </div>

        <button
          onClick={handleSignOut}
          title="Se déconnecter"
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 transition-all text-xs flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Déconnexion</span>
        </button>
      </div>
    );
  }

  // User is logged out
  return (
    <div className="relative">
      <button
        onClick={handleGoogleSignIn}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold shadow-md hover:shadow-indigo-500/10 transition-all"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Connexion Google</span>
      </button>

      {/* Config requirement notice modal/popover */}
      {showConfigNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3 text-amber-400">
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-slate-100">Configuration Supabase Requise</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  L'authentification Google s'appuie sur le service Supabase Auth. Pour l'activer, vous devez spécifier vos identifiants dans le fichier <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 text-[11px]">.env.local</code>.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-3 text-[11px] font-mono text-slate-300 border border-slate-800 space-y-1">
              <div>NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...</div>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed">
              Ensuite, activez le fournisseur <strong>Google</strong> dans le tableau de bord Supabase (<em>Authentication &gt; Providers</em>).
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowConfigNotice(false)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {authError && (
        <div className="mt-1 text-[11px] text-rose-400 font-medium">
          {authError}
        </div>
      )}
    </div>
  );
}
