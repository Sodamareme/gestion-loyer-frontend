import { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Home, Maximize, CheckCircle, XCircle, Edit2, Trash2, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3000/api';

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

export default function BiensProprio() {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBien, setEditingBien] = useState<Bien | null>(null);
  const [formData, setFormData] = useState<Partial<Bien>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const biensTypes = ['chambre', 'appartement', 'maison', 'studio', 'villa', 'bureau', 'commerce'] as const;

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
    loadBiens();
  }, []);

  const loadBiens = async () => {
    try {
      const headers = getAuthHeaders();
      
      // 🔹 Utiliser la route propriétaire
      const res = await fetch(`${API_BASE_URL}/proprietaire/mes-biens`, { headers });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        throw new Error('Erreur lors du chargement des biens');
      }

      const data = await res.json();
      setBiens(data);
    } catch (error: any) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: error.message || 'Erreur lors du chargement' });
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      
      if (editingBien) {
        // Modification d'un bien existant
        const res = await fetch(`${API_BASE_URL}/proprietaire/mes-biens/${editingBien.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData),
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
          const error = await res.json();
          throw new Error(error.error || 'Erreur lors de la modification');
        }
        setMessage({ type: 'success', text: 'Bien modifié avec succès' });
      } else {
        // Création d'un nouveau bien
        if (!formData.type || !formData.adresse || !formData.surface || !formData.nombre_pieces) {
          setMessage({ 
            type: 'error', 
            text: 'Veuillez remplir tous les champs obligatoires' 
          });
          return;
        }

        const res = await fetch(`${API_BASE_URL}/proprietaire/mes-biens`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
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
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erreur lors de la création');
        }
        setMessage({ type: 'success', text: 'Bien créé avec succès' });
      }
      
      setShowForm(false);
      setEditingBien(null);
      setFormData({});
      loadBiens();
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
      
      const res = await fetch(`${API_BASE_URL}/proprietaire/mes-biens/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }

      setMessage({ type: 'success', text: 'Bien supprimé avec succès' });
      setDeleteConfirm(null);
      loadBiens();
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
            <h1 className="text-3xl font-bold text-gray-800">Mes Biens Immobiliers</h1>
            <p className="text-sm text-gray-500 mt-1">{biens.length} bien(s) enregistré(s)</p>
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
          Ajouter un bien
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
              </p>
              <p className="text-xs text-blue-600 mt-2">
                ℹ️ Le type ne peut pas être modifié
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!editingBien && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={formData.type || ''}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Bien['type'] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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

              <div className={!editingBien ? "md:col-span-1" : "md:col-span-2"}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
                <input
                  type="text"
                  value={formData.adresse || ''}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Surface (m²) *</label>
                <input
                  type="number"
                  value={formData.surface || ''}
                  onChange={(e) => setFormData({ ...formData, surface: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de pièces *</label>
                <input
                  type="number"
                  value={formData.nombre_pieces || ''}
                  onChange={(e) => setFormData({ ...formData, nombre_pieces: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                  min="1"
                />
              </div>

              {editingBien && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={formData.statut || ''}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="loue">Loué</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Description du bien (optionnel)"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
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
                type="submit"
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {editingBien ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {biens.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-md">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun bien enregistré</p>
            <p className="text-sm text-gray-400 mt-2">Cliquez sur "Ajouter un bien" pour commencer</p>
          </div>
        ) : (
          biens.map((bien) => (
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

                <div className="flex gap-2 pt-3 border-t border-gray-100">
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