'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Mail, Phone, Check, Copy, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { EmergencyContact } from '@/types';
import { getAuthHeaders } from '@/lib/supabase';

interface ContactsManagerProps {
  initialContacts: EmergencyContact[];
  onContactsChange?: () => void;
  userId?: string;
  userEmergencyToken?: string;
}

export function ContactsManager({ initialContacts, onContactsChange, userId, userEmergencyToken }: ContactsManagerProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>(initialContacts);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync internal state when parent initialContacts prop updates from API
  useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Veuillez indiquer au minimum le nom de votre proche.');
      return;
    }

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ name, email: email.trim() || undefined, phone: phone.trim() || undefined, notifyByEmail: Boolean(email.trim() && notifyByEmail) }),
      });

      const data = await res.json();
      if (data.success && data.contact) {
        setContacts(prev => [...prev, data.contact]);
        setName('');
        setEmail('');
        setPhone('');
        setIsAdding(false);
        if (onContactsChange) onContactsChange();
      } else {
        setError(data.error || 'Erreur lors de l\'ajout');
      }
    } catch (err) {
      console.error(err);
      setError('Échec de la sauvegarde');
    }
  };

  const handleRemoveContact = async (id: string) => {
    try {
      await fetch(`/api/contacts?id=${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
      setContacts(prev => prev.filter(c => c.id !== id));
      if (onContactsChange) onContactsChange();
    } catch (err) {
      console.error(err);
    }
  };

  const getContactLink = (contact: EmergencyContact) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://toujours-vivant.fr';
    return `${origin}/status/${contact.id}`;
  };

  const handleCopyContactLink = (contact: EmergencyContact) => {
    const url = getContactLink(contact);
    navigator.clipboard.writeText(url);
    setCopiedId(contact.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleWhatsAppContactShare = (contact: EmergencyContact) => {
    const url = getContactLink(contact);
    const message = `Bonjour ${contact.name}, voici ton lien personnel de sécurité Toujours Vivant pour vérifier que tout va bien : ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 backdrop-blur-xl p-7 sm:p-8 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/80 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 shrink-0">
            <Users className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Proches & Liens d'Urgence Individuels</h2>
            <p className="text-xs text-slate-400 mt-1">
              Chaque proche ajouté dispose de son propre lien de suivi avec aperçu visuel WhatsApp.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="self-start sm:self-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Annuler' : 'Ajouter un proche'}</span>
        </button>
      </div>

      {/* Add Contact Form */}
      {isAdding && (
        <form onSubmit={handleAddContact} className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4 animate-fade-in shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Ajouter un Proche</h3>
            <span className="text-[11px] text-purple-400 font-medium">Seul le Nom est obligatoire</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
            💡 <strong>Pas d'email ni de téléphone ?</strong> Indiquez uniquement son nom. Un lien de suivi personnel sera immédiatement généré pour que vous puissiez lui envoyer par WhatsApp, SMS ou Signal.
          </p>
          
          {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nom / Identifiant du proche <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maman, Thomas, Voisin Pierre..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Adresse E-mail (Optionnel)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marie.dupont@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Téléphone (Optionnel)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {email.trim() && (
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="notifyByEmail"
                checked={notifyByEmail}
                onChange={(e) => setNotifyByEmail(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <label htmlFor="notifyByEmail" className="text-xs text-slate-300 font-medium">
                Envoyer une alerte e-mail automatique en cas d'urgence
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all mt-2"
          >
            Créer et générer son lien dédié
          </button>
        </form>
      )}

      {/* Contacts List */}
      <div className="space-y-3">
        {contacts.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-400 text-xs sm:text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-1">
            <p className="font-semibold text-slate-300">Aucun proche configuré</p>
            <p className="text-slate-500">Ajoutez un proche par son nom pour lui générer son propre lien de suivi.</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shrink-0">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{contact.name}</span>
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      {contact.email ? (
                        <span className="flex items-center gap-1.5 min-w-0 break-all">
                          <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          {contact.email}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Sans e-mail (Lien individuel prêt)</span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {contact.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleCopyContactLink(contact)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all"
                    title={`Copier le lien de suivi personnel pour ${contact.name}`}
                  >
                    {copiedId === contact.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === contact.id ? 'Lien copié !' : 'Copier'}</span>
                  </button>

                  <button
                    onClick={() => handleWhatsAppContactShare(contact)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
                    title={`Partager directement sur WhatsApp avec ${contact.name}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-emerald-400 text-slate-950" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleRemoveContact(contact.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    title="Supprimer le contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dedicated link input box */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-mono">
                <LinkIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate select-all text-slate-300">{getContactLink(contact)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
