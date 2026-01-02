import { useState, useEffect, useMemo } from 'react';
import { UserCircle, Plus, Edit2, Phone, Mail, MapPin, Search, Filter, X, ArrowUpDown } from 'lucide-react';
import api, { Proprietaire } from '../services/api';

export default function Proprietaires() {
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Proprietaire>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    hasEmail: '',
    phonePrefix: '',
  });
  const [sortBy, setSortBy] = useState<'nom' | 'telephone'>('nom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadProprietaires();
  }, []);

  const loadProprietaires = async () => {
    try {
      const data = await api.proprietaires.getAll();
      setProprietaires(data);
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
        await api.proprietaires.update(editingId, formData as Omit<Proprietaire, 'id' | 'created_at'>);
      } else {
        await api.proprietaires.create(formData as Omit<Proprietaire, 'id' | 'created_at'>);
      }
      setShowForm(false);
      setFormData({});
      setEditingId(null);
      loadProprietaires();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleEdit = (proprietaire: Proprietaire) => {
    setFormData(proprietaire);
    setEditingId(proprietaire.id);
    setShowForm(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      hasEmail: '',
      phonePrefix: '',
    });
  };

  const toggleSort = (field: 'nom' | 'telephone') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedProprietaires = useMemo(() => {
    let result = [...proprietaires];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nom?.toLowerCase().includes(search) ||
        p.telephone?.toLowerCase().includes(search) ||
        p.email?.toLowerCase().includes(search) ||
        p.adresse?.toLowerCase().includes(search)
      );
    }

    if (filters.hasEmail === 'yes') {
      result = result.filter(p => p.email && p.email.trim() !== '');
    } else if (filters.hasEmail === 'no') {
      result = result.filter(p => !p.email || p.email.trim() === '');
    }

  
    if (filters.phonePrefix) {
      result = result.filter(p => p.telephone?.startsWith(filters.phonePrefix));
    }
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'nom':
          comparison = (a.nom || '').localeCompare(b.nom || '');
          break;
        case 'telephone':
          comparison = (a.telephone || '').localeCompare(b.telephone || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [proprietaires, searchTerm, filters, sortBy, sortOrder]);

  const hasActiveFilters = searchTerm || Object.values(filters).some(v => v);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Propriétaires</h1>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setFormData({});
            setEditingId(null);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, email ou adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtres
            {hasActiveFilters && !showFilters && (
              <span className="bg-white text-blue-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                !
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <X className="w-5 h-5" />
              Réinitialiser
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <select
                value={filters.hasEmail}
                onChange={(e) => setFilters({ ...filters, hasEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Tous</option>
                <option value="yes">Avec email</option>
                <option value="no">Sans email</option>
              </select>
            </div>

              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Préfixe téléphone</label>
              <select
                value={filters.phonePrefix}
                onChange={(e) => setFilters({ ...filters, phonePrefix: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Tous</option>
                <option value="77">77 (Orange)</option>
                <option value="78">78 (Free)</option>
                <option value="76">76 (Expresso)</option>
                <option value="70">70 (Promobile)</option>
                <option value="75">75 (autre)</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Trier par:</span>
          <button
            onClick={() => toggleSort('nom')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === 'nom' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Nom
            {sortBy === 'nom' && <ArrowUpDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => toggleSort('telephone')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === 'telephone' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Téléphone
            {sortBy === 'telephone' && <ArrowUpDown className="w-3 h-3" />}
          </button>
          <span className="text-sm text-gray-500 ml-auto">
            {filteredAndSortedProprietaires.length} résultat{filteredAndSortedProprietaires.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {editingId ? 'Modifier le propriétaire' : 'Nouveau propriétaire'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.nom || ''}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                <input
                  type="tel"
                  required
                  value={formData.telephone || ''}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <input
                  type="text"
                  value={formData.adresse || ''}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedProprietaires.map((proprietaire) => (
          <div
            key={proprietaire.id}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <UserCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{proprietaire.nom}</h3>
                </div>
              </div>
              <button
                onClick={() => handleEdit(proprietaire)}
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{proprietaire.telephone}</span>
              </div>
              {proprietaire.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{proprietaire.email}</span>
                </div>
              )}
              {proprietaire.adresse && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{proprietaire.adresse}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedProprietaires.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {hasActiveFilters ? 'Aucun propriétaire ne correspond aux critères de recherche' : 'Aucun propriétaire enregistré'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}
