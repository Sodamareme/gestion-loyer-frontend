import { useState, useEffect } from 'react';
import { 
  MessageSquare, Plus, Clock, CheckCircle, XCircle, 
  AlertCircle, Send, Building2, MapPin, Calendar,
  Eye, Filter, Search, FileText, Loader
} from 'lucide-react';
import { locataireApi } from '../services/api';

interface User {
  id: number;
  email: string;
  role: string;
  locataire_id: number;
  locataire_nom?: string;
  locataire_tel?: string;
}

interface Contrat {
  id: number;
  bien_id: number;
  bien_adresse?: string;
  numero_bien?: string;
}

interface Demande {
  id: number;
  bien_id: number;
  type: string;
  sujet: string;
  description: string;
  urgence: string;
  statut: string;
  note_agence?: string;
  date_creation: string;
  date_traitement?: string;
  bien_adresse?: string;
  numero_bien?: string;
  agence_nom?: string;
  agence_telephone?: string;
  agence_email?: string;
}

export default function LocataireDemandes({ user }: { user: User }) {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [filterStatut, setFilterStatut] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    bien_id: '',
    type: 'reparation',
    sujet: '',
    description: '',
    urgence: 'normale'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [demandesData, contratsData] = await Promise.all([
        locataireApi.getMesDemandes(),
        locataireApi.getMesContrats()
      ]);
      setDemandes(demandesData);
      setContrats(contratsData);
    } catch (error: any) {
      console.error('Erreur chargement:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validation complète
  if (!formData.bien_id || !formData.type || !formData.sujet || !formData.description || !formData.urgence) {
    setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' });
    return;
  }

  try {
    console.log('📤 Envoi demande avec données:', formData);
    
    const result = await locataireApi.createDemande({
      bien_id: Number(formData.bien_id),
      type: formData.type as 'reparation' | 'entretien' | 'incident' | 'information' | 'plainte' | 'autre',
      sujet: formData.sujet,
      description: formData.description,
      urgence: formData.urgence as 'basse' | 'normale' | 'haute' | 'urgente'
    });

    console.log('✅ Demande créée:', result);

    setMessage({ 
      type: 'success', 
      text: `Demande envoyée à ${result.agence_nom}` 
    });
    
    setShowForm(false);
    setFormData({
      bien_id: '',
      type: 'reparation',
      sujet: '',
      description: '',
      urgence: 'normale'
    });
    
    await loadData();
    setTimeout(() => setMessage(null), 4000);
  } catch (error: any) {
    console.error('❌ Erreur création demande:', error);
    setMessage({ type: 'error', text: error.message || 'Erreur lors de l\'envoi de la demande' });
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
    const matchSearch = searchTerm === '' || 
      demande.sujet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.bien_adresse?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchStatut && matchSearch;
  });

  const statsData = [
    { 
      label: 'Total', 
      value: demandes.length,
      color: 'from-blue-500 to-cyan-500',
      icon: MessageSquare 
    },
    { 
      label: 'En attente', 
      value: demandes.filter(d => d.statut === 'en_attente').length,
      color: 'from-amber-500 to-orange-500',
      icon: Clock 
    },
    { 
      label: 'En cours', 
      value: demandes.filter(d => d.statut === 'en_cours').length,
      color: 'from-cyan-500 to-blue-500',
      icon: Loader 
    },
    { 
      label: 'Résolues', 
      value: demandes.filter(d => d.statut === 'resolue').length,
      color: 'from-green-500 to-emerald-500',
      icon: CheckCircle 
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Mes Demandes</h1>
            <p className="text-slate-600 mt-1">Communiquez avec votre agence</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Demande
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Rechercher
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Sujet, description, adresse..."
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="all">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="vue">Vue</option>
                <option value="en_cours">En cours</option>
                <option value="resolue">Résolue</option>
                <option value="rejetee">Rejetée</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des demandes */}
        {filteredDemandes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-slate-200 text-center">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-semibold text-lg">
              {demandes.length === 0 ? 'Aucune demande envoyée' : 'Aucune demande ne correspond à vos filtres'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredDemandes.map((demande) => (
              <div
                key={demande.id}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{getTypeIcon(demande.type)}</div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{demande.sujet}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{demande.bien_adresse}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono font-semibold">{demande.numero_bien}</span>
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

                {demande.note_agence && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-bold text-blue-900">Réponse de l'agence</span>
                    </div>
                    <p className="text-slate-700">{demande.note_agence}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t-2 border-slate-100">
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(demande.date_creation).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {demande.agence_nom && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        <span className="font-semibold">{demande.agence_nom}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedDemande(demande)}
                    className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Formulaire */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-t-3xl">
                <h2 className="text-2xl font-black text-white">Nouvelle Demande</h2>
                <p className="text-blue-100 mt-1">Contactez votre agence</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Bien concerné *
                  </label>
                  <select
                    value={formData.bien_id}
                    onChange={(e) => setFormData({...formData, bien_id: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  >
                    <option value="">Sélectionner un bien</option>
                    {contrats.map((contrat) => (
                      <option key={contrat.id} value={contrat.bien_id}>
                        {contrat.numero_bien} - {contrat.bien_adresse}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    >
                      <option value="reparation">🔧 Réparation</option>
                      <option value="entretien">🧹 Entretien</option>
                      <option value="incident">⚠️ Incident</option>
                      <option value="information">ℹ️ Information</option>
                      <option value="plainte">📢 Plainte</option>
                      <option value="autre">📋 Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Urgence *
                    </label>
                    <select
                      value={formData.urgence}
                      onChange={(e) => setFormData({...formData, urgence: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    >
                      <option value="basse">Basse</option>
                      <option value="normale">Normale</option>
                      <option value="haute">Haute</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Sujet *
                  </label>
                  <input
                    type="text"
                    value={formData.sujet}
                    onChange={(e) => setFormData({...formData, sujet: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Ex: Fuite d'eau dans la cuisine"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Décrivez votre demande en détail..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        bien_id: '',
                        type: 'reparation',
                        sujet: '',
                        description: '',
                        urgence: 'normale'
                      });
                    }}
                    className="flex-1 px-6 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Détails */}
        {selectedDemande && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-t-3xl relative">
                <button
                  onClick={() => setSelectedDemande(null)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                >
                  <XCircle className="w-6 h-6 text-white" />
                </button>
                <h2 className="text-2xl font-black text-white">{selectedDemande.sujet}</h2>
                <p className="text-blue-100 mt-1">Demande #{selectedDemande.id}</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getUrgenceColor(selectedDemande.urgence)}`}>
                    Urgence: {selectedDemande.urgence}
                  </span>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 flex items-center gap-2 ${getStatutColor(selectedDemande.statut)}`}>
                    {getStatutIcon(selectedDemande.statut)}
                    {selectedDemande.statut.replace('_', ' ')}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-slate-600" />
                    <h3 className="font-bold text-slate-900">Bien concerné</h3>
                  </div>
                  <p className="text-lg font-semibold text-slate-700">{selectedDemande.numero_bien}</p>
                  <p className="text-slate-600">{selectedDemande.bien_adresse}</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <h3 className="font-bold text-slate-900">Description</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{selectedDemande.description}</p>
                </div>

                {selectedDemande.note_agence && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-blue-900">Réponse de l'agence</h3>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{selectedDemande.note_agence}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                    <p className="text-xs text-slate-500 font-bold mb-1">DATE DE CRÉATION</p>
                    <p className="text-slate-900 font-semibold">
                      {new Date(selectedDemande.date_creation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  {selectedDemande.date_traitement && (
                    <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                      <p className="text-xs text-slate-500 font-bold mb-1">DATE DE TRAITEMENT</p>
                      <p className="text-slate-900 font-semibold">
                        {new Date(selectedDemande.date_traitement).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {selectedDemande.agence_nom && (
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5 text-slate-600" />
                      <h3 className="font-bold text-slate-900">Agence</h3>
                    </div>
                    <p className="text-xl font-black text-slate-900 mb-3">{selectedDemande.agence_nom}</p>
                    {selectedDemande.agence_telephone && (
                      <p className="text-slate-600 mb-1">📞 {selectedDemande.agence_telephone}</p>
                    )}
                    {selectedDemande.agence_email && (
                      <p className="text-slate-600">✉️ {selectedDemande.agence_email}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}