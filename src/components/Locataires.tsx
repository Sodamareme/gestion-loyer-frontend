import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Phone, Mail, Search, Key, RefreshCw, Eye, EyeOff, CheckCircle, Filter, ChevronDown, X, Grid3x3, List, Upload, ImageIcon } from 'lucide-react';
import api, { Locataire, CreateLocataireResponse, ResetPasswordResponse } from '../services/api';

type SortOption = 'recent' | 'nom' | 'ancien';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Locataires() {
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Locataire>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  // 🆕 Fichiers CNI
  const [carteIdentiteRecto, setCarteIdentiteRecto] = useState<File | null>(null);
  const [carteIdentiteVerso, setCarteIdentiteVerso] = useState<File | null>(null);
  const [previewRecto, setPreviewRecto] = useState<string>('');
  const [previewVerso, setPreviewVerso] = useState<string>('');

  // 🆕 Modal CNI
  const [showCniModal, setShowCniModal] = useState<{ locataire: Locataire } | null>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'particulier' | 'commerce'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

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

  // 🆕 Gestion upload fichiers CNI
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'recto' | 'verso') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(`Le fichier ${side} est trop volumineux. Max 5MB`);
      return;
    }

    const setFile = side === 'recto' ? setCarteIdentiteRecto : setCarteIdentiteVerso;
    const setPreview = side === 'recto' ? setPreviewRecto : setPreviewVerso;

    setFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }
  };

  const removeFile = (side: 'recto' | 'verso') => {
    if (side === 'recto') { setCarteIdentiteRecto(null); setPreviewRecto(''); }
    else { setCarteIdentiteVerso(null); setPreviewVerso(''); }
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({});
    setEditingId(null);
    setCarteIdentiteRecto(null);
    setCarteIdentiteVerso(null);
    setPreviewRecto('');
    setPreviewVerso('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.locataires.update(editingId, formData as Omit<Locataire, 'id' | 'created_at'>);
        alert('✅ Locataire mis à jour avec succès !');
      } else {
        // 🆕 Construire FormData avec les fichiers si présents
        if (carteIdentiteRecto && carteIdentiteVerso) {
          const fd = new FormData();
          Object.entries(formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) fd.append(key, String(value));
          });
          fd.append('carte_identite_recto', carteIdentiteRecto);
          fd.append('carte_identite_verso', carteIdentiteVerso);
          const result = await api.locataires.create(fd as any);
          if (result.credentials) {
            setCreatedCredentials(result.credentials);
            setShowSuccessModal(true);
          }
        } else {
          const result = await api.locataires.create(formData as Omit<Locataire, 'id' | 'created_at'>);
          if (result.credentials) {
            setCreatedCredentials(result.credentials);
            setShowSuccessModal(true);
          } else {
            alert('✅ Locataire créé avec succès !');
          }
        }
      }
      resetForm();
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

  // 🆕 URL d'une photo CNI
  const getCniUrl = (filename: string) => `${API_BASE_URL}/uploads/cni/${filename}`;

  const getFilteredAndSortedLocataires = () => {
    let filtered = locataires;
    if (searchTerm) {
      filtered = filtered.filter(l =>
        l.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(l => (l.type || 'particulier') === typeFilter);
    }
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'nom': return a.nom.localeCompare(b.nom);
        case 'ancien': return a.id - b.id;
        default: return b.id - a.id;
      }
    });
  };

  const resetFilters = () => { setSearchTerm(''); setTypeFilter('all'); setSortBy('recent'); };
  const hasActiveFilters = searchTerm || typeFilter !== 'all' || sortBy !== 'recent';
  const filteredLocataires = getFilteredAndSortedLocataires();

  // 🆕 Composant zone d'upload réutilisable
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
        <label className="flex flex-col items-center justify-center px-3 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
          <Upload className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-xs text-gray-500">JPG, PNG, PDF</span>
          <input type="file" accept="image/jpeg,image/jpg,image/png,application/pdf" onChange={(e) => handleFileChange(e, side)} className="hidden" />
        </label>
      )}
    </div>
  );

  // 🆕 Badge CNI pour indiquer si les photos sont présentes
  const CniBadge = ({ locataire }: { locataire: Locataire }) => {
    const hasRecto = !!(locataire as any).carte_identite_recto;
    const hasVerso = !!(locataire as any).carte_identite_verso;
    if (!hasRecto && !hasVerso) return <span className="text-xs text-gray-400 italic">—</span>;
    return (
      <button
        onClick={() => setShowCniModal({ locataire })}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
          hasRecto && hasVerso
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
        }`}
      >
        <ImageIcon className="w-3 h-3" />
        {hasRecto && hasVerso ? '2 photos' : '1 photo'}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ✅ Modal succès identifiants */}
      {showSuccessModal && createdCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Compte créé avec succès !</h2>
              <p className="text-sm text-gray-600">{createdCredentials.info}</p>
            </div>
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <label className="block text-xs font-semibold text-blue-800 mb-2">📧 EMAIL DE CONNEXION</label>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={createdCredentials.email} className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm font-mono" />
                  <button onClick={() => copyToClipboard(createdCredentials.email)} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium">Copier</button>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <label className="block text-xs font-semibold text-green-800 mb-2">🔑 MOT DE PASSE</label>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={createdCredentials.password} className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm font-mono font-bold" />
                  <button onClick={() => copyToClipboard(createdCredentials.password)} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium">Copier</button>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-xs text-yellow-800">⚠️ <strong>IMPORTANT :</strong> Notez ces identifiants. Le mot de passe ne sera plus affiché.</p>
            </div>
            <button onClick={() => { setShowSuccessModal(false); setCreatedCredentials(null); }} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              J'ai noté les identifiants
            </button>
          </div>
        </div>
      )}

      {/* 🆕 Modal photos CNI */}
      {showCniModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setShowCniModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Carte d'identité</h2>
                <p className="text-sm text-gray-500">{showCniModal.locataire.nom}</p>
              </div>
              <button onClick={() => setShowCniModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* RECTO */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3 text-center">RECTO</p>
                {(showCniModal.locataire as any).carte_identite_recto ? (
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    {(showCniModal.locataire as any).carte_identite_recto.endsWith('.pdf') ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-gray-50">
                        <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Fichier PDF</p>
                        <a
                          href={getCniUrl((showCniModal.locataire as any).carte_identite_recto)}
                          target="_blank" rel="noopener noreferrer"
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                          Ouvrir le PDF
                        </a>
                      </div>
                    ) : (
                      <img
                        src={getCniUrl((showCniModal.locataire as any).carte_identite_recto)}
                        alt="CNI Recto"
                        className="w-full object-contain max-h-64"
                      />
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
                {(showCniModal.locataire as any).carte_identite_verso ? (
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    {(showCniModal.locataire as any).carte_identite_verso.endsWith('.pdf') ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-gray-50">
                        <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Fichier PDF</p>
                        <a
                          href={getCniUrl((showCniModal.locataire as any).carte_identite_verso)}
                          target="_blank" rel="noopener noreferrer"
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                          Ouvrir le PDF
                        </a>
                      </div>
                    ) : (
                      <img
                        src={getCniUrl((showCniModal.locataire as any).carte_identite_verso)}
                        alt="CNI Verso"
                        className="w-full object-contain max-h-64"
                      />
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
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Locataires</h1>
            <p className="text-sm text-gray-500 mt-1">{filteredLocataires.length} locataire(s) trouvé(s)</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormData({ type: 'particulier' }); setEditingId(null); }}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md w-fit"
        >
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 bg-gradient-to-r from-gray-50 to-green-50 border-b border-gray-100">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Filter className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-800">Filtres et recherche</span>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                {[searchTerm, typeFilter !== 'all', sortBy !== 'recent'].filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('card')} className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-6 space-y-4 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text" placeholder="Nom, téléphone, email..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 cursor-pointer">
                  <option value="all">Tous</option>
                  <option value="particulier">Particulier</option>
                  <option value="commerce">Commerce</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trier par</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 cursor-pointer">
                  <option value="recent">Plus récent</option>
                  <option value="nom">Nom (A-Z)</option>
                  <option value="ancien">Plus ancien</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              {hasActiveFilters && (
                <button onClick={resetFilters} className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                <input
                  type="text" required value={formData.nom || ''}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Amadou Diop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                <input
                  type="tel" required value={formData.telephone || ''}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="77 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email" required value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="locataire@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
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

            {/* 🆕 Upload CNI recto/verso dans le formulaire admin */}
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carte d'identité — recto et verso
                </label>
                <p className="text-xs text-gray-500 mb-3">JPG, PNG ou PDF — max 5MB chacune</p>
                <div className="grid grid-cols-2 gap-4">
                  <UploadZone side="recto" file={carteIdentiteRecto} preview={previewRecto} />
                  <UploadZone side="verso" file={carteIdentiteVerso} preview={previewVerso} />
                </div>
              </div>
            )}

            {!editingId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Key className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-800 font-semibold mb-1">Compte créé automatiquement</p>
                    <ul className="text-xs text-blue-700 mt-2 space-y-1">
                      <li>• <strong>Email :</strong> {formData.email || 'l\'email saisi ci-dessus'}</li>
                      <li>• <strong>Mot de passe :</strong> {formData.telephone ? formData.telephone.replace(/\s/g, '') : 'le téléphone (sans espaces)'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={resetForm} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleSubmit} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                {editingId ? 'Mettre à jour' : 'Créer le locataire'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vue Carte */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocataires.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-md">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{locataires.length === 0 ? 'Aucun locataire enregistré' : 'Aucun locataire ne correspond à vos critères'}</p>
            </div>
          ) : filteredLocataires.map((locataire) => (
            <div key={locataire.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
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
                <button onClick={() => { setFormData(locataire); setEditingId(locataire.id); setShowForm(true); }} className="text-gray-400 hover:text-green-600 transition-colors">
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
                    <span className="text-sm truncate">{locataire.email}</span>
                  </div>
                )}
                {/* 🆕 Badge CNI */}
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <CniBadge locataire={locataire} />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Key className="w-3 h-3" /> Identifiants
                  </span>
                  <button onClick={() => toggleShowCredentials(locataire.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    {showCredentials[locataire.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {showCredentials[locataire.id] && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-mono text-gray-800 break-all">{locataire.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Mot de passe par défaut</p>
                      <p className="text-sm font-mono text-gray-800 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                        {locataire.telephone?.replace(/\s/g, '')}
                      </p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => handleResetPassword(locataire.id)}
                  disabled={resettingPassword === locataire.id}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${resettingPassword === locataire.id ? 'animate-spin' : ''}`} />
                  {resettingPassword === locataire.id ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Vue Liste
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {filteredLocataires.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{locataires.length === 0 ? 'Aucun locataire enregistré' : 'Aucun locataire ne correspond à vos critères'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNI</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identifiants</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLocataires.map((locataire) => (
                    <tr key={locataire.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-2 rounded-full">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="font-medium text-gray-800">{locataire.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 capitalize">
                          {locataire.type || 'particulier'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{locataire.telephone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {locataire.email
                          ? <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" /><span className="truncate max-w-xs">{locataire.email}</span></div>
                          : <span className="text-gray-400 text-sm">—</span>
                        }
                      </td>
                      {/* 🆕 Colonne CNI */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CniBadge locataire={locataire} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleShowCredentials(locataire.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            {showCredentials[locataire.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleResetPassword(locataire.id)} disabled={resettingPassword === locataire.id} className="text-orange-600 hover:text-orange-700 transition-colors disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${resettingPassword === locataire.id ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                        {showCredentials[locataire.id] && (
                          <div className="mt-2 bg-gray-50 rounded p-2 text-xs space-y-1">
                            <div><span className="text-gray-500">Email:</span><p className="font-mono text-gray-800">{locataire.email}</p></div>
                            <div><span className="text-gray-500">MDP:</span><p className="font-mono text-gray-800">{locataire.telephone?.replace(/\s/g, '')}</p></div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button onClick={() => { setFormData(locataire); setEditingId(locataire.id); setShowForm(true); }} className="text-green-600 hover:text-green-700 transition-colors">
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}