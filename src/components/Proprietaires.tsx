import { useState, useEffect, useMemo } from 'react';
import { UserCircle, Plus, Edit2, Phone, Mail, MapPin, Search, Filter, X, ArrowUpDown, Grid3x3, List, Upload, ImageIcon, CheckCircle } from 'lucide-react';
import api, { Proprietaire } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Proprietaires() {
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Proprietaire>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  // 🆕 Fichiers CNI
  const [carteIdentiteRecto, setCarteIdentiteRecto] = useState<File | null>(null);
  const [carteIdentiteVerso, setCarteIdentiteVerso] = useState<File | null>(null);
  const [previewRecto, setPreviewRecto] = useState<string>('');
  const [previewVerso, setPreviewVerso] = useState<string>('');

  // 🆕 Modal CNI
  const [showCniModal, setShowCniModal] = useState<{ proprietaire: Proprietaire } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ hasEmail: '', phonePrefix: '' });
  const [sortBy, setSortBy] = useState<'nom' | 'telephone'>('nom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  useEffect(() => { loadProprietaires(); }, []);

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

  // 🆕 Gestion fichiers CNI
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'recto' | 'verso') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert(`Le fichier ${side} est trop volumineux. Max 5MB`); return; }
    const setFile = side === 'recto' ? setCarteIdentiteRecto : setCarteIdentiteVerso;
    const setPreview = side === 'recto' ? setPreviewRecto : setPreviewVerso;
    setFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else { setPreview(''); }
  };

  const removeFile = (side: 'recto' | 'verso') => {
    if (side === 'recto') { setCarteIdentiteRecto(null); setPreviewRecto(''); }
    else { setCarteIdentiteVerso(null); setPreviewVerso(''); }
  };

  const resetForm = () => {
    setShowForm(false); setFormData({}); setEditingId(null);
    setCarteIdentiteRecto(null); setCarteIdentiteVerso(null);
    setPreviewRecto(''); setPreviewVerso('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.proprietaires.update(editingId, formData as Omit<Proprietaire, 'id' | 'created_at'>);
        alert('✅ Propriétaire mis à jour !');
      } else {
        if (carteIdentiteRecto && carteIdentiteVerso) {
          const fd = new FormData();
          Object.entries(formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) fd.append(key, String(value));
          });
          fd.append('carte_identite_recto', carteIdentiteRecto);
          fd.append('carte_identite_verso', carteIdentiteVerso);
          await api.proprietaires.create(fd as any);
        } else {
          await api.proprietaires.create(formData as Omit<Proprietaire, 'id' | 'created_at'>);
        }
        alert('✅ Propriétaire créé !');
      }
      resetForm();
      loadProprietaires();
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur: ' + (error as Error).message);
    }
  };

  const handleEdit = (proprietaire: Proprietaire) => {
    setFormData(proprietaire); setEditingId(proprietaire.id); setShowForm(true);
  };

  const resetFilters = () => { setSearchTerm(''); setFilters({ hasEmail: '', phonePrefix: '' }); };

  const toggleSort = (field: 'nom' | 'telephone') => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const getCniUrl = (filename: string) => `${API_BASE_URL}/uploads/cni/${filename}`;

  const filteredAndSortedProprietaires = useMemo(() => {
    let result = [...proprietaires];
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nom?.toLowerCase().includes(search) || p.telephone?.toLowerCase().includes(search) ||
        p.email?.toLowerCase().includes(search) || p.adresse?.toLowerCase().includes(search)
      );
    }
    if (filters.hasEmail === 'yes') result = result.filter(p => p.email && p.email.trim() !== '');
    else if (filters.hasEmail === 'no') result = result.filter(p => !p.email || p.email.trim() === '');
    if (filters.phonePrefix) result = result.filter(p => p.telephone?.startsWith(filters.phonePrefix));
    result.sort((a, b) => {
      const comparison = (a[sortBy] || '').localeCompare(b[sortBy] || '');
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [proprietaires, searchTerm, filters, sortBy, sortOrder]);

  const hasActiveFilters = searchTerm || Object.values(filters).some(v => v);

  // 🆕 Composant zone d'upload
  const UploadZone = ({ side, file, preview }: { side: 'recto' | 'verso'; file: File | null; preview: string }) => (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1 uppercase">{side}</p>
      {file ? (
        <div className="relative border-2 border-green-400 bg-green-50 rounded-lg p-2">
          <button type="button" onClick={() => removeFile(side)} className="absolute top-1 right-1 p-0.5 bg-red-100 hover:bg-red-200 rounded-full z-10">
            <X className="w-3 h-3 text-red-600" />
          </button>
          {preview
            ? <img src={preview} alt={side} className="max-h-24 mx-auto rounded object-contain" />
            : <div className="flex items-center gap-2 py-1 pr-5"><Upload className="w-6 h-6 text-green-600 flex-shrink-0" /><span className="text-xs text-green-700 truncate">{file.name}</span></div>
          }
          <p className="text-center text-xs text-green-600 mt-1">✓ Chargé</p>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center px-3 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
          <Upload className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-xs text-gray-500">JPG, PNG, PDF</span>
          <input type="file" accept="image/jpeg,image/jpg,image/png,application/pdf" onChange={(e) => handleFileChange(e, side)} className="hidden" />
        </label>
      )}
    </div>
  );

  // 🆕 Badge CNI cliquable
  const CniBadge = ({ proprietaire }: { proprietaire: Proprietaire }) => {
    const hasRecto = !!(proprietaire as any).carte_identite_recto;
    const hasVerso = !!(proprietaire as any).carte_identite_verso;
    if (!hasRecto && !hasVerso) return <span className="text-xs text-gray-400 italic">—</span>;
    return (
      <button
        onClick={() => setShowCniModal({ proprietaire })}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
          hasRecto && hasVerso ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
        }`}
      >
        <ImageIcon className="w-3 h-3" />
        {hasRecto && hasVerso ? '2 photos' : '1 photo'}
      </button>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6">

      {/* 🆕 Modal photos CNI */}
      {showCniModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setShowCniModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Carte d'identité</h2>
                <p className="text-sm text-gray-500">{showCniModal.proprietaire.nom}</p>
              </div>
              <button onClick={() => setShowCniModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* RECTO */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3 text-center">RECTO</p>
                {(showCniModal.proprietaire as any).carte_identite_recto ? (
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    {(showCniModal.proprietaire as any).carte_identite_recto.endsWith('.pdf') ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-gray-50">
                        <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                        <a href={getCniUrl((showCniModal.proprietaire as any).carte_identite_recto)} target="_blank" rel="noopener noreferrer" className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                          Ouvrir le PDF
                        </a>
                      </div>
                    ) : (
                      <img src={getCniUrl((showCniModal.proprietaire as any).carte_identite_recto)} alt="CNI Recto" className="w-full object-contain max-h-64" />
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 bg-gray-50">
                    <ImageIcon className="w-10 h-10 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">Non fourni</p>
                  </div>
                )}
              </div>

              {/* VERSO */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3 text-center">VERSO</p>
                {(showCniModal.proprietaire as any).carte_identite_verso ? (
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    {(showCniModal.proprietaire as any).carte_identite_verso.endsWith('.pdf') ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-gray-50">
                        <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                        <a href={getCniUrl((showCniModal.proprietaire as any).carte_identite_verso)} target="_blank" rel="noopener noreferrer" className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                          Ouvrir le PDF
                        </a>
                      </div>
                    ) : (
                      <img src={getCniUrl((showCniModal.proprietaire as any).carte_identite_verso)} alt="CNI Verso" className="w-full object-contain max-h-64" />
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 bg-gray-50">
                    <ImageIcon className="w-10 h-10 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">Non fourni</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => setShowCniModal(null)} className="mt-6 w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Propriétaires</h1>
            <p className="text-sm text-gray-500 mt-1">{filteredAndSortedProprietaires.length} propriétaire(s)</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormData({}); setEditingId(null); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text" placeholder="Rechercher par nom, téléphone, email ou adresse..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showFilters || hasActiveFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <Filter className="w-5 h-5" />
              Filtres
            </button>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                <X className="w-5 h-5" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <select value={filters.hasEmail} onChange={(e) => setFilters({ ...filters, hasEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                <option value="">Tous</option>
                <option value="yes">Avec email</option>
                <option value="no">Sans email</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Préfixe téléphone</label>
              <select value={filters.phonePrefix} onChange={(e) => setFilters({ ...filters, phonePrefix: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
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
          {(['nom', 'telephone'] as const).map(field => (
            <button key={field} onClick={() => toggleSort(field)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${sortBy === field ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {field === 'nom' ? 'Nom' : 'Téléphone'}
              {sortBy === field && <ArrowUpDown className="w-3 h-3" />}
            </button>
          ))}
          <span className="text-sm text-gray-500 ml-auto">
            {filteredAndSortedProprietaires.length} résultat{filteredAndSortedProprietaires.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {editingId ? 'Modifier le propriétaire' : 'Nouveau propriétaire'}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                <input type="text" required value={formData.nom || ''} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                <input type="tel" required value={formData.telephone || ''} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <input type="text" value={formData.adresse || ''} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            {/* 🆕 Upload CNI dans le formulaire admin */}
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carte d'identité — recto et verso</label>
                <p className="text-xs text-gray-500 mb-3">JPG, PNG ou PDF — max 5MB chacune</p>
                <div className="grid grid-cols-2 gap-4">
                  <UploadZone side="recto" file={carteIdentiteRecto} preview={previewRecto} />
                  <UploadZone side="verso" file={carteIdentiteVerso} preview={previewVerso} />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {editingId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vue Carte */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProprietaires.map((proprietaire) => (
            <div key={proprietaire.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-full"><UserCircle className="w-6 h-6 text-blue-600" /></div>
                  <h3 className="font-semibold text-lg text-gray-800">{proprietaire.nom}</h3>
                </div>
                <button onClick={() => handleEdit(proprietaire)} className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" /><span className="text-sm">{proprietaire.telephone}</span></div>
                {proprietaire.email && <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" /><span className="text-sm">{proprietaire.email}</span></div>}
                {proprietaire.adresse && <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4" /><span className="text-sm">{proprietaire.adresse}</span></div>}
                {/* 🆕 Badge CNI */}
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <CniBadge proprietaire={proprietaire} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Vue Liste
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNI</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedProprietaires.map((proprietaire) => (
                  <tr key={proprietaire.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full"><UserCircle className="w-5 h-5 text-blue-600" /></div>
                        <span className="font-medium text-gray-800">{proprietaire.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" /><span>{proprietaire.telephone}</span></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {proprietaire.email
                        ? <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" /><span>{proprietaire.email}</span></div>
                        : <span className="text-gray-400 text-sm">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {proprietaire.adresse
                        ? <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4 flex-shrink-0" /><span className="line-clamp-2">{proprietaire.adresse}</span></div>
                        : <span className="text-gray-400 text-sm">—</span>}
                    </td>
                    {/* 🆕 Colonne CNI */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CniBadge proprietaire={proprietaire} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleEdit(proprietaire)} className="text-blue-600 hover:text-blue-700 transition-colors">
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredAndSortedProprietaires.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {hasActiveFilters ? 'Aucun propriétaire ne correspond aux critères' : 'Aucun propriétaire enregistré'}
          </p>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="mt-4 text-blue-600 hover:text-blue-700 font-medium">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}