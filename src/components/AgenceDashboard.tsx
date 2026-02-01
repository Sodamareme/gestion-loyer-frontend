import { useState, useEffect } from 'react';
import { FileDown } from 'lucide-react';
import { 
  Building2, Home, Users, FileText, LogOut, MessageSquare,
  TrendingUp, Activity, MapPin, Phone, Mail,User,
  CheckCircle, AlertCircle, Clock, Plus, Edit2, Trash2, X, Upload, Archive
} from 'lucide-react';
import api, { auth, Contrat } from '../services/api';
import AgenceDemandes from '../components/AgenceDemandes';
import AgenceContratForm from '../components/AgenceContratForm';
import AgenceDocuments from '../components/AgenceDocuments'; 
import ProfileSettings from '../components/ProfileSettings';
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3000/api';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'locataire' | 'proprietaire' | 'agence';
  agence_id?: number;
  agence_nom?: string;
  agence_code?: string;
}

interface AgenceDashboardProps {
  user: User;
  onLogout: () => void;
}

interface Stats {
  total_biens: number;
  biens_disponibles: number;
  biens_loues: number;
  biens_maintenance: number;
  surface_totale: number;
  surface_moyenne: number;
}

interface Bien {
  id: number;
  numero_bien: string;
  adresse: string;
  type: string;
  surface: number;
  nombre_pieces: number;
  statut: string;
  description?: string;
  proprietaire_id?: number;
  proprietaire_nom?: string;
  proprietaire_telephone?: string;
  photos?: string[];
}

interface Proprietaire {
  id: number;
  nom: string;
  prenom?: string;
  telephone: string;
  email?: string;
  adresse?: string;
  nombre_biens?: number;
}

const AgenceDashboard = ({ user, onLogout }: AgenceDashboardProps) => {
  const [stats, setStats] = useState<Stats>({
    total_biens: 0,
    biens_disponibles: 0,
    biens_loues: 0,
    biens_maintenance: 0,
    surface_totale: 0,
    surface_moyenne: 0,
  });
  const [biens, setBiens] = useState<Bien[]>([]);
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState<'overview' | 'biens' | 'proprietaires' | 'contrats' | 'documents' | 'demandes' | 'profil'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [showProprietaireForm, setShowProprietaireForm] = useState(false);
  const [showContratForm, setShowContratForm] = useState(false);
  const [editingBien, setEditingBien] = useState<Bien | null>(null);
  const [editingProprietaire, setEditingProprietaire] = useState<Proprietaire | null>(null);
  const [formData, setFormData] = useState<Partial<Bien>>({});
  const [proprietaireFormData, setProprietaireFormData] = useState<Partial<Proprietaire>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const biensTypes = ['chambre', 'appartement', 'maison', 'studio', 'villa', 'bureau', 'commerce'] as const;
const [showProfile, setShowProfile] = useState(false);
useEffect(() => {
  if (user.agence_id) {
    console.log('✅ agence_id présent:', user.agence_id);
    loadDashboardData();
    loadContrats();
  } else {
    console.error('❌ agence_id manquant dans user:', user);
    setError('Aucune agence associée à ce compte. Veuillez vous reconnecter.');
    setLoading(false);
  }
}, [user.agence_id]);

 const loadDashboardData = async () => {
  if (!user.agence_id) {
    console.error('❌ agence_id manquant dans user:', user);
    setError('Aucune agence associée à ce compte. Veuillez vous reconnecter.');
    setLoading(false);
    return;
  }
  
  try {
    setLoading(true);
    setError(null);
    
    console.log('🔍 Chargement des données pour agence_id:', user.agence_id);
    
    const [statsData, biensData, propsData] = await Promise.all([
      api.biens.getStatsByAgence(user.agence_id),
      api.biens.getAll(user.agence_id),
      api.agenceProprietaires.getAll()
    ]);
      
      console.log('📊 Stats reçues:', statsData);
      console.log('🏢 Biens reçus:', biensData.length, 'biens');
      console.log('👥 Propriétaires reçus:', propsData.length);
      
      const normalizedStats = {
        total_biens: Number(statsData.total_biens) || 0,
        biens_disponibles: Number(statsData.biens_disponibles) || 0,
        biens_loues: Number(statsData.biens_loues) || 0,
        biens_maintenance: Number(statsData.biens_maintenance) || 0,
        surface_totale: Number(statsData.surface_totale) || 0,
        surface_moyenne: Number(statsData.surface_moyenne) || 0,
      };
      
      console.log('✅ Stats normalisées:', normalizedStats);
      
      setStats(normalizedStats);
      setBiens(biensData);
      setProprietaires(propsData);
     } catch (error) {
    console.error('❌ Erreur chargement dashboard:', error);
    setError(error instanceof Error ? error.message : 'Erreur de chargement');
  } finally {
    setLoading(false);
  }
};

  const loadContrats = async () => {
    try {
      const data = await api.agences.getContrats(false); // false = sans les archives
      setContrats(data);
      console.log('✅ Contrats chargés:', data.length);
    } catch (error) {
      console.error('❌ Erreur chargement contrats:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > 5) {
      setMessage({ type: 'error', text: 'Maximum 5 photos autorisées' });
      return;
    }

    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setMessage({ type: 'error', text: 'Chaque photo ne doit pas dépasser 5MB' });
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
    setPreviewUrls(urls => urls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Session expirée');

      const formDataToSend = new FormData();
      
      if (editingBien) {
        formDataToSend.append('adresse', formData.adresse || '');
        formDataToSend.append('surface', String(formData.surface || 0));
        formDataToSend.append('nombre_pieces', String(formData.nombre_pieces || 0));
        if (formData.description) formDataToSend.append('description', formData.description);
        if (formData.statut) formDataToSend.append('statut', formData.statut);
        formDataToSend.append('agence_id', String(user.agence_id));

        selectedFiles.forEach(file => {
          formDataToSend.append('photos', file);
        });

        const res = await fetch(`${API_BASE_URL}/biens/${editingBien.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formDataToSend,
        });

        if (!res.ok) throw new Error('Erreur lors de la modification');
        setMessage({ type: 'success', text: 'Bien modifié avec succès' });
      } else {
        if (!formData.proprietaire_id || !formData.type || !formData.adresse || 
            !formData.surface || !formData.nombre_pieces) {
          setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' });
          return;
        }

        formDataToSend.append('proprietaire_id', String(formData.proprietaire_id));
        formDataToSend.append('type', formData.type);
        formDataToSend.append('adresse', formData.adresse);
        formDataToSend.append('surface', String(formData.surface));
        formDataToSend.append('nombre_pieces', String(formData.nombre_pieces));
        if (formData.description) formDataToSend.append('description', formData.description);
        formDataToSend.append('agence_id', String(user.agence_id));

        selectedFiles.forEach(file => {
          formDataToSend.append('photos', file);
        });

        const res = await fetch(`${API_BASE_URL}/biens`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formDataToSend,
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erreur lors de la création');
        }
        setMessage({ type: 'success', text: 'Bien créé avec succès' });
      }
      
      setShowForm(false);
      setEditingBien(null);
      setFormData({});
      setSelectedFiles([]);
      setPreviewUrls([]);
      loadDashboardData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleEdit = (bien: Bien) => {
    setEditingBien(bien);
    setFormData({
      adresse: bien.adresse,
      surface: bien.surface,
      nombre_pieces: bien.nombre_pieces,
      description: bien.description,
      statut: bien.statut,
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setShowForm(true);
    setActiveTab('biens');
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Session expirée');

      const res = await fetch(`${API_BASE_URL}/biens/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erreur lors de la suppression');
      }

      setMessage({ type: 'success', text: 'Bien supprimé avec succès' });
      setDeleteConfirm(null);
      loadDashboardData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: error.message });
      setDeleteConfirm(null);
    }
  };

  const handleProprietaireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProprietaire) {
        await api.agenceProprietaires.update(editingProprietaire.id, proprietaireFormData as Omit<Proprietaire, 'id'>);
        setMessage({ type: 'success', text: 'Propriétaire modifié avec succès' });
      } else {
        await api.agenceProprietaires.create(proprietaireFormData as Omit<Proprietaire, 'id'>);
        setMessage({ type: 'success', text: 'Propriétaire créé avec succès' });
      }
      
      setShowProprietaireForm(false);
      setEditingProprietaire(null);
      setProprietaireFormData({});
      loadDashboardData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleProprietaireEdit = (proprietaire: Proprietaire) => {
    setEditingProprietaire(proprietaire);
    setProprietaireFormData(proprietaire);
    setShowProprietaireForm(true);
    setActiveTab('proprietaires');
  };

  const handleArchiveContrat = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir archiver ce contrat ?')) return;
    
    try {
      await api.agences.archiverContrat(id);
      setMessage({ type: 'success', text: 'Contrat archivé avec succès' });
      loadContrats();
      loadDashboardData(); // Pour mettre à jour les stats
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  // 🆕 Fonction pour télécharger le PDF du contrat
  const handleDownloadContratPDF = async (contratId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Session expirée');

      const response = await fetch(`${API_BASE_URL}/agences/contrats/${contratId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors du téléchargement');
      }

      // Récupérer le nom du fichier depuis les headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `contrat_${contratId}.pdf`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

      // Créer un blob et déclencher le téléchargement
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'PDF téléchargé avec succès' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Erreur téléchargement PDF:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'disponible': return 'bg-green-100 text-green-700';
      case 'loué': 
      case 'loue': return 'bg-blue-100 text-blue-700';
      case 'maintenance': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'disponible': return <CheckCircle className="w-4 h-4" />;
      case 'loué':
      case 'loue': return <Clock className="w-4 h-4" />;
      case 'maintenance': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Erreur</h2>
          <p className="text-slate-600 text-center mb-4">{error}</p>
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <nav className="bg-white/95 backdrop-blur-xl shadow-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl blur-xl opacity-40"></div>
                <div className="relative p-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                  {user.agence_nom || 'Mon Agence'}
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Code: {user.agence_code || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200/60">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-lg">
                  AGENCE
                </span>
                <span className="text-sm text-slate-700 font-semibold">{user.email}</span>
              </div>
              
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100 text-red-600 hover:from-red-100 hover:to-red-200 transition-all font-semibold group shadow-md"
              >
                <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="text-sm hidden sm:inline">Déconnexion</span>
              </button>
            
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 pb-3 border-t border-slate-200/60 pt-3 mt-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white hover:text-blue-600'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Vue d'ensemble</span>
            </button>
            <button
              onClick={() => setActiveTab('proprietaires')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'proprietaires'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white hover:text-blue-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="font-medium">Propriétaires ({proprietaires.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('biens')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'biens'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white hover:text-blue-600'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="font-medium">Mes Biens ({biens.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('contrats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'contrats'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white hover:text-blue-600'
              }`}
            >
              
              <FileText className="w-4 h-4" />
              <span className="font-medium">Contrats ({contrats.length})</span>
            </button>
             <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'documents'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white hover:text-blue-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="font-medium">Documents</span>
            </button>
            <button
              onClick={() => setActiveTab('demandes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'demandes'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-white hover:text-blue-600'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">Demandes</span>
            </button>
            <button
  onClick={() => setActiveTab('profil')}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
    activeTab === 'profil'
      ? 'bg-blue-600 text-white shadow-md'
      : 'text-slate-600 hover:bg-white hover:text-blue-600'
  }`}
>
  <User className="w-4 h-4" />
  <span className="font-medium">Mon Profil</span>
</button>
            
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VUE D'ENSEMBLE */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">Total Biens</h3>
                <p className="text-3xl font-bold text-slate-800">{stats.total_biens}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">Disponibles</h3>
                <p className="text-3xl font-bold text-green-600">{stats.biens_disponibles}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">Loués</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.biens_loues}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">Maintenance</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.biens_maintenance}</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Surface totale</h3>
                <p className="text-4xl font-bold text-blue-600">{stats.surface_totale.toFixed(0)} m²</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Surface moyenne</h3>
                <p className="text-4xl font-bold text-slate-600">{stats.surface_moyenne.toFixed(1)} m²</p>
              </div>
            </div>
          </div>
        )}

        {/* PROPRIÉTAIRES */}
        {activeTab === 'proprietaires' && (
          <div className="space-y-6">
            {/* Message de succès/erreur */}
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

            {/* Bouton Ajouter */}
            {!showProprietaireForm && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowProprietaireForm(true);
                    setEditingProprietaire(null);
                    setProprietaireFormData({});
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un propriétaire
                </button>
              </div>
            )}

            {/* Formulaire Propriétaires */}
            {showProprietaireForm && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60">
                <h2 className="text-xl font-bold text-slate-800 mb-6">
                  {editingProprietaire ? 'Modifier le propriétaire' : 'Nouveau propriétaire'}
                </h2>
                <form onSubmit={handleProprietaireSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={proprietaireFormData.nom || ''}
                        onChange={(e) => setProprietaireFormData({ ...proprietaireFormData, nom: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={proprietaireFormData.prenom || ''}
                        onChange={(e) => setProprietaireFormData({ ...proprietaireFormData, prenom: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={proprietaireFormData.telephone || ''}
                        onChange={(e) => setProprietaireFormData({ ...proprietaireFormData, telephone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={proprietaireFormData.email || ''}
                        onChange={(e) => setProprietaireFormData({ ...proprietaireFormData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Adresse
                      </label>
                      <input
                        type="text"
                        value={proprietaireFormData.adresse || ''}
                        onChange={(e) => setProprietaireFormData({ ...proprietaireFormData, adresse: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProprietaireForm(false);
                        setEditingProprietaire(null);
                        setProprietaireFormData({});
                      }}
                      className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingProprietaire ? 'Modifier' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Liste des propriétaires */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
              {proprietaires.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Aucun propriétaire enregistré pour cette agence</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Nom</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Téléphone</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Adresse</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Biens</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {proprietaires.map((prop) => (
                        <tr key={prop.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">
                              {prop.nom} {prop.prenom}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <span className="text-sm">{prop.telephone}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {prop.email ? (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-sm">{prop.email}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {prop.adresse ? (
                              <div className="flex items-center gap-2 text-slate-600">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span className="text-sm">{prop.adresse}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              <Building2 className="w-3 h-3" />
                              {prop.nombre_biens || 0} bien(s)
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleProprietaireEdit(prop)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BIENS */}
        {activeTab === 'biens' && (
          <div className="space-y-6">
            {/* Message de succès/erreur */}
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

            {/* Bouton Ajouter */}
            {!showForm && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingBien(null);
                    setFormData({});
                    setSelectedFiles([]);
                    setPreviewUrls([]);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un bien
                </button>
              </div>
            )}

            {/* Formulaire Biens */}
            {showForm && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200/60">
                <h2 className="text-xl font-bold text-slate-800 mb-6">
                  {editingBien ? 'Modifier le bien' : 'Nouveau bien'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!editingBien && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Propriétaire *
                        </label>
                        <select
                          value={formData.proprietaire_id || ''}
                          onChange={(e) => setFormData({ ...formData, proprietaire_id: Number(e.target.value) })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Sélectionner un propriétaire</option>
                          {proprietaires.map((prop) => (
                            <option key={prop.id} value={prop.id}>
                              {prop.nom} {prop.prenom}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {!editingBien && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
                        <select
                          value={formData.type || ''}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Sélectionner</option>
                          {biensTypes.map((type) => (
                            <option key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className={!editingBien ? '' : 'md:col-span-2'}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Adresse *</label>
                      <input
                        type="text"
                        value={formData.adresse || ''}
                        onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Surface (m²) *</label>
                      <input
                        type="number"
                        value={formData.surface || ''}
                        onChange={(e) => setFormData({ ...formData, surface: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Nombre de pièces *</label>
                      <input
                        type="number"
                        value={formData.nombre_pieces || ''}
                        onChange={(e) => setFormData({ ...formData, nombre_pieces: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {editingBien && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Statut *</label>
                        <select
                          value={formData.statut || ''}
                          onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="disponible">Disponible</option>
                          <option value="loue">Loué</option>
                        </select>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                      <textarea
                        rows={3}
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Photos (max 5, 5MB chacune)
                      </label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label htmlFor="photo-upload" className="cursor-pointer block">
                          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <p className="text-sm text-slate-600">
                            Cliquez pour ajouter des photos
                          </p>
                        </label>
                      </div>

                      {previewUrls.length > 0 && (
                        <div className="grid grid-cols-5 gap-4 mt-4">
                          {previewUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-slate-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingBien(null);
                        setFormData({});
                        setSelectedFiles([]);
                        setPreviewUrls([]);
                      }}
                      className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingBien ? 'Modifier' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Liste des biens */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
              {biens.length === 0 ? (
                <div className="p-8 text-center">
                  <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Aucun bien enregistré pour cette agence</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Bien</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Adresse</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Surface</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Propriétaire</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Statut</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {biens.map((bien) => (
                        <tr key={bien.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{bien.numero_bien}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="text-sm">{bien.adresse}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600 capitalize">{bien.type}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-slate-800">{bien.surface} m²</span>
                            <span className="text-xs text-slate-500 ml-2">({bien.nombre_pieces} pièces)</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="font-medium text-slate-800">{bien.proprietaire_nom}</div>
                              {bien.proprietaire_telephone && (
                                <div className="flex items-center gap-1 text-slate-500 text-xs">
                                  <Phone className="w-3 h-3" />
                                  {bien.proprietaire_telephone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatutColor(bien.statut)}`}>
                              {getStatutIcon(bien.statut)}
                              {bien.statut}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(bien)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(bien.id)}
                                disabled={bien.statut === 'loue'}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={bien.statut === 'loue' ? 'Impossible de supprimer un bien loué' : 'Supprimer'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTRATS */}
        {activeTab === 'contrats' && (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Gestion des contrats</h2>
                <p className="text-sm text-slate-500 mt-1">{contrats.length} contrat(s)</p>
              </div>
              
              {!showContratForm && (
                <button
                  onClick={() => setShowContratForm(true)}
                  className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Nouveau contrat
                </button>
              )}
            </div>

            {/* Message de succès/erreur */}
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

            {/* Formulaire */}
            {showContratForm && (
              <AgenceContratForm
                user={user}
                onSuccess={() => {
                  setShowContratForm(false);
                  loadContrats();
                  loadDashboardData();
                  setMessage({ type: 'success', text: 'Contrat créé avec succès !' });
                  setTimeout(() => setMessage(null), 3000);
                }}
                onCancel={() => setShowContratForm(false)}
              />
            )}

            {/* Liste des contrats */}
            {!showContratForm && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
                {contrats.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">Aucun contrat enregistré</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Contrat</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Locataire</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Bien</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Période</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Loyer</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Statut</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {contrats.map((contrat) => (
                          <tr key={contrat.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-800">
                                Contrat #{contrat.id}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <div className="font-medium text-slate-800">{contrat.locataire_nom}</div>
                                {contrat.locataire_tel && (
                                  <div className="text-slate-500 text-xs">{contrat.locataire_tel}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-600">{contrat.bien_adresse}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-slate-600">
                                <div>{new Date(contrat.date_debut).toLocaleDateString('fr-FR')}</div>
                                <div>→ {new Date(contrat.date_fin).toLocaleDateString('fr-FR')}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-teal-600">
                                {Number(contrat.montant_loyer).toLocaleString('fr-FR')} FCFA
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                                (contrat.statut || contrat.contrat_statut) === 'actif' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {contrat.statut || contrat.contrat_statut}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleArchiveContrat(contrat.id!)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Archiver"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDownloadContratPDF(contrat.id!)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Télécharger PDF"
                                >
                                  <FileDown className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
          </div>
          
        )}
        
  {/* 🆕 DOCUMENTS - NOUVEAU TAB */}
        {activeTab === 'documents' && user.agence_id && (
          <AgenceDocuments agenceId={user.agence_id} />
        )}
        {/* DEMANDES */}
        {activeTab === 'demandes' && <AgenceDemandes />}
       {activeTab === 'profil' && (
  <div className="space-y-6">
    <ProfileSettings user={user} />
  </div>
)}
      </main>

      {/* Modal de confirmation de suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Confirmer la suppression</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce bien ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
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
};

export default AgenceDashboard;