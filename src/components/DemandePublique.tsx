import { useState, useEffect } from 'react';
import { 
  MessageSquare, AlertCircle, Home, Phone, Mail, MapPin, ArrowRight,
  X, LogIn, UserPlus
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3000/api';

interface Agence {
  id: number;
  nom: string;
  code: string;
}

interface Bien {
  id: number;
  numero_bien: string;
  adresse: string;
  agence_id: number;
}

interface DemandePubliqueProps {
  onRetour?: () => void;
  onShowLogin?: () => void;
  onShowInscription?: () => void;
}

export default function DemandePublique({ onRetour, onShowLogin, onShowInscription }: DemandePubliqueProps) {
  const [agences, setAgences] = useState<Agence[]>([]);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [selectedBien, setSelectedBien] = useState<any>(null);
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [formData, setFormData] = useState({
    agence_id: '',
    bien_id: '',
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse_bien: '',
    type: 'reparation',
    sujet: '',
    description: '',
    urgence: 'normale'
  });

  useEffect(() => {
    loadAgences();
    loadBiens();
    
    // Récupérer le bien sélectionné depuis sessionStorage
    const selectedBienData = sessionStorage.getItem('selectedBienForDemande');
    if (selectedBienData) {
      try {
        const bien = JSON.parse(selectedBienData);
        setSelectedBien(bien);
        setFormData(prev => ({
          ...prev,
          bien_id: bien.bien_id?.toString() || '',
          adresse_bien: bien.adresse || '',
          sujet: `Demande concernant ${bien.numero_bien}`
        }));
        
        // Récupérer l'agence du bien
        if (bien.bien_id) {
          fetchBienAgence(bien.bien_id);
        }
        
        console.log('🏠 Bien pré-sélectionné:', bien);
      } catch (error) {
        console.error('Erreur parsing bien:', error);
      }
    }
  }, []);

  const loadAgences = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/agences/actives`);
      if (!res.ok) throw new Error('Erreur chargement agences');
      const data = await res.json();
      setAgences(Array.isArray(data) ? data : (data.agences || []));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const loadBiens = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/biens/disponibles`);
      if (!res.ok) throw new Error('Erreur chargement biens');
      const data = await res.json();
      setBiens(Array.isArray(data) ? data : []);
      console.log('🏠 Biens disponibles chargés:', data.length);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchBienAgence = async (bienId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/biens/disponibles`);
      if (res.ok) {
        const biensData = await res.json();
        const bien = biensData.find((b: any) => b.id === bienId);
        if (bien && bien.agence_id) {
          setFormData(prev => ({
            ...prev,
            agence_id: bien.agence_id.toString()
          }));
          console.log('✅ Agence du bien trouvée:', bien.agence_id);
        }
      }
    } catch (error) {
      console.error('Erreur récupération agence du bien:', error);
    }
  };

  const handleBienChange = (bienId: string) => {
    if (bienId === 'custom') {
      setUseCustomAddress(true);
      setFormData(prev => ({
        ...prev,
        bien_id: '',
        adresse_bien: '',
        agence_id: '',
        sujet: ''
      }));
    } else if (bienId) {
      const bien = biens.find(b => b.id.toString() === bienId);
      if (bien) {
        setUseCustomAddress(false);
        setFormData(prev => ({
          ...prev,
          bien_id: bienId,
          adresse_bien: bien.adresse,
          agence_id: bien.agence_id?.toString() || '',
          sujet: `Demande concernant ${bien.numero_bien}`
        }));
        console.log('🏠 Bien sélectionné:', bien);
      }
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.agence_id || !formData.nom || !formData.telephone || 
        !formData.adresse_bien || !formData.sujet || !formData.description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    console.log('📝 Soumission demande publique avec données:', formData);

    // Sauvegarder les données dans sessionStorage
    sessionStorage.setItem('pendingDemande', JSON.stringify(formData));
    
    // Afficher le prompt d'authentification
    setShowAuthPrompt(true);
  };

  const handleLogin = () => {
    if (onShowLogin) {
      onShowLogin();
    }
  };

  const handleInscription = () => {
    if (onShowInscription) {
      onShowInscription();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {onRetour && (
        <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={onRetour}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all font-semibold text-slate-700"
            >
              <X className="w-5 h-5" />
              Retour à l'accueil
            </button>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                <div className="relative bg-white p-6 rounded-full shadow-2xl">
                  <MessageSquare className="w-16 h-16 text-blue-600" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">
              Contactez votre agence
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Remplissez le formulaire ci-dessous pour envoyer une demande
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 -mt-12">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8">
            <h2 className="text-3xl font-black text-white">Nouvelle demande</h2>
            <p className="text-blue-100 mt-2">Remplissez tous les champs</p>
          </div>

          <div className="p-8 space-y-6">
            {/* Badge bien pré-sélectionné */}
            {selectedBien && (
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900">Bien sélectionné :</p>
                    <p className="text-lg font-black text-blue-700">{selectedBien.numero_bien}</p>
                    <p className="text-sm text-blue-600">{selectedBien.adresse}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600" />
                Votre agence *
              </label>
              <select
                value={formData.agence_id}
                onChange={(e) => setFormData({...formData, agence_id: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Sélectionner</option>
                {agences.map((agence) => (
                  <option key={agence.id} value={agence.id}>
                    {agence.nom} ({agence.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nom *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Prénom</label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Adresse du bien *
              </label>
              
              {selectedBien ? (
                // Si bien pré-sélectionné depuis landing page
                <div className="px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl font-medium text-slate-700">
                  🏠 {formData.adresse_bien}
                </div>
              ) : (
                <>
                  {/* Sélecteur de bien */}
                  <select
                    value={useCustomAddress ? 'custom' : formData.bien_id}
                    onChange={(e) => handleBienChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 mb-3"
                  >
                    <option value="">Sélectionner un bien</option>
                    {biens.map((bien) => (
                      <option key={bien.id} value={bien.id}>
                        🏠 {bien.numero_bien} - {bien.adresse}
                      </option>
                    ))}
                    <option value="custom">✏️ Saisir une autre adresse</option>
                  </select>

                  {/* Champ personnalisé si "autre adresse" */}
                  {useCustomAddress && (
                    <input
                      type="text"
                      value={formData.adresse_bien}
                      onChange={(e) => setFormData({...formData, adresse_bien: e.target.value})}
                      placeholder="Ex: Appartement 3A, Résidence Les Palmiers"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="reparation">🔧 Réparation</option>
                  <option value="entretien">🧹 Entretien</option>
                  <option value="incident">⚠️ Incident</option>
                  <option value="information">ℹ️ Information</option>
                  <option value="plainte">📢 Plainte</option>
                  <option value="autre">📋 Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Urgence *</label>
                <select
                  value={formData.urgence}
                  onChange={(e) => setFormData({...formData, urgence: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Sujet *</label>
              <input
                type="text"
                value={formData.sujet}
                onChange={(e) => setFormData({...formData, sujet: e.target.value})}
                placeholder="Ex: Fuite d'eau"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Description *</label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Décrivez votre demande..."
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-4 pt-4">
              {onRetour && (
                <button
                  type="button"
                  onClick={onRetour}
                  className="flex-1 px-6 py-4 border-2 border-slate-300 rounded-xl hover:bg-slate-50 font-bold text-slate-700"
                >
                  Annuler
                </button>
              )}
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAuthPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 rounded-t-3xl text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">
                Une dernière étape !
              </h2>
              <p className="text-blue-100 text-lg">
                Pour recevoir la réponse de votre agence
              </p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Pourquoi créer un compte ?
                </h3>
                <ul className="space-y-2 text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">✓</span>
                    <span>Recevoir la réponse de l'agence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">✓</span>
                    <span>Suivre l'évolution de votre demande</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">✓</span>
                    <span>Historique de toutes vos demandes</span>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleInscription}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-2xl font-bold shadow-xl"
                >
                  <UserPlus className="w-5 h-5" />
                  Créer un compte
                </button>

                <button
                  onClick={handleLogin}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-2xl font-bold"
                >
                  <LogIn className="w-5 h-5" />
                  Se connecter
                </button>
              </div>

              <p className="text-sm text-slate-500 text-center">
                💡 Votre demande sera envoyée après connexion
              </p>

              <button
                onClick={() => setShowAuthPrompt(false)}
                className="w-full px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}