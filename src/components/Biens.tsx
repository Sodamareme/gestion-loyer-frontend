import { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Home, Maximize, CheckCircle, XCircle, Edit2, Trash2, AlertCircle, Search, Filter, ChevronDown, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🔗 API URL (Biens):', API_BASE_URL); // Pour debug


interface Proprietaire {
  id: number;
  nom: string;
  telephone: string;
  email?: string;
  adresse?: string;
}

interface Bien {
  id: number;
  numero_bien: string;
  proprietaire_id: number;
  adresse: string;
  type: 'chambre' | 'appartement' | 'maison' | 'studio' | 'villa' | 'bureau' | 'commerce';
  surface: number;
  nombre_pieces: number;
  description?: string;
  statut: string;
  proprietaire_nom?: string;
  proprietaire_telephone?: string;
}

type SortOption = 'recent' | 'adresse' | 'surface' | 'pieces';

export default function Biens() {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBien, setEditingBien] = useState<Bien | null>(null);
  const [formData, setFormData] = useState<Partial<Bien>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'disponible' | 'loue'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [proprietaireFilter, setProprietaireFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [minSurface, setMinSurface] = useState('');
  const [maxSurface, setMaxSurface] = useState('');
  const [minPieces, setMinPieces] = useState('');
  const [maxPieces, setMaxPieces] = useState('');

  const biensTypes = ['chambre', 'appartement', 'maison', 'studio', 'villa', 'bureau', 'commerce'] as const;

  // Fonction pour récupérer le token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token manquant. Veuillez vous reconnecter.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const loadData = async () => {
    try {
      const headers = getAuthHeaders();
      
      const [biensRes, propsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/biens`, { headers }),
        fetch(`${API_BASE_URL}/proprietaires`, { headers })
      ]);

      if (!biensRes.ok || !propsRes.ok) {
        if (biensRes.status === 401 || propsRes.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        throw new Error('Erreur lors du chargement des données');
      }

      const biensData = await biensRes.json();
      const propsData = await propsRes.json();
      setBiens(biensData);
      setProprietaires(propsData);
    } catch (error: any) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: error.message || 'Erreur lors du chargement des données' });
      
      // Rediriger vers la page de connexion si le token est invalide
      if (error.message.includes('Token manquant') || error.message.includes('Session expirée')) {
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedBiens = () => {
    let filtered = biens;

    if (searchTerm) {
      filtered = filtered.filter(
        (b) =>
          b.adresse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.numero_bien?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.proprietaire_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.statut === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((b) => b.type === typeFilter);
    }

    if (proprietaireFilter !== 'all') {
      filtered = filtered.filter((b) => b.proprietaire_id === Number(proprietaireFilter));
    }

    if (minSurface) {
      filtered = filtered.filter((b) => b.surface >= Number(minSurface));
    }

    if (maxSurface) {
      filtered = filtered.filter((b) => b.surface <= Number(maxSurface));
    }

    if (minPieces) {
      filtered = filtered.filter((b) => b.nombre_pieces >= Number(minPieces));
    }

    if (maxPieces) {
      filtered = filtered.filter((b) => b.nombre_pieces <= Number(maxPieces));
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'adresse':
          return a.adresse.localeCompare(b.adresse);
        case 'surface':
          return b.surface - a.surface;
        case 'pieces':
          return b.nombre_pieces - a.nombre_pieces;
        case 'recent':
        default:
          return b.id - a.id;
      }
    });

    return sorted;
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const headers = getAuthHeaders();
    
    if (editingBien) {
      const res = await fetch(`${API_BASE_URL}/biens/${editingBien.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        throw new Error('Erreur lors de la modification');
      }
      setMessage({ type: 'success', text: 'Bien modifié avec succès' });
    } else {
      // ✅ VALIDATION DES DONNÉES AVANT L'ENVOI
      if (!formData.proprietaire_id || !formData.type || !formData.adresse || 
          !formData.surface || !formData.nombre_pieces) {
        setMessage({ 
          type: 'error', 
          text: 'Veuillez remplir tous les champs obligatoires' 
        });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/biens`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          proprietaire_id: formData.proprietaire_id,
          type: formData.type,
          adresse: formData.adresse,
          surface: formData.surface,
          nombre_pieces: formData.nombre_pieces,
          description: formData.description || null
        }),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        // ✅ Afficher le message d'erreur du serveur
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }
      setMessage({ type: 'success', text: 'Bien créé avec succès' });
    }
    setShowForm(false);
    setEditingBien(null);
    setFormData({});
    loadData();
    setTimeout(() => setMessage(null), 3000);
  } catch (error: any) {
    console.error('Erreur:', error);
    setMessage({ type: 'error', text: error.message });
    
    if (error.message.includes('Session expirée')) {
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2000);
    }
  }
};

  const handleEdit = (bien: Bien) => {
    setEditingBien(bien);
    setFormData({
      adresse: bien.adresse,
      surface: bien.surface,
      nombre_pieces: bien.nombre_pieces,
      description: bien.description,
      statut: bien.statut
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const headers = getAuthHeaders();
      
      const res = await fetch(`${API_BASE_URL}/biens/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        const error = await res.json();
        throw new Error(error.message || 'Erreur lors de la suppression');
      }

      setMessage({ type: 'success', text: 'Bien supprimé avec succès' });
      setDeleteConfirm(null);
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: error.message });
      setDeleteConfirm(null);
      
      if (error.message.includes('Session expirée')) {
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
      }
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setProprietaireFilter('all');
    setMinSurface('');
    setMaxSurface('');
    setMinPieces('');
    setMaxPieces('');
    setSortBy('recent');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || proprietaireFilter !== 'all' || minSurface || maxSurface || minPieces || maxPieces || sortBy !== 'recent';

  const filteredBiens = getFilteredAndSortedBiens();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Biens Immobiliers</h1>
            <p className="text-sm text-gray-500 mt-1">{filteredBiens.length} bien(s) trouvé(s)</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingBien(null);
            setFormData({});
          }}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors shadow-md w-fit"
        >
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {editingBien ? 'Modifier le bien' : 'Nouveau bien'}
          </h2>
          {editingBien && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Bien :</strong> {editingBien.type} • {editingBien.numero_bien}
                <br />
                <strong>Propriétaire :</strong> {editingBien.proprietaire_nom}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                ℹ️ Le type et le propriétaire ne peuvent pas être modifiés
              </p>
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!editingBien && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Propriétaire *
                    </label>
                    <select
                      value={formData.proprietaire_id || ''}
                      onChange={(e) => setFormData({ ...formData, proprietaire_id: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner un propriétaire</option>
                      {proprietaires.map((prop) => (
                        <option key={prop.id} value={prop.id}>
                          {prop.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Bien['type'] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Sélectionner</option>
                      {biensTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
                <input
                  type="text"
                  value={formData.adresse || ''}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              {editingBien && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    disabled
                    value={formData.type || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  >
                    <option>{editingBien.type}</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Le type ne peut pas être modifié
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Surface (m²) *</label>
                <input
                  type="number"
                  value={formData.surface || ''}
                  onChange={(e) => setFormData({ ...formData, surface: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de pièces *
                </label>
                <input
                  type="number"
                  value={formData.nombre_pieces || ''}
                  onChange={(e) => setFormData({ ...formData, nombre_pieces: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              {editingBien && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut *</label>
                  <select
                    value={formData.statut || ''}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="loue">Loué</option>
                  </select>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingBien(null);
                  setFormData({});
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {editingBien ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between gap-3 p-4 bg-gradient-to-r from-gray-50 to-orange-50 hover:bg-gray-100 transition-colors border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-gray-800">Filtres et recherche</span>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">
                {[searchTerm, statusFilter !== 'all', typeFilter !== 'all', proprietaireFilter !== 'all', minSurface, maxSurface, minPieces, maxPieces, sortBy !== 'recent'].filter(Boolean).length}
              </span>
            )}
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="p-6 space-y-4 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Adresse, description, propriétaire..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 placeholder:text-gray-400"
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 cursor-pointer"
                >
                  <option value="all">Tous</option>
                  <option value="disponible">Disponible</option>
                  <option value="loue">Loué</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type de bien</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 cursor-pointer"
                >
                  <option value="all">Tous</option>
                  {biensTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Propriétaire</label>
                <select
                  value={proprietaireFilter}
                  onChange={(e) => setProprietaireFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 cursor-pointer"
                >
                  <option value="all">Tous</option>
                  {proprietaires.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Surface min (m²)</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={minSurface}
                  onChange={(e) => setMinSurface(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Surface max (m²)</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxSurface}
                  onChange={(e) => setMaxSurface(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pièces min</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPieces}
                  onChange={(e) => setMinPieces(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pièces max</label>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPieces}
                  onChange={(e) => setMaxPieces(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trier par</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 cursor-pointer"
                >
                  <option value="recent">Plus récent</option>
                  <option value="adresse">Adresse (A-Z)</option>
                  <option value="surface">Surface (plus grand)</option>
                  <option value="pieces">Pièces (plus)</option>
                </select>
              </div>
            </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBiens.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-md">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {biens.length === 0 ? 'Aucun bien enregistré' : 'Aucun bien ne correspond à vos critères'}
            </p>
            {biens.length > 0 && (
              <p className="text-sm text-gray-400 mt-2">Essayez de modifier vos filtres</p>
            )}
          </div>
        ) : (
          filteredBiens.map((bien) => (
            <div
              key={bien.id}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Home className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                {bien.statut === 'disponible' ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    Disponible
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 text-sm font-medium bg-red-50 px-3 py-1 rounded-full">
                    <XCircle className="w-4 h-4" />
                    Loué
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 capitalize">
                    {bien.type} • {bien.numero_bien}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{bien.adresse}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Maximize className="w-4 h-4" />
                    <span>{bien.surface} m²</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    <span>{bien.nombre_pieces} pièces</span>
                  </div>
                </div>
                {bien.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{bien.description}</p>
                )}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Propriétaire</p>
                  <p className="text-sm font-medium text-gray-700">{bien.proprietaire_nom}</p>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => handleEdit(bien)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Modifier</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(bien.id)}
                    disabled={bien.statut === 'loue'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={bien.statut === 'loue' ? 'Impossible de supprimer un bien loué' : ''}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Supprimer</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce bien ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}