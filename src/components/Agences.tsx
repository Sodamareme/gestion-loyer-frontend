import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, MapPin, Phone, Mail, User, Users, Home, FileText, X, Check, Search, Filter, Grid, List } from 'lucide-react';
import api from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}`
  : 'http://localhost:3000';

interface Agence {
  id: number;
  nom: string;
  code: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  ville?: string;
  pays: string;
  responsable_nom?: string;
  responsable_telephone?: string;
  responsable_email?: string;
  logo?: string;
  description?: string;
  actif: boolean;
  nombre_proprietaires: number;
  nombre_locataires: number;
  nombre_biens: number;
  nombre_contrats: number;
  date_creation: string;
}

export default function Agences() {
  const [agencesList, setAgencesList] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgence, setEditingAgence] = useState<Agence | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActif, setFilterActif] = useState<'tous' | 'actif' | 'inactif'>('tous');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    ville: '',
    pays: 'Sénégal',
    responsable_nom: '',
    responsable_telephone: '',
    responsable_email: '',
    description: '',
    actif: true
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    loadAgences();
  }, []);

  const loadAgences = async () => {
    try {
      // ✅ CORRECTION 1: Ajout du await et stockage du résultat
      const data = await api.agences.getAll();
      console.log('📊 Agences chargées:', data); // Debug
      setAgencesList(data);
    } catch (error) {
      console.error('Erreur chargement agences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, String(value));
      });
      
      if (logoFile) {
        submitData.append('logo', logoFile);
      }

      if (editingAgence) {
        // ✅ CORRECTION 2: Utilisation de api.agences au lieu de agencesApi
        await api.agences.update(editingAgence.id, submitData);
      } else {
        // ✅ CORRECTION 3: Utilisation de api.agences au lieu de agencesApi
        await api.agences.create(submitData);
      }

      loadAgences();
      resetForm();
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(error.response?.data?.error || error.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (agence: Agence) => {
    setEditingAgence(agence);
    setFormData({
      nom: agence.nom,
      adresse: agence.adresse || '',
      telephone: agence.telephone || '',
      email: agence.email || '',
      ville: agence.ville || '',
      pays: agence.pays,
      responsable_nom: agence.responsable_nom || '',
      responsable_telephone: agence.responsable_telephone || '',
      responsable_email: agence.responsable_email || '',
      description: agence.description || '',
      actif: agence.actif
    });
    if (agence.logo) {
      setPreviewUrl(`${API_BASE_URL}/uploads/logos/${agence.logo}`);
    }
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette agence ?')) return;

    try {
      // ✅ CORRECTION 4: Utilisation de api.agences au lieu de agencesApi
      await api.agences.delete(id);
      loadAgences();
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(error.response?.data?.error || error.message || 'Erreur lors de la suppression');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      adresse: '',
      telephone: '',
      email: '',
      ville: '',
      pays: 'Sénégal',
      responsable_nom: '',
      responsable_telephone: '',
      responsable_email: '',
      description: '',
      actif: true
    });
    setLogoFile(null);
    setPreviewUrl('');
    setEditingAgence(null);
    setShowForm(false);
  };

  const filteredAgences = agencesList.filter(agence => {
    const matchSearch = agence.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       agence.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       agence.ville?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchFilter = filterActif === 'tous' ? true :
                       filterActif === 'actif' ? agence.actif :
                       !agence.actif;
    
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const AgenceCard = ({ agence }: { agence: Agence }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
      <div className={`p-6 ${agence.actif ? 'bg-gradient-to-r from-purple-50 to-purple-100' : 'bg-gray-100'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {agence.logo ? (
              <img 
                src={`${API_BASE_URL}/uploads/logos/${agence.logo}`} 
                alt={agence.nom}
                className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-md">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-800">{agence.nom}</h3>
                {agence.actif ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-300 text-gray-700 text-xs font-bold rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-purple-600 font-semibold">{agence.code}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(agence)}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(agence.id)}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {agence.description && (
          <p className="text-sm text-gray-600 mb-4">{agence.description}</p>
        )}

        <div className="space-y-2">
          {agence.ville && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span>{agence.ville}, {agence.pays}</span>
            </div>
          )}
          {agence.telephone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-purple-500" />
              <span>{agence.telephone}</span>
            </div>
          )}
          {agence.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-purple-500" />
              <span>{agence.email}</span>
            </div>
          )}
        </div>

        {agence.responsable_nom && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Responsable</p>
            <p className="text-sm font-semibold text-gray-700">{agence.responsable_nom}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-1">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">{agence.nombre_proprietaires}</p>
            <p className="text-xs text-gray-500">Propriétaires</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mx-auto mb-1">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">{agence.nombre_locataires}</p>
            <p className="text-xs text-gray-500">Locataires</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg mx-auto mb-1">
              <Home className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">{agence.nombre_biens}</p>
            <p className="text-xs text-gray-500">Biens</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mx-auto mb-1">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">{agence.nombre_contrats}</p>
            <p className="text-xs text-gray-500">Contrats</p>
          </div>
        </div>
      </div>
    </div>
  );

  const AgenceListItem = ({ agence }: { agence: Agence }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-6 p-6">
        <div className="flex-shrink-0">
          {agence.logo ? (
            <img 
              src={`${API_BASE_URL}/uploads/logos/${agence.logo}`} 
              alt={agence.nom}
              className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-md">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-800 truncate">{agence.nom}</h3>
            <span className="text-sm text-purple-600 font-semibold">{agence.code}</span>
            {agence.actif ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                Active
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-300 text-gray-700 text-xs font-bold rounded-full">
                Inactive
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            {agence.ville && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="truncate">{agence.ville}, {agence.pays}</span>
              </div>
            )}
            {agence.telephone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="truncate">{agence.telephone}</span>
              </div>
            )}
            {agence.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="truncate">{agence.email}</span>
              </div>
            )}
            {agence.responsable_nom && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="truncate">{agence.responsable_nom}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{agence.nombre_proprietaires}</p>
                <p className="text-xs text-gray-500">Propriétaires</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{agence.nombre_locataires}</p>
                <p className="text-xs text-gray-500">Locataires</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{agence.nombre_biens}</p>
                <p className="text-xs text-gray-500">Biens</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{agence.nombre_contrats}</p>
                <p className="text-xs text-gray-500">Contrats</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleEdit(agence)}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(agence.id)}
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestion des Agences</h1>
            <p className="text-sm text-gray-500 mt-1">{agencesList.length} agence(s) enregistrée(s)</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Agence
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, code ou ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterActif}
              onChange={(e) => setFilterActif(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="tous">Toutes les agences</option>
              <option value="actif">Agences actives</option>
              <option value="inactif">Agences inactives</option>
            </select>
          </div>
          
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vue liste"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vue grille"
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold">
                {editingAgence ? 'Modifier l\'agence' : 'Nouvelle agence'}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-xl">
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-white">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  Choisir un logo
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'agence *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({...formData, ville: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète
                </label>
                <textarea
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Responsable de l'agence
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={formData.responsable_nom}
                      onChange={(e) => setFormData({...formData, responsable_nom: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.responsable_telephone}
                      onChange={(e) => setFormData({...formData, responsable_telephone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.responsable_email}
                      onChange={(e) => setFormData({...formData, responsable_email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {editingAgence && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="actif"
                    checked={formData.actif}
                    onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <label htmlFor="actif" className="text-sm font-medium text-gray-700">
                    Agence active
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-semibold shadow-lg"
                >
                  {editingAgence ? 'Mettre à jour' : 'Créer l\'agence'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredAgences.map((agence) => (
            <AgenceListItem key={agence.id} agence={agence} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAgences.map((agence) => (
            <AgenceCard key={agence.id} agence={agence} />
          ))}
        </div>
      )}

      {filteredAgences.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Aucune agence trouvée</p>
        </div>
      )}
    </div>
  );
}