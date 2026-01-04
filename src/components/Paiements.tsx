import { useState, useEffect, useMemo } from 'react';
import { DollarSign, Plus, Calendar, CreditCard, User, Building2, Download, Search, Filter, X, ArrowUpDown } from 'lucide-react';
import api, { Paiement, Contrat } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3000/api';

export default function Paiements() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    modePaiement: '',
    dateDebut: '',
    dateFin: '',
    montantMin: '',
    montantMax: '',
  });
  const [sortBy, setSortBy] = useState<'date' | 'montant' | 'locataire'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paiementsData, contratsData] = await Promise.all([
        api.paiements.getAll(),
        api.contrats.getActifs(),
      ]);
      setPaiements(paiementsData);
      setContrats(contratsData);
      console.log('Contrats chargés:', contratsData);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const genererQuittance = async (paiementId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pdf/quittance/${paiementId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération');
      }

      const data = await response.json();
      window.open(`http://localhost:3000${data.url}`, '_blank');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération de la quittance');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let moisConcerneFormatted = formData.mois_concerne;
    if (moisConcerneFormatted.length === 7) {
      moisConcerneFormatted += '-01';
    }

    const dataToSend = {
      ...formData,
      contrat_id: Number(formData.contrat_id),
      montant_paye: Number(formData.montant_paye),
      mois_concerne: moisConcerneFormatted,
    };

    try {
      if (editingId) {
        await api.paiements.update(editingId, dataToSend);
        alert('Paiement modifié avec succès');
      } else {
        await api.paiements.create(dataToSend);
        alert('Paiement enregistré avec succès');
      }

      setShowForm(false);
      setFormData({});
      setEditingId(null);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      modePaiement: '',
      dateDebut: '',
      dateFin: '',
      montantMin: '',
      montantMax: '',
    });
  };

  const toggleSort = (field: 'date' | 'montant' | 'locataire') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedPaiements = useMemo(() => {
    let result = [...paiements];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.locataire_nom?.toLowerCase().includes(search) ||
        p.bien_adresse?.toLowerCase().includes(search) ||
        p.reference?.toLowerCase().includes(search)
      );
    }

    if (filters.modePaiement) {
      result = result.filter(p => p.mode_paiement === filters.modePaiement);
    }

    if (filters.dateDebut) {
      result = result.filter(p => p.date_paiement >= filters.dateDebut);
    }

    if (filters.dateFin) {
      result = result.filter(p => p.date_paiement <= filters.dateFin);
    }

    if (filters.montantMin) {
      result = result.filter(p => Number(p.montant_paye) >= Number(filters.montantMin));
    }

    if (filters.montantMax) {
      result = result.filter(p => Number(p.montant_paye) <= Number(filters.montantMax));
    }

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date_paiement).getTime() - new Date(b.date_paiement).getTime();
          break;
        case 'montant':
          comparison = Number(a.montant_paye) - Number(b.montant_paye);
          break;
        case 'locataire':
          comparison = (a.locataire_nom || '').localeCompare(b.locataire_nom || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [paiements, searchTerm, filters, sortBy, sortOrder]);

  const hasActiveFilters = searchTerm || Object.values(filters).some(v => v);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-800">Paiements</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => api.paiements.downloadHistoriquePDF()}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Download className="w-5 h-5" />
            Historique PDF
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              const today = new Date().toISOString().split('T')[0];
              const currentMonth = new Date().toISOString().substring(0, 7);
              setFormData({
                date_paiement: today,
                mois_concerne: currentMonth,
                mode_paiement: 'especes',
              });
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Enregistrer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par locataire, bien ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtres
            {hasActiveFilters && !showFilters && (
              <span className="bg-white text-green-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
              <select
                value={filters.modePaiement}
                onChange={(e) => setFilters({ ...filters, modePaiement: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                <option value="">Tous</option>
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="virement">Virement</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <input
                type="date"
                value={filters.dateDebut}
                onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <input
                type="date"
                value={filters.dateFin}
                onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant min (FCFA)</label>
              <input
                type="number"
                value={filters.montantMin}
                onChange={(e) => setFilters({ ...filters, montantMin: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant max (FCFA)</label>
              <input
                type="number"
                value={filters.montantMax}
                onChange={(e) => setFilters({ ...filters, montantMax: e.target.value })}
                placeholder="1000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Trier par:</span>
          <button
            onClick={() => toggleSort('date')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === 'date' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Date
            {sortBy === 'date' && <ArrowUpDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => toggleSort('montant')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === 'montant' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Montant
            {sortBy === 'montant' && <ArrowUpDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => toggleSort('locataire')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === 'locataire' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Locataire
            {sortBy === 'locataire' && <ArrowUpDown className="w-3 h-3" />}
          </button>
          <span className="text-sm text-gray-500 ml-auto">
            {filteredAndSortedPaiements.length} résultat{filteredAndSortedPaiements.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Modifier le paiement' : 'Nouveau paiement'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Contrat *</label>
                <select
                  required
                  value={formData.contrat_id || ''}
                  onChange={(e) => {
                    const contratId = e.target.value;
                    setFormData({ ...formData, contrat_id: contratId });
                    console.log('Contrat sélectionné:', contratId);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un contrat</option>
                  {contrats.map((contrat) => {
                    const id = contrat.id || contrat.contrat_id;
                    const montant = Number(contrat.montant_loyer || 0);

                    return (
                      <option key={id} value={id}>
                        {contrat.locataire_nom} - {contrat.bien_adresse} ({montant.toLocaleString('fr-FR')} FCFA)
                      </option>
                    );
                  })}
                </select>
                {contrats.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    Aucun contrat actif trouvé. Créez d'abord un contrat.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de paiement *</label>
                <input
                  type="date"
                  required
                  value={formData.date_paiement || ''}
                  onChange={(e) => setFormData({ ...formData, date_paiement: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mois concerné *</label>
                <input
                  type="month"
                  required
                  value={formData.mois_concerne || ''}
                  onChange={(e) => setFormData({ ...formData, mois_concerne: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant payé (FCFA) *</label>
                <input
                  type="number"
                  required
                  value={formData.montant_paye || ''}
                  onChange={(e) => setFormData({ ...formData, montant_paye: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement *</label>
                <select
                  required
                  value={formData.mode_paiement || ''}
                  onChange={(e) => setFormData({ ...formData, mode_paiement: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="especes">Espèces</option>
                  <option value="cheque">Chèque</option>
                  <option value="virement">Virement</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Référence</label>
                <input
                  type="text"
                  value={formData.reference || ''}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Numéro de chèque, référence de virement..."
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
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {filteredAndSortedPaiements.map((paiement) => (
          <div
            key={paiement.id}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">Paiement #{paiement.id}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(paiement.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{paiement.locataire_nom}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>{paiement.bien_adresse}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="w-4 h-4" />
                    <span className="capitalize">{paiement.mode_paiement.replace('_', ' ')}</span>
                  </div>
                  {paiement.reference && (
                    <div className="md:col-span-2 text-gray-600 text-xs">
                      Réf: {paiement.reference}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {Number(paiement.montant_paye).toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-sm text-gray-500">Montant payé</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => genererQuittance(paiement.id)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Quittance
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setEditingId(paiement.id);
                      setFormData({
                        contrat_id: paiement.contrat_id,
                        date_paiement: paiement.date_paiement.split('T')[0],
                        mois_concerne: paiement.mois_concerne.substring(0, 7),
                        montant_paye: paiement.montant_paye,
                        mode_paiement: paiement.mode_paiement,
                        reference: paiement.reference || '',
                      });
                    }}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                  >
                    Modifier
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedPaiements.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {hasActiveFilters ? 'Aucun paiement ne correspond aux critères de recherche' : 'Aucun paiement enregistré'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}
