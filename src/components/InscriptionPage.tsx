import { useState, useEffect } from 'react';
import { UserPlus, Upload, AlertCircle, CheckCircle, Building2, ArrowLeft } from 'lucide-react';
import { inscriptionApi } from '../services/api';

interface InscriptionPageProps {
  onBackToLogin: () => void;
}

export default function InscriptionPage({ onBackToLogin }: InscriptionPageProps) {
  const [userType, setUserType] = useState<'locataire' | 'proprietaire'>('locataire');
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    date_naissance: '',
    lieu_naissance: '',
    numero_cni: '',
    telephone: '',
    email: '',
    adresse: '',
    type: 'particulier'
  });
  const [carteIdentite, setCarteIdentite] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasPendingDemande, setHasPendingDemande] = useState(false);

  useEffect(() => {
    // Vérifier s'il y a une demande en attente
    const pendingDemande = sessionStorage.getItem('pendingDemande');
    if (pendingDemande) {
      setHasPendingDemande(true);
      console.log('✅ Demande en attente détectée sur inscription');
    }
  }, []);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!formData.prenom || !formData.nom || !formData.date_naissance || 
        !formData.lieu_naissance || !formData.numero_cni || 
        !formData.telephone || !formData.email || !carteIdentite) {
      setError('Tous les champs marqués d\'un * sont obligatoires');
      return;
    }

    setLoading(true);

    try {
      // Créer le FormData
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      formDataToSend.append('carte_identite', carteIdentite);

      console.log('📝 Inscription en cours, type:', userType);

      // Utiliser l'API appropriée selon le type d'utilisateur
      const response = userType === 'locataire' 
        ? await inscriptionApi.inscrireLocataire(formDataToSend)
        : await inscriptionApi.inscrireProprietaire(formDataToSend);

      console.log('✅ Inscription réussie');
      setSuccess(response.message);
      
      // 🆕 Afficher les informations importantes
      if (response.info) {
        alert(`✅ Inscription réussie!\n\n${response.info}\n\nVous allez être redirigé vers la connexion pour vous connecter.`);
      }

      // Réinitialiser le formulaire
      setFormData({
        prenom: '',
        nom: '',
        date_naissance: '',
        lieu_naissance: '',
        numero_cni: '',
        telephone: '',
        email: '',
        adresse: '',
        type: 'particulier'
      });
      setCarteIdentite(null);

      // 🆕 IMPORTANT : Ne supprimer que selectedBienForDemande
      // Garder pendingDemande pour qu'elle soit soumise après connexion
      sessionStorage.removeItem('selectedBienForDemande');
      
      console.log('📋 pendingDemande conservée pour après connexion');

      // Redirection vers login après 2 secondes
      setTimeout(() => {
        onBackToLogin();
      }, 2000);

    } catch (err: any) {
      console.error('❌ Erreur inscription:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center relative">
            <button
              onClick={onBackToLogin}
              className="absolute left-4 top-6 p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">VOSCLES</h1>
            <p className="text-blue-100">Créer un compte</p>
            
            {/* 🆕 Badge demande en attente */}
            {hasPendingDemande && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-md border-2 border-amber-300 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-200" />
                <span className="text-xs font-bold text-white">
                  Votre demande sera envoyée après inscription
                </span>
              </div>
            )}
          </div>

          {/* Type Selection */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => setUserType('locataire')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  userType === 'locataire'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Je suis Locataire
              </button>
              <button
                onClick={() => setUserType('proprietaire')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  userType === 'proprietaire'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Je suis Propriétaire
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-medium">{success}</p>
                  <p className="text-xs text-green-700 mt-1">Redirection vers la connexion...</p>
                  {hasPendingDemande && (
                    <p className="text-xs text-green-700 mt-1 font-bold">
                      ✓ Votre demande sera envoyée automatiquement après connexion
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Prénom et Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              {/* Date et Lieu de naissance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance *
                  </label>
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => setFormData({...formData, date_naissance: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lieu de naissance *
                  </label>
                  <input
                    type="text"
                    value={formData.lieu_naissance}
                    onChange={(e) => setFormData({...formData, lieu_naissance: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dakar"
                  />
                </div>
              </div>

              {/* Numéro CNI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de carte d'identité *
                </label>
                <input
                  type="text"
                  value={formData.numero_cni}
                  onChange={(e) => setFormData({...formData, numero_cni: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 1234567890123"
                />
              </div>

              {/* Upload CNI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carte d'identité (scan/photo) *
                </label>
                <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {carteIdentite ? carteIdentite.name : 'Choisir un fichier (JPG, PNG, PDF)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setCarteIdentite(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {carteIdentite && (
                  <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Fichier sélectionné : {carteIdentite.name}
                  </p>
                )}
              </div>

              {/* Téléphone et Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="77 123 45 67"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="exemple@email.com"
                  />
                </div>
              </div>

              {/* Champs spécifiques */}
              {userType === 'proprietaire' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Adresse complète"
                  />
                </div>
              )}

              {userType === 'locataire' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de locataire
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="particulier">Particulier</option>
                    <option value="entreprise">Entreprise</option>
                  </select>
                </div>
              )}

              {/* Bouton Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Inscription en cours...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Créer mon compte
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <button 
                  onClick={onBackToLogin}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Se connecter
                </button>
              </p>
            </div>
          </div>

          {/* Footer info */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {userType === 'locataire' 
                ? '📝 En attente de validation par l\'administrateur'
                : '📝 En attente de validation par l\'administrateur'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}