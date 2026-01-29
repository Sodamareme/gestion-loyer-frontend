import { useState, useEffect } from 'react';
import { LogIn, Lock, Mail, AlertCircle, Building2 } from 'lucide-react';
import { auth } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3000/api';

interface LoginProps {
  onLogin: (user: any) => void;
  onShowInscription?: () => void;
}

export default function Login({ onLogin, onShowInscription }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasPendingDemande, setHasPendingDemande] = useState(false);

  useEffect(() => {
    // Vérifier s'il y a une demande en attente
    const pendingDemande = sessionStorage.getItem('pendingDemande');
    if (pendingDemande) {
      setHasPendingDemande(true);
      console.log('✅ Demande en attente détectée');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Tentative de connexion...');
      const result = await auth.login(email, password);
      console.log('✅ Connexion réussie, rôle:', result.user.role);
      
      // 🆕 Vérifier s'il y a une demande en attente
      const pendingDemandeData = sessionStorage.getItem('pendingDemande');
      
      if (pendingDemandeData && result.user.role === 'locataire') {
        console.log('📝 Demande en attente trouvée, soumission automatique...');
        
        try {
          const demandeData = JSON.parse(pendingDemandeData);
          console.log('📋 Données demande:', demandeData);
          
          // Soumettre la demande en tant que demande publique
          const response = await fetch(`${API_BASE_URL}/demandes/publique`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(demandeData),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Demande soumise avec succès:', result.id);
            
            // Nettoyer le sessionStorage
            sessionStorage.removeItem('pendingDemande');
            sessionStorage.removeItem('selectedBienForDemande');
            
            // Afficher un message de succès
            alert(`✅ Votre demande a été envoyée avec succès à ${result.agence_nom}!\n\nVous pouvez la consulter dans votre espace locataire dans "Mes demandes".`);
          } else {
            const errorData = await response.json();
            console.error('❌ Erreur soumission demande:', errorData);
            alert(`⚠️ Erreur lors de l'envoi de votre demande: ${errorData.error}\n\nVous pourrez créer une nouvelle demande depuis votre espace.`);
          }
        } catch (err) {
          console.error('❌ Erreur traitement demande:', err);
          alert('⚠️ Erreur lors de l\'envoi de votre demande.\n\nVous pourrez créer une nouvelle demande depuis votre espace.');
        }
      } else if (pendingDemandeData) {
        console.log('⚠️ Demande en attente mais utilisateur non-locataire, suppression...');
        sessionStorage.removeItem('pendingDemande');
        sessionStorage.removeItem('selectedBienForDemande');
      }
      
      onLogin(result.user);
    } catch (err: any) {
      console.error('❌ Erreur connexion:', err);
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">VOSCLES</h1>
            <p className="text-blue-100">Gestion Immobilière</p>
            
            {/* 🆕 Badge demande en attente */}
            {hasPendingDemande && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-300 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-200" />
                <span className="text-xs font-semibold text-white">
                  Demande en attente
                </span>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Connexion...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            {/* 🆕 Section inscription */}
            {onShowInscription && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-600 mb-3">
                  Vous n'avez pas de compte ?
                </p>
                <button
                  onClick={onShowInscription}
                  className="w-full py-3 px-4 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all"
                >
                  Créer un compte
                </button>
              </div>
            )}

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Problème de connexion ?{' '}
                <a href="mailto:brahimgueye@gmail.com" className="text-blue-600 hover:text-blue-700 font-medium">
                  Contactez l'administrateur
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
            <p className="text-xs text-gray-500">
              © 2024 VOSCLES - Tous droits réservés
            </p>
            {hasPendingDemande && (
              <p className="text-xs text-blue-600 mt-1 font-medium">
                ✓ Votre demande sera envoyée après connexion
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}