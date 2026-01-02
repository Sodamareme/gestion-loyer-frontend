import { useState, useEffect, useMemo } from 'react';
import { FileText, Plus, Calendar, DollarSign, User, Building2, Edit2, X, Search, Filter, RotateCcw, Archive, ArchiveRestore } from 'lucide-react';
import api, { Contrat, Bien, Locataire } from '../services/api';

export default function Contrats() {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Contrat & { type_locataire?: string, charges_structurelles?: number, charges_periode?: number, montant_eau?: number, montant_internet?: number, tva?: number }>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'montant' | 'locataire'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [filterArchive, setFilterArchive] = useState<'actifs' | 'archives' | 'tous'>('actifs');

  useEffect(() => {
    loadData();
  }, [filterArchive]);

  const loadData = async () => {
    try {
      let contratsData;
      
      if (filterArchive === 'actifs') {
        contratsData = await api.contrats.getAll(false);
      } else if (filterArchive === 'archives') {
        contratsData = await api.contrats.getArchives();
      } else {
        contratsData = await api.contrats.getAll(true);
      }

      const [biensData, locatairesData] = await Promise.all([
        api.biens.getDisponibles(),
        api.locataires.getAll(),
      ]);

      const contratsNormalises = contratsData.map((c: any) => ({
        ...c,
        id: c.id ?? c.contrat_id,
      }));

      setContrats(contratsNormalises);
      setBiens(biensData);
      setLocataires(locatairesData);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedContrats = useMemo(() => {
    let filtered = [...contrats];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.locataire_nom?.toLowerCase().includes(term) ||
          c.bien_adresse?.toLowerCase().includes(term) ||
          c.proprietaire_nom?.toLowerCase().includes(term)
      );
    }

    if (filterStatut !== 'tous') {
      filtered = filtered.filter((c) => (c.statut || c.contrat_statut) === filterStatut);
    }

    if (filterDateDebut) {
      filtered = filtered.filter((c) => new Date(c.date_debut) >= new Date(filterDateDebut));
    }

    if (filterDateFin) {
      filtered = filtered.filter((c) => new Date(c.date_fin) <= new Date(filterDateFin));
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'montant':
          return b.montant_loyer - a.montant_loyer;
        case 'locataire':
          return (a.locataire_nom || '').localeCompare(b.locataire_nom || '');
        case 'date':
        default:
          return new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime();
      }
    });

    return filtered;
  }, [contrats, searchTerm, filterStatut, filterDateDebut, filterDateFin, sortBy]);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatut('tous');
    setFilterDateDebut('');
    setFilterDateFin('');
    setSortBy('date');
  };

  const handleLocataireChange = (id: number) => {
    const locataire = locataires.find(l => l.id === id);
    const type = locataire?.type || '';
    setFormData({ ...formData, locataire_id: id, type_locataire: type });
  };

  const handleEdit = (contrat: Contrat) => {
    const locataire = locataires.find(l => l.id === contrat.locataire_id);
    const type = locataire?.type || '';

    // Formater les dates au format YYYY-MM-DD
    const formatDate = (date: string) => {
      if (!date) return '';
      return date.split('T')[0];
    };

    setEditMode(true);
    setEditingId(contrat.id!);
    setShowForm(true);
    setFormData({
      bien_id: contrat.bien_id,
      locataire_id: contrat.locataire_id,
      date_debut: formatDate(contrat.date_debut),
      date_fin: formatDate(contrat.date_fin),
      montant_loyer: contrat.montant_loyer,
      montant_caution: contrat.montant_caution,
      jour_paiement: contrat.jour_paiement,
      charges_structurelles: contrat.charges_structurelles || 0,
      charges_periode: contrat.charges || 0,
      montant_eau: contrat.montant_eau || 0,
      montant_internet: contrat.montant_internet || 0,
      tva: contrat.tva || 0,
      type_locataire: type,
      statut: contrat.statut || contrat.contrat_statut
    });
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir archiver ce contrat ?')) return;
    
    try {
      await api.contrats.archiver(id);
      alert('Contrat archivé avec succès');
      loadData();
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'archivage: ' + error.message);
    }
  };

  const handleUnarchive = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir désarchiver ce contrat ?')) return;
    
    try {
      await api.contrats.desarchiver(id);
      alert('Contrat désarchivé avec succès');
      loadData();
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur lors du désarchivage: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingId(null);
    setShowForm(false);
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalData = { ...formData };
    if (formData.type_locataire === 'commerce') {
      finalData.montant_internet = 0;
      finalData.tva = formData.tva || 0;
    } else {
      finalData.montant_internet = formData.montant_internet || 0;
      finalData.tva = 0;
    }

    // Formater les dates au format YYYY-MM-DD
    if (finalData.date_debut) {
      finalData.date_debut = finalData.date_debut.split('T')[0];
    }
    if (finalData.date_fin) {
      finalData.date_fin = finalData.date_fin.split('T')[0];
    }

    try {
      if (editMode && editingId) {
        await api.contrats.update(editingId, finalData as Partial<Contrat>);
        alert('Contrat modifié avec succès !');
      } else {
        await api.contrats.create(finalData as Omit<Contrat, 'id' | 'statut' | 'created_at' | 'locataire_nom' | 'bien_adresse' | 'proprietaire_nom'>);
        alert('Contrat créé avec succès !');
      }
      handleCancelEdit();
      loadData();
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-gray-800">Contrats</h1>
        </div>
        <button
          onClick={() => {
            setEditMode(false);
            setEditingId(null);
            setShowForm(true);
            setFormData({});
          }}
          className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          Nouveau contrat
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par locataire, bien ou propriétaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-[300px]"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={filterArchive}
                onChange={(e) => setFilterArchive(e.target.value as 'actifs' | 'archives' | 'tous')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="actifs">Contrats actifs</option>
                <option value="archives">Contrats archivés</option>
                <option value="tous">Tous les contrats</option>
              </select>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters ? 'bg-teal-50 border-teal-600 text-teal-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtres
              </button>
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                title="Réinitialiser les filtres"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="actif">Actif</option>
                  <option value="termine">Terminé</option>
                  <option value="resilie">Résilié</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date début après</label>
                <input
                  type="date"
                  value={filterDateDebut}
                  onChange={(e) => setFilterDateDebut(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date fin avant</label>
                <input
                  type="date"
                  value={filterDateFin}
                  onChange={(e) => setFilterDateFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'montant' | 'locataire')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="date">Date (récent)</option>
                  <option value="montant">Montant (élevé)</option>
                  <option value="locataire">Locataire (A-Z)</option>
                </select>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            {filteredAndSortedContrats.length} contrat{filteredAndSortedContrats.length > 1 ? 's' : ''} trouvé{filteredAndSortedContrats.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {editMode ? 'Modifier le contrat' : 'Nouveau contrat'}
            </h2>
            <button
              onClick={handleCancelEdit}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bien *</label>
                <select
                  required
                  disabled={editMode}
                  value={formData.bien_id || ''}
                  onChange={e => setFormData({ ...formData, bien_id: Number(e.target.value) })}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${editMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Sélectionner un bien</option>
                  {biens.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.adresse} ({b.type})
                    </option>
                  ))}
                </select>
                {editMode && (
                  <p className="text-xs text-gray-500 mt-1">Le bien ne peut pas être modifié</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Locataire *</label>
                <select
                  required
                  disabled={editMode}
                  value={formData.locataire_id || ''}
                  onChange={e => handleLocataireChange(Number(e.target.value))}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${editMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Sélectionner un locataire</option>
                  {locataires.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.nom}
                    </option>
                  ))}
                </select>
                {editMode && (
                  <p className="text-xs text-gray-500 mt-1">Le locataire ne peut pas être modifié</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date début *
                </label>
                <input
                  type="date"
                  required
                  disabled={editMode}
                  value={formData.date_debut || ''}
                  onChange={e => setFormData({ ...formData, date_debut: e.target.value })}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${editMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date fin {!editMode && '*'}
                </label>
                <input
                  type="date"
                  required={!editMode}
                  value={formData.date_fin || ''}
                  onChange={e => setFormData({ ...formData, date_fin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                {editMode && (
                  <p className="text-xs text-gray-500 mt-1">Modifiez uniquement si nécessaire</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant loyer (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.montant_loyer || ''}
                  onChange={e => setFormData({ ...formData, montant_loyer: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caution (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.montant_caution || ''}
                  onChange={e => setFormData({ ...formData, montant_caution: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jour de paiement *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={31}
                  value={formData.jour_paiement || ''}
                  onChange={e => setFormData({ ...formData, jour_paiement: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Charges structurelles (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.charges_structurelles || ''}
                  onChange={e => setFormData({ ...formData, charges_structurelles: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Charges période (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.charges_periode || ''}
                  onChange={e => setFormData({ ...formData, charges_periode: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant eau (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.montant_eau || ''}
                  onChange={e => setFormData({ ...formData, montant_eau: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {formData.type_locataire === 'particulier' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant Internet (FCFA)
                  </label>
                  <input
                    type="number"
                    value={formData.montant_internet || ''}
                    onChange={e => setFormData({ ...formData, montant_internet: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              )}

              {formData.type_locataire === 'commerce' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TVA (FCFA)</label>
                  <input
                    type="number"
                    value={formData.tva || ''}
                    onChange={e => setFormData({ ...formData, tva: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              )}

              {editMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={formData.statut || ''}
                    onChange={e => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="actif">Actif</option>
                    <option value="termine">Terminé</option>
                    <option value="resilie">Résilié</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                {editMode ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {filteredAndSortedContrats.map((contrat) => (
          <div
            key={contrat.id}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      Contrat #{contrat.id}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          (contrat.statut || contrat.contrat_statut) === 'actif'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {contrat.statut || contrat.contrat_statut}
                      </span>
                      {(contrat.archive === true || contrat.archive === 1) && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                          Archivé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{contrat.locataire_nom}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>{contrat.bien_adresse}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(contrat.date_debut).toLocaleDateString('fr-FR')} -{' '}
                      {new Date(contrat.date_fin).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Jour {contrat.jour_paiement} du mois</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-teal-600">
                    {Number(contrat.montant_loyer).toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-sm text-gray-500">Loyer mensuel</p>
                </div>
                {contrat.montant_caution > 0 && (
                  <p className="text-sm text-gray-600">
                    Caution: {Number(contrat.montant_caution).toLocaleString('fr-FR')} FCFA
                  </p>
                )}
                <div className="flex gap-2">
                  {!(contrat.archive === true || contrat.archive === 1) ? (
                    <>
                      <button
                        onClick={() => handleEdit(contrat)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleArchive(contrat.id!)}
                        className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                      >
                        <Archive className="w-4 h-4" />
                        Archiver
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleUnarchive(contrat.id!)}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <ArchiveRestore className="w-4 h-4" />
                      Désarchiver
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedContrats.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {contrats.length === 0
              ? 'Aucun contrat enregistré'
              : 'Aucun contrat ne correspond aux critères de recherche'}
          </p>
        </div>
      )}
    </div>
  );
}