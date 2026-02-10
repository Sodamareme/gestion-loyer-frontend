import { useState, useEffect } from 'react';
import { UserPlus, Upload, AlertCircle, CheckCircle, Building2, ArrowLeft, X } from 'lucide-react';
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

  const [carteIdentiteRecto, setCarteIdentiteRecto] = useState<File | null>(null);
  const [carteIdentiteVerso, setCarteIdentiteVerso] = useState<File | null>(null);
  const [previewRecto, setPreviewRecto] = useState<string>('');
  const [previewVerso, setPreviewVerso] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasPendingDemande, setHasPendingDemande] = useState(false);

  useEffect(() => {
    const pendingDemande = sessionStorage.getItem('pendingDemande');
    if (pendingDemande) {
      setHasPendingDemande(true);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'recto' | 'verso') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(`Le fichier ${side} est trop volumineux. Taille maximale : 5MB`);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError(`Type non accepté pour le ${side}. Utilisez JPEG, PNG ou PDF`);
      return;
    }

    setError('');

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
    if (side === 'recto') {
      setCarteIdentiteRecto(null);
      setPreviewRecto('');
    } else {
      setCarteIdentiteVerso(null);
      setPreviewVerso('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!formData.prenom || !formData.nom || !formData.date_naissance ||
        !formData.lieu_naissance || !formData.numero_cni ||
        !formData.telephone || !formData.email) {
      setError('Tous les champs marqués d\'un * sont obligatoires');
      return;
    }

    if (!carteIdentiteRecto || !carteIdentiteVerso) {
      setError('Les deux photos de la carte d\'identité sont obligatoires (recto et verso)');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      formDataToSend.append('carte_identite_recto', carteIdentiteRecto);
      formDataToSend.append('carte_identite_verso', carteIdentiteVerso);

      const response = userType === 'locataire'
        ? await inscriptionApi.inscrireLocataire(formDataToSend)
        : await inscriptionApi.inscrireProprietaire(formDataToSend);

      // Réinitialiser le formulaire
      setFormData({
        prenom: '', nom: '', date_naissance: '', lieu_naissance: '',
        numero_cni: '', telephone: '', email: '', adresse: '', type: 'particulier'
      });
      setCarteIdentiteRecto(null);
      setCarteIdentiteVerso(null);
      setPreviewRecto('');
      setPreviewVerso('');
      sessionStorage.removeItem('selectedBienForDemande');

      // Afficher l'écran de succès, puis rediriger après 3s
      setSuccess(response.message || 'Compte créé avec succès !');
      setTimeout(() => {
        onBackToLogin();
      }, 3000);

    } catch (err: any) {
      console.error('❌ Erreur inscription:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const UploadZone = ({
    side, file, preview
  }: { side: 'recto' | 'verso'; file: File | null; preview: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Face <span className="font-bold">{side.toUpperCase()}</span> *
      </label>

      {file ? (
        <div className="relative border-2 border-green-400 bg-green-50 rounded-lg p-3">
          <button
            type="button"
            onClick={() => removeFile(side)}
            className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors z-10"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
          {preview ? (
            <img src={preview} alt={`Aperçu ${side}`} className="max-h-36 mx-auto rounded object-contain" />
          ) : (
            <div className="flex items-center gap-3 py-2 pr-6">
              <Upload className="w-8 h-8 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-700 font-medium truncate">{file.name}</span>
            </div>
          )}
          <p className="text-center text-xs text-green-600 font-medium mt-2">
            ✓ {side === 'recto' ? 'Recto' : 'Verso'} chargé
          </p>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-600">
            Cliquez pour le <strong>{side.toUpperCase()}</strong>
          </span>
          <span className="text-xs text-gray-400 mt-1">JPG, PNG ou PDF — Max 5MB</span>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            onChange={(e) => handleFileChange(e, side)}
            className="hidden"
          />
        </label>
      )}
    </div>
  );

  // ✅ Écran de succès plein écran — remplace tout le formulaire
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">

          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Compte créé avec succès !
          </h2>

          <p className="text-gray-600 mb-1">{success}</p>
          <p className="text-sm text-gray-500 mb-6">
            Vos identifiants ont été envoyés par email.
          </p>

          {hasPendingDemande && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 font-medium">
                ✓ Votre demande sera envoyée automatiquement après connexion
              </p>
            </div>
          )}

          {/* Indicateur de redirection */}
          <div className="flex items-center justify-center gap-3 p-3 bg-blue-50 rounded-lg mb-5">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent flex-shrink-0"></div>
            <p className="text-sm text-blue-700 font-medium">
              Redirection vers la connexion...
            </p>
          </div>

          {/* Lien pour aller directement sans attendre */}
          <button
            onClick={onBackToLogin}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
          >
            Aller à la connexion maintenant →
          </button>
        </div>
      </div>
    );
  }

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

            <div className="space-y-4">
              {/* Prénom et Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance *</label>
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => setFormData({...formData, date_naissance: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lieu de naissance *</label>
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

              {/* Upload CNI Recto + Verso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carte d'identité — recto et verso *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Les deux faces sont obligatoires — JPG, PNG ou PDF, max 5MB chacune
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <UploadZone side="recto" file={carteIdentiteRecto} preview={previewRecto} />
                  <UploadZone side="verso" file={carteIdentiteVerso} preview={previewVerso} />
                </div>
              </div>

              {/* Téléphone et Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="77 123 45 67"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de locataire</label>
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

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              📝 En attente de validation par l'administrateur
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}