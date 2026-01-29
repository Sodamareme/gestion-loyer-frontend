import { useState, useEffect } from 'react';
import { 
  MessageSquare, Clock, CheckCircle, XCircle, Eye, AlertCircle,
  Send, Filter, Search, Calendar, MapPin, Phone, Mail, User,
  Bell, TrendingUp, Activity, FileText, Loader, X
} from 'lucide-react';
import AgenceNotificationsEcheances from './AgenceNotificationsEcheances';

import api, { Demande } from '../services/api';

interface Stats {
  total: number;
  en_attente: number;
  vue: number;
  en_cours: number;
  resolue: number;
  rejetee: number;
  urgentes: number;
  haute_priorite: number;
}

export default function AgenceDemandes() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    en_attente: 0,
    vue: 0,
    en_cours: 0,
    resolue: 0,
    rejetee: 0,
    urgentes: 0,
    haute_priorite: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterUrgence, setFilterUrgence] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [reponseText, setReponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [newDemandesCount, setNewDemandesCount] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadDemandes();
    const interval = setInterval(() => {
      checkNewDemandes();
    }, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  const loadDemandes = async () => {
    try {
      setLoading(true);
      const [demandesData, statsData] = await Promise.all([
        api.demandes.getAll(),
        api.demandes.getStats()
      ]);
      
      setDemandes(demandesData);
      setStats(statsData);
      
      // Compter les nouvelles demandes (en_attente)
      const nouvelles = demandesData.filter((d: Demande) => d.statut === 'en_attente').length;
      if (nouvelles > newDemandesCount && newDemandesCount > 0) {
        setShowNotification(true);
        playNotificationSound();
      }
      setNewDemandesCount(nouvelles);
    } catch (error: any) {
      console.error('Erreur chargement demandes:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkNewDemandes = async () => {
    try {
      const demandesData = await api.demandes.getAll();
      const nouvelles = demandesData.filter((d: Demande) => d.statut === 'en_attente').length;
      
      if (nouvelles > newDemandesCount) {
        setShowNotification(true);
        playNotificationSound();
        setDemandes(demandesData);
        setNewDemandesCount(nouvelles);
      }
    } catch (error) {
      console.error('Erreur vérification nouvelles demandes:', error);
    }
  };

  const playNotificationSound = () => {
    // Jouer un son de notification (optionnel)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjKM0fPTgjMGHm7A7+OZRQ0PVbXp7qlVGAo+ktvuzW0kCSpux/Hciy8IH2K97OSVSAwRU6/n7aRQGQs4ht/yw2ohBTKK0PPTgjMGHW++7+CXRw0OVbXp7qlVGApFnuDyvmwhBjaL0PPTgjMGHm/A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGApFnuDyvmwhBjaL0PPTgjMGHm7A7+CXRw0OVbXp76lVGA==');
    audio.play().catch(() => {});
  };

  const handleUpdateStatut = async (demandeId: number, nouveauStatut: string) => {
    try {
      setSubmitting(true);
      const demande = demandes.find(d => d.id === demandeId);
      
      await api.demandes.updateStatut(demandeId, {
        statut: nouveauStatut as any,
        note_agence: reponseText || undefined,
        source_demande: demande?.source_demande
      });

      setMessage({ type: 'success', text: 'Demande mise à jour avec succès' });
      setSelectedDemande(null);
      setReponseText('');
      loadDemandes();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      'en_attente': 'bg-amber-100 text-amber-700 border-amber-200',
      'vue': 'bg-blue-100 text-blue-700 border-blue-200',
      'en_cours': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'resolue': 'bg-green-100 text-green-700 border-green-200',
      'rejetee': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[statut] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatutIcon = (statut: string) => {
    const icons: Record<string, any> = {
      'en_attente': Clock,
      'vue': Eye,
      'en_cours': Loader,
      'resolue': CheckCircle,
      'rejetee': XCircle
    };
    const Icon = icons[statut] || AlertCircle;
    return <Icon className="w-4 h-4" />;
  };

  const getUrgenceColor = (urgence: string) => {
    const colors: Record<string, string> = {
      'basse': 'bg-slate-100 text-slate-600',
      'normale': 'bg-blue-100 text-blue-600',
      'haute': 'bg-orange-100 text-orange-600',
      'urgente': 'bg-red-100 text-red-600'
    };
    return colors[urgence] || 'bg-gray-100 text-gray-600';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'reparation': '🔧',
      'entretien': '🧹',
      'incident': '⚠️',
      'information': 'ℹ️',
      'plainte': '📢',
      'autre': '📋'
    };
    return icons[type] || '📋';
  };

  const filteredDemandes = demandes.filter(demande => {
    const matchStatut = filterStatut === 'all' || demande.statut === filterStatut;
    const matchUrgence = filterUrgence === 'all' || demande.urgence === filterUrgence;
    const matchSearch = searchTerm === '' || 
      demande.sujet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.locataire_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.bien_adresse?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchStatut && matchUrgence && matchSearch;
  });

  const statsData = [
    { label: 'Total', value: stats.total, color: 'from-blue-500 to-cyan-500', icon: MessageSquare },
    { label: 'En attente', value: stats.en_attente, color: 'from-amber-500 to-orange-500', icon: Clock },
    { label: 'En cours', value: stats.en_cours, color: 'from-cyan-500 to-blue-500', icon: Activity },
    { label: 'Résolues', value: stats.resolue, color: 'from-green-500 to-emerald-500', icon: CheckCircle },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification nouvelle demande */}
      {showNotification && newDemandesCount > 0 && (
        <div className="fixed top-20 right-4 z-50 animate-slideIn">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-2xl p-6 max-w-md">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-full animate-pulse">
                <Bell className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Nouvelle demande !</h3>
                <p className="text-white/90">
                  {newDemandesCount} demande{newDemandesCount > 1 ? 's' : ''} en attente de traitement
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            Gestion des Demandes
          </h1>
          <p className="text-slate-600 mt-1">Suivez et répondez aux demandes de vos locataires</p>
        </div>
        <button
          onClick={loadDemandes}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg"
        >
          <TrendingUp className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border-2 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-600 font-semibold mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Rechercher
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Sujet, locataire, adresse..."
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Statut
            </label>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="vue">Vue</option>
              <option value="en_cours">En cours</option>
              <option value="resolue">Résolue</option>
              <option value="rejetee">Rejetée</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Urgence
            </label>
            <select
              value={filterUrgence}
              onChange={(e) => setFilterUrgence(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">Toutes les urgences</option>
              <option value="urgente">Urgente</option>
              <option value="haute">Haute</option>
              <option value="normale">Normale</option>
              <option value="basse">Basse</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      {filteredDemandes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-lg border border-slate-200 text-center">
          <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-semibold text-lg">
            {demandes.length === 0 ? 'Aucune demande reçue' : 'Aucune demande ne correspond à vos filtres'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredDemandes.map((demande) => (
            <div
              key={`${demande.source_demande || 'normale'}-${demande.id}`}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-3xl">{getTypeIcon(demande.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-xl font-black text-slate-900">{demande.sujet}</h3>
                      {demande.source_demande === 'publique' && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                          📢 Demande publique
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(demande.date_creation).toLocaleDateString('fr-FR')}</span>
                      {demande.bien_adresse && (
                        <>
                          <span className="text-slate-300">•</span>
                          <MapPin className="w-4 h-4" />
                          <span>{demande.bien_adresse}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getUrgenceColor(demande.urgence)}`}>
                    {demande.urgence}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 flex items-center gap-1.5 ${getStatutColor(demande.statut)}`}>
                    {getStatutIcon(demande.statut)}
                    {demande.statut.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className="text-slate-700 mb-4 leading-relaxed">{demande.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Demandeur
                  </div>
                  <p className="font-semibold text-slate-900">
                    {demande.locataire_nom} {demande.locataire_prenom}
                  </p>
                  {demande.locataire_telephone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                      <Phone className="w-3 h-3" />
                      {demande.locataire_telephone}
                    </div>
                  )}
                  {demande.locataire_email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                      <Mail className="w-3 h-3" />
                      {demande.locataire_email}
                    </div>
                  )}
                </div>

                {demande.note_agence && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-green-700 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      Votre réponse
                    </div>
                    <p className="text-slate-700 text-sm bg-white p-3 rounded-lg border border-green-200">
                      {demande.note_agence}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedDemande(demande)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Répondre / Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de réponse */}
      {selectedDemande && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-t-3xl relative">
              <button
                onClick={() => {
                  setSelectedDemande(null);
                  setReponseText('');
                }}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <h2 className="text-2xl font-black text-white pr-12">{selectedDemande.sujet}</h2>
              <p className="text-blue-100 mt-1">Demande #{selectedDemande.id}</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
                <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  Description
                </h3>
                <p className="text-slate-700 leading-relaxed">{selectedDemande.description}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Votre réponse
                </label>
                <textarea
                  rows={5}
                  value={reponseText}
                  onChange={(e) => setReponseText(e.target.value)}
                  placeholder="Écrivez votre réponse au locataire..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Changer le statut
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { statut: 'vue', label: 'Marquer comme vue', color: 'bg-blue-500 hover:bg-blue-600' },
                    { statut: 'en_cours', label: 'En cours', color: 'bg-cyan-500 hover:bg-cyan-600' },
                    { statut: 'resolue', label: 'Résolue', color: 'bg-green-500 hover:bg-green-600' },
                    { statut: 'rejetee', label: 'Rejeter', color: 'bg-red-500 hover:bg-red-600' },
                  ].map((action) => (
                    <button
                      key={action.statut}
                      onClick={() => handleUpdateStatut(selectedDemande.id, action.statut)}
                      disabled={submitting}
                      className={`px-4 py-3 ${action.color} text-white rounded-xl transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg`}
                    >
                      {submitting ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {getStatutIcon(action.statut)}
                          {action.label}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}