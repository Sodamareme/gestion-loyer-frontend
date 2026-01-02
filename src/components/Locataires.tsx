import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Phone, Mail, Search, Key, RefreshCw, Eye, EyeOff, CheckCircle, Filter, ChevronDown, X } from 'lucide-react';
import api, { Locataire, CreateLocataireResponse, ResetPasswordResponse } from '../services/api';

type SortOption = 'recent' | 'nom' | 'ancien';

export default function Locataires() {
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Locataire>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'particulier' | 'commerce'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);

  // Gestion des identifiants
  const [showCredentials, setShowCredentials] = useState<{ [key: number]: boolean }>({});
  const [resettingPassword, setResettingPassword] = useState<number | null>(null);
  
  // Modal de succès
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    info: string;
  } | null>(null);

  useEffect(() => {
    loadLocataires();
  }, []);

  const loadLocataires = async () => {
    try {
      const data = await api.locataires.getAll();
      setLocataires(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.locataires.update(editingId, formData as Omit<Locataire, 'id' | 'created_at'>);
        alert('✅ Locataire mis à jour avec succès !');
      } else {
        const result = await api.locataires.create(formData as Omit<Locataire, 'id' | 'created_at'>);
        
        if (result.credentials) {
          setCreatedCredentials(result.credentials);
          setShowSuccessModal(true);
        } else {
          alert('✅ Locataire créé avec succès !');
        }
      }
      setShowForm(false);
      setFormData({});
      setEditingId(null);
      loadLocataires();
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur: ' + (error as Error).message);
    }
  };

  const handleResetPassword = async (locataireId: number) => {
    if (!confirm('Réinitialiser le mot de passe de ce locataire ?')) return;
    
    setResettingPassword(locataireId);
    try {
      const result = await api.locataires.resetPassword(locataireId);
      
      setCreatedCredentials({
        email: locataires.find(l => l.id === locataireId)?.email || '',
        password: result.newPassword,
        info: result.info
      });
      setShowSuccessModal(true);
    } catch (error) {
      alert('❌ Erreur: ' + (error as Error).message);
    } finally {
      setResettingPassword(null);
    }
  };

  const toggleShowCredentials = (id: number) => {
    setShowCredentials(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✅ Copié dans le presse-papiers !');
  };

  // Fonction de filtrage et tri
  const getFilteredAndSortedLocataires = () => {
    let filtered = locataires;

    // Filtre de recherche
    if (searchTerm) {
      filtered = filtered.filter(l =>
        l.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(l => (l.type || 'particulier') === typeFilter);
    }

    // Tri
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'nom':
          return a.nom.localeCompare(b.nom);
        case 'ancien':
          return a.id - b.id;
        case 'recent':
        default:
          return b.id - a.id;
      }
    });

    return sorted;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setSortBy('recent');
  };

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || sortBy !== 'recent';
  const filteredLocataires = getFilteredAndSortedLocataires();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modal de succès avec identifiants */}
      {showSuccessModal && createdCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Compte créé avec succès !
              </h2>
              <p className="text-sm text-gray-600">
                {createdCredentials.info}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <label className="block text-xs font-semibold text-blue-800 mb-2">
                  📧 EMAIL DE CONNEXION
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdCredentials.email}
                    className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(createdCredentials.email)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium"
                  >
                    Copier
                  </button>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <label className="block text-xs font-semibold text-green-800 mb-2">
                  🔑 MOT DE PASSE
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdCredentials.password}
                    className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm font-mono font-bold"
                  />
                  <button
                    onClick={() => copyToClipboard(createdCredentials.password)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>IMPORTANT :</strong> Notez bien ces identifiants ou envoyez-les au locataire. 
                Le mot de passe ne sera plus affiché par la suite.
              </p>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                setCreatedCredentials(null);
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              J'ai noté les identifiants
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Locataires</h1>
            <p className="text-sm text-gray-500 mt-1">{filteredLocataires.length} locataire(s) trouvé(s)</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setFormData({ type: 'particulier' });
            setEditingId(null);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md w-fit"
        >
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      {/* Section Filtres */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between gap-3 p-4 bg-gradient-to-r from-gray-50 to-green-50 hover:bg-gray-100 transition-colors border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-800">Filtres et recherche</span>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                {[searchTerm, typeFilter !== 'all', sortBy !== 'recent'].filter(Boolean).length}
              </span>
            )}
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="p-6 space-y-4 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Recherche */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nom, téléphone, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder:text-gray-400"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Type de locataire */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 cursor-pointer"
                >
                  <option value="all">Tous</option>
                  <option value="particulier">Particulier</option>
                  <option value="commerce">Commerce</option>
                </select>
              </div>

              {/* Tri */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trier par</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 cursor-pointer"
                >
                  <option value="recent">Plus récent</option>
                  <option value="nom">Nom (A-Z)</option>
                  <option value="ancien">Plus ancien</option>
                </select>
              </div>
            </div>

            {/* Bouton de réinitialisation */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {editingId ? 'Modifier le locataire' : 'Nouveau locataire'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom || ''}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Amadou Diop"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telephone || ''}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="77 123 4567"
                />
                {!editingId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sera utilisé comme mot de passe par défaut
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="locataire@example.com"
                />
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ Identifiant de connexion
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de locataire
                </label>
                <select
                  value={formData.type || 'particulier'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="particulier">Particulier</option>
                  <option value="commerce">Commerce</option>
                </select>
              </div>
            </div>

            {!editingId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Key className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 font-semibold mb-1">
                      Compte créé automatiquement
                    </p>
                    <p className="text-xs text-blue-700">
                      Le locataire pourra se connecter avec :
                    </p>
                    <ul className="text-xs text-blue-700 mt-2 space-y-1">
                      <li>• <strong>Email :</strong> {formData.email || 'l\'email saisi ci-dessus'}</li>
                      <li>• <strong>Mot de passe :</strong> {formData.telephone ? formData.telephone.replace(/\s/g, '') : 'le téléphone (sans espaces)'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({});
                  setEditingId(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                {editingId ? 'Mettre à jour' : 'Créer le locataire'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des locataires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLocataires.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-md">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {locataires.length === 0 ? 'Aucun locataire enregistré' : 'Aucun locataire ne correspond à vos critères'}
            </p>
            {locataires.length > 0 && (
              <p className="text-sm text-gray-400 mt-2">Essayez de modifier vos filtres</p>
            )}
          </div>
        ) : (
          filteredLocataires.map((locataire) => (
            <div
              key={locataire.id}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{locataire.nom}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 capitalize">
                      {locataire.type || 'particulier'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFormData(locataire);
                    setEditingId(locataire.id);
                    setShowForm(true);
                  }}
                  className="text-gray-400 hover:text-green-600 transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{locataire.telephone}</span>
                </div>
                {locataire.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate" title={locataire.email}>
                      {locataire.email}
                    </span>
                  </div>
                )}
              </div>

              {/* Identifiants de connexion */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    Identifiants
                  </span>
                  <button
                    onClick={() => toggleShowCredentials(locataire.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title={showCredentials[locataire.id] ? 'Masquer' : 'Afficher'}
                  >
                    {showCredentials[locataire.id] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {showCredentials[locataire.id] && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email de connexion</p>
                      <p className="text-sm font-mono text-gray-800 break-all">
                        {locataire.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Mot de passe par défaut</p>
                      <p className="text-sm font-mono text-gray-800 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                        {locataire.telephone?.replace(/\s/g, '')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 italic">
                        (Téléphone sans espaces)
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleResetPassword(locataire.id)}
                  disabled={resettingPassword === locataire.id}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Réinitialise le mot de passe au numéro de téléphone"
                >
                  <RefreshCw className={`w-4 h-4 ${resettingPassword === locataire.id ? 'animate-spin' : ''}`} />
                  {resettingPassword === locataire.id ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}