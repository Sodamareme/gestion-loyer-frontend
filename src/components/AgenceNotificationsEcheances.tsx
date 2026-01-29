import { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, Calendar, DollarSign, User, Home, CheckCircle, Clock, Mail, MailOpen, Filter } from 'lucide-react';

interface Echeance {
  id: string;
  contrat_id: number;
  locataire_id: number;
  locataire_nom: string;
  bien_adresse: string;
  montant_du: number;
  mois_concerne: string;
  jours_retard: number;
  telephone?: string;
  email?: string;
  rappel_envoye?: boolean;
  rappel_lu?: boolean;
  rappel_date?: string;
  rappel_message?: string;
}

interface NotificationsProps {
  onClose?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3000/api';

export default function AgenceNotificationsEcheances({ onClose }: NotificationsProps) {
  const [echeancesEnRetard, setEcheancesEnRetard] = useState<Echeance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreRappel, setFiltreRappel] = useState<'tous' | 'sans_rappel' | 'non_lu' | 'lu'>('tous');
  const [filtreSeverite, setFiltreSeverite] = useState<'tous' | 'leger' | 'modere' | 'important'>('tous');
  const [showFiltres, setShowFiltres] = useState(false);

  useEffect(() => {
    loadEcheancesEnRetard();
    const interval = setInterval(loadEcheancesEnRetard, 300000); // Rafraîchir toutes les 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadEcheancesEnRetard = async () => {
    try {
      const token = localStorage.getItem('token');
      // 🆕 Utiliser l'endpoint spécifique pour les agences
      const response = await fetch(`${API_BASE_URL}/agences/echeances-impayees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des échéances');
      }
      
      const data = await response.json();
      console.log('✅ Échéances chargées:', data.length);
      setEcheancesEnRetard(data);
    } catch (error) {
      console.error('❌ Erreur chargement échéances:', error);
      setEcheancesEnRetard([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnvoyerRappel = async (echeance: Echeance) => {
    if (echeance.rappel_envoye && !echeance.rappel_lu) {
      const confirmer = confirm(
        `⚠️ Un rappel a déjà été envoyé à ${echeance.locataire_nom} et n'a pas encore été lu.\n\nVoulez-vous envoyer un nouveau rappel ?`
      );
      if (!confirmer) return;
    }

    const message = prompt(
      'Message personnalisé (optionnel) :\n\nLaissez vide pour le message par défaut.',
      ''
    );
    
    if (message === null) return;
    
    try {
      const token = localStorage.getItem('token');
      // 🆕 Utiliser l'endpoint spécifique pour les agences
      const response = await fetch(`${API_BASE_URL}/agences/envoyer-rappel`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contrat_id: echeance.contrat_id,
          mois_concerne: echeance.mois_concerne,
          message: message || undefined
        })
      });

      if (response.ok) {
        alert(`✅ Rappel envoyé à ${echeance.locataire_nom}!\n\nLe locataire verra cette notification dans son espace.`);
        loadEcheancesEnRetard();
      } else {
        const error = await response.json();
        alert(`❌ Erreur: ${error.error || 'Erreur lors de l\'envoi du rappel'}`);
      }
    } catch (error) {
      console.error('Erreur envoi rappel:', error);
      alert('❌ Erreur lors de l\'envoi du rappel');
    }
  };

  const getSeverityColor = (joursRetard: number) => {
    if (joursRetard <= 5) return 'bg-yellow-50 border-yellow-300 text-yellow-800';
    if (joursRetard <= 15) return 'bg-orange-50 border-orange-300 text-orange-800';
    return 'bg-red-50 border-red-300 text-red-800';
  };

  const getSeverityBadge = (joursRetard: number) => {
    if (joursRetard <= 5) return { color: 'bg-yellow-500', label: 'Léger retard' };
    if (joursRetard <= 15) return { color: 'bg-orange-500', label: 'Retard modéré' };
    return { color: 'bg-red-500', label: 'Retard important' };
  };

  // Filtrer les échéances
  const echeancesFiltrees = echeancesEnRetard.filter(echeance => {
    // Filtre par état du rappel
    if (filtreRappel === 'sans_rappel' && echeance.rappel_envoye) return false;
    if (filtreRappel === 'non_lu' && (!echeance.rappel_envoye || echeance.rappel_lu)) return false;
    if (filtreRappel === 'lu' && (!echeance.rappel_envoye || !echeance.rappel_lu)) return false;

    // Filtre par sévérité
    if (filtreSeverite === 'leger' && echeance.jours_retard > 5) return false;
    if (filtreSeverite === 'modere' && (echeance.jours_retard <= 5 || echeance.jours_retard > 15)) return false;
    if (filtreSeverite === 'important' && echeance.jours_retard <= 15) return false;

    return true;
  });

  const montantTotal = echeancesFiltrees.reduce((sum, e) => {
    const montant = Number(e.montant_du) || 0;
    return sum + montant;
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (echeancesEnRetard.length === 0) {
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded-full">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-green-900">✅ Aucun retard de paiement</h3>
            <p className="text-sm text-green-700">Tous vos locataires sont à jour !</p>
          </div>
        </div>
      </div>
    );
  }

  const rappelsNonLus = echeancesEnRetard.filter(e => e.rappel_envoye && !e.rappel_lu).length;
  const rappelsLus = echeancesEnRetard.filter(e => e.rappel_envoye && e.rappel_lu).length;
  const sansRappel = echeancesEnRetard.filter(e => !e.rappel_envoye).length;

  const filtresActifs = (filtreRappel !== 'tous' ? 1 : 0) + (filtreSeverite !== 'tous' ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Header avec compteur et filtres */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">🚨 Alertes Échéances</h2>
              <p className="text-red-100">
                {echeancesFiltrees.length} / {echeancesEnRetard.length} paiement{echeancesEnRetard.length > 1 ? 's' : ''} affiché{echeancesFiltrees.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFiltres(!showFiltres)}
              className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full transition-all flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              <span className="font-semibold">Filtrer</span>
              {filtresActifs > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {filtresActifs}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Panel de filtres */}
      {showFiltres && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-300 overflow-hidden animate-slide-down">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtrer les alertes
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Filtre par état du rappel */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📧 État du rappel
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => setFiltreRappel('tous')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filtreRappel === 'tous'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Tous ({echeancesEnRetard.length})
                </button>
                <button
                  onClick={() => setFiltreRappel('sans_rappel')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                    filtreRappel === 'sans_rappel'
                      ? 'bg-gray-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  Sans rappel ({sansRappel})
                </button>
                <button
                  onClick={() => setFiltreRappel('non_lu')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                    filtreRappel === 'non_lu'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Non lu ({rappelsNonLus})
                </button>
                <button
                  onClick={() => setFiltreRappel('lu')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                    filtreRappel === 'lu'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <MailOpen className="w-4 h-4" />
                  Lu ({rappelsLus})
                </button>
              </div>
            </div>

            {/* Filtre par sévérité */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⚠️ Niveau de retard
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => setFiltreSeverite('tous')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filtreSeverite === 'tous'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFiltreSeverite('leger')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filtreSeverite === 'leger'
                      ? 'bg-yellow-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Léger (≤5j)
                </button>
                <button
                  onClick={() => setFiltreSeverite('modere')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filtreSeverite === 'modere'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Modéré (6-15j)
                </button>
                <button
                  onClick={() => setFiltreSeverite('important')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filtreSeverite === 'important'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Important (&gt;15j)
                </button>
              </div>
            </div>

            {/* Bouton réinitialiser */}
            {filtresActifs > 0 && (
              <div className="pt-2 border-t border-blue-200">
                <button
                  onClick={() => {
                    setFiltreRappel('tous');
                    setFiltreSeverite('tous');
                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compteur de résultats */}
      {filtresActifs > 0 && (
        <div className="bg-blue-50 border border-blue-300 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-blue-800">
              <span className="font-bold text-lg">{echeancesFiltrees.length}</span>
              <span className="ml-1">résultat{echeancesFiltrees.length > 1 ? 's' : ''} trouvé{echeancesFiltrees.length > 1 ? 's' : ''}</span>
            </p>
          </div>
          <p className="text-xs text-blue-600 font-medium">
            {filtresActifs} filtre{filtresActifs > 1 ? 's' : ''} actif{filtresActifs > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Message si aucun résultat */}
      {echeancesFiltrees.length === 0 && echeancesEnRetard.length > 0 && (
        <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700 mb-1">Aucun résultat</h3>
          <p className="text-sm text-gray-600">Aucune échéance ne correspond aux filtres sélectionnés</p>
          <button
            onClick={() => {
              setFiltreRappel('tous');
              setFiltreSeverite('tous');
            }}
            className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Liste des échéances en retard */}
      {echeancesFiltrees.length > 0 && (
        <div className="space-y-3">
          {echeancesFiltrees.map((echeance) => {
            const severity = getSeverityBadge(echeance.jours_retard);
            
            return (
              <div
                key={echeance.id}
                className={`border-2 rounded-xl p-5 transition-all hover:shadow-lg ${getSeverityColor(echeance.jours_retard)}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Badge de sévérité + État rappel */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`${severity.color} px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1`}>
                        <AlertTriangle className="w-3 h-3" />
                        {severity.label}
                      </span>
                      <span className="text-sm font-semibold">
                        {echeance.jours_retard} jour{echeance.jours_retard > 1 ? 's' : ''} de retard
                      </span>
                      
                      {/* Badge état du rappel */}
                      {echeance.rappel_envoye && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          echeance.rappel_lu 
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-orange-100 text-orange-800 border border-orange-300 animate-pulse'
                        }`}>
                          {echeance.rappel_lu ? (
                            <>
                              <MailOpen className="w-3 h-3" />
                              Rappel lu
                            </>
                          ) : (
                            <>
                              <Mail className="w-3 h-3" />
                              Rappel non lu
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Info rappel si envoyé */}
                    {echeance.rappel_envoye && echeance.rappel_date && (
                      <div className="bg-white/50 border border-blue-200 rounded-lg p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span className="text-blue-800">
                            Rappel envoyé le {new Date(echeance.rappel_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {echeance.rappel_message && (
                          <p className="mt-1 text-gray-700 italic">"{echeance.rappel_message}"</p>
                        )}
                      </div>
                    )}

                    {/* Informations locataire */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium opacity-75">Locataire</p>
                          <p className="font-semibold">{echeance.locataire_nom}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium opacity-75">Bien</p>
                          <p className="font-semibold text-sm">{echeance.bien_adresse}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium opacity-75">Période</p>
                          <p className="font-semibold">
                            {new Date(echeance.mois_concerne).toLocaleDateString('fr-FR', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium opacity-75">Montant dû</p>
                          <p className="font-bold text-lg">{Number(echeance.montant_du).toLocaleString()} FCFA</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact */}
                    {(echeance.telephone || echeance.email) && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {echeance.telephone && (
                          <a 
                            href={`tel:${echeance.telephone}`}
                            className="bg-white/50 px-3 py-1 rounded-full hover:bg-white/80 transition-colors"
                          >
                            📞 {echeance.telephone}
                          </a>
                        )}
                        {echeance.email && (
                          <a 
                            href={`mailto:${echeance.email}`}
                            className="bg-white/50 px-3 py-1 rounded-full hover:bg-white/80 transition-colors"
                          >
                            ✉️ {echeance.email}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEnvoyerRappel(echeance)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap ${
                        echeance.rappel_envoye && !echeance.rappel_lu
                          ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-300'
                          : 'bg-white text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                      {echeance.rappel_envoye ? 'Renvoyer' : 'Envoyer'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Statistiques */}
      {echeancesFiltrees.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
              <p className="text-sm text-yellow-700 font-medium mb-1">Retards légers (≤5j)</p>
              <p className="text-2xl font-bold text-yellow-900">
                {echeancesFiltrees.filter(e => e.jours_retard <= 5).length}
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-300 rounded-xl p-4">
              <p className="text-sm text-orange-700 font-medium mb-1">Retards modérés (6-15j)</p>
              <p className="text-2xl font-bold text-orange-900">
                {echeancesFiltrees.filter(e => e.jours_retard > 5 && e.jours_retard <= 15).length}
              </p>
            </div>
            <div className="bg-red-50 border border-red-300 rounded-xl p-4">
              <p className="text-sm text-red-700 font-medium mb-1">Retards importants (&gt;15j)</p>
              <p className="text-2xl font-bold text-red-900">
                {echeancesFiltrees.filter(e => e.jours_retard > 15).length}
              </p>
            </div>
          </div>

          {/* Montant total dû */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">💰 Montant total {filtresActifs > 0 ? '(filtré)' : 'en retard'}</p>
                <p className="text-4xl font-bold">
                  {montantTotal.toLocaleString()} FCFA
                </p>
                <p className="text-purple-100 text-xs mt-2">
                  {echeancesFiltrees.length} paiement{echeancesFiltrees.length > 1 ? 's' : ''} affiché{echeancesFiltrees.length > 1 ? 's' : ''}
                </p>
              </div>
              <DollarSign className="w-16 h-16 opacity-50" />
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 1000px;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}