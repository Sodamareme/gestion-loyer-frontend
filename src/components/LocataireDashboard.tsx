import { useState, useEffect } from 'react';
import { Home, DollarSign, FileText, Upload, Camera, LogOut, Download, CheckCircle, AlertCircle, Calendar, Droplet, CreditCard, X, Eye, Bell, AlertTriangle, Sparkles, Building2, Filter, ChevronDown } from 'lucide-react';
import { locataireApi, EcheanceNotification } from '../services/api';

interface LocataireDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function LocataireDashboard({ user, onLogout }: LocataireDashboardProps) {
  const [contrats, setContrats] = useState<any[]>([]);
  const [contratActif, setContratActif] = useState<any>(null);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<EcheanceNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);

  // Form state
  const [nouvelIndexEau, setNouvelIndexEau] = useState('');
  const [dateReleve, setDateReleve] = useState(new Date().toISOString().split('T')[0]);
  const [montantPaye, setMontantPaye] = useState('');
  const [modePaiement, setModePaiement] = useState('Espèces');
  const [moisConcerne, setMoisConcerne] = useState(new Date().toISOString().slice(0, 7));
  const [photoEau, setPhotoEau] = useState<File | null>(null);
  const [photoPaiement, setPhotoPaiement] = useState<File | null>(null);
  const [photoEauPreview, setPhotoEauPreview] = useState<string | null>(null);
  const [photoPaiementPreview, setPhotoPaiementPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filtres
  const [filtreBien, setFiltreBien] = useState<string>('tous');
  const [filtreAnnee, setFiltreAnnee] = useState<string>('tous');
  const [filtreMois, setFiltreMois] = useState<string>('tous');
  const [filtreMode, setFiltreMode] = useState<string>('tous');
  const [showFiltres, setShowFiltres] = useState(false);

  useEffect(() => {
    loadData();
    checkEcheances();
  }, []);

  useEffect(() => {
    if (contratActif) {
      const montantTotal = Number(contratActif.montant_loyer) + Number(contratActif.charges || 0);
      setMontantPaye(String(montantTotal));
    }
  }, [contratActif]);

  const loadData = async () => {
    try {
      const [contratsData, paiementsData] = await Promise.all([
        locataireApi.getMesContrats(),
        locataireApi.getMesPaiements(),
      ]);
      
      setContrats(contratsData);
      if (contratsData.length > 0) {
        setContratActif(contratsData[0]);
      }
      setPaiements(paiementsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkEcheances = async () => {
    try {
      const data = await locataireApi.getMesEcheances();
      setNotifications(data);
    } catch (err) {
      console.error('❌ Frontend: Erreur chargement échéances:', err);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'danger': return 'from-red-500 to-red-600';
      case 'warning': return 'from-orange-500 to-orange-600';
      case 'info': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'danger': return <AlertTriangle className="w-6 h-6" />;
      case 'warning': return <Bell className="w-6 h-6" />;
      default: return <Calendar className="w-6 h-6" />;
    }
  };

  const dismissNotification = async (id: string) => {
    if (id.startsWith('rappel-')) {
      const rappelId = parseInt(id.replace('rappel-', ''));
      try {
        await locataireApi.marquerRappelLu(rappelId);
      } catch (err) {
        console.error('Erreur marquage rappel:', err);
      }
    }
    
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handlePhotoEauChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoEau(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoEauPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoPaiementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPaiement(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPaiementPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhotoEau = () => {
    setPhotoEau(null);
    setPhotoEauPreview(null);
  };

  const removePhotoPaiement = () => {
    setPhotoPaiement(null);
    setPhotoPaiementPreview(null);
  };

  const handleSubmitPaiement = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!contratActif) {
        throw new Error('Veuillez sélectionner un logement');
      }
      
      if (!nouvelIndexEau || !montantPaye || !moisConcerne) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      const moisConcerneDate = `${moisConcerne}-01`;

      const formData = new FormData();
      formData.append('contrat_id', String(contratActif.id));
      formData.append('nouvel_index_eau', nouvelIndexEau);
      formData.append('date_releve_eau', dateReleve);
      formData.append('montant_paye', montantPaye);
      formData.append('mode_paiement', modePaiement);
      formData.append('mois_concerne', moisConcerneDate);
      
      if (photoEau) formData.append('photo_eau', photoEau);
      if (photoPaiement) formData.append('photo_paiement', photoPaiement);

      await locataireApi.soumettrePaiement(formData);
      
      setSuccess('✅ Paiement soumis avec succès !');
      setShowForm(false);
      loadData();
      checkEcheances();
      
      setNouvelIndexEau('');
      setPhotoEau(null);
      setPhotoPaiement(null);
      setPhotoEauPreview(null);
      setPhotoPaiementPreview(null);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError('❌ ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenererQuittance = async (paiementId: number) => {
    try {
      const result = await locataireApi.genererQuittance(paiementId);
      window.open(`http://localhost:3000${result.url}`, '_blank');
    } catch (err: any) {
      alert('❌ Erreur: ' + err.message);
    }
  };

  // Filtrer les notifications selon le logement sélectionné
  const notificationsFiltrees = filtreBien === 'tous' 
    ? notifications 
    : notifications.filter(n => n.contrat_id?.toString() === filtreBien);

  // Filtrer les paiements
  const paiementsFiltres = paiements.filter(paiement => {
    const datePaiement = new Date(paiement.mois_concerne);
    const annee = datePaiement.getFullYear().toString();
    const mois = (datePaiement.getMonth() + 1).toString();

    if (filtreBien !== 'tous' && paiement.contrat_id?.toString() !== filtreBien) return false;
    if (filtreAnnee !== 'tous' && annee !== filtreAnnee) return false;
    if (filtreMois !== 'tous' && mois !== filtreMois) return false;
    if (filtreMode !== 'tous' && paiement.mode_paiement !== filtreMode) return false;

    return true;
  });

  const anneesDisponibles = Array.from(new Set(paiements.map(p => new Date(p.mois_concerne).getFullYear()))).sort((a, b) => b - a);
  const filtresActifs = [filtreBien !== 'tous', filtreAnnee !== 'tous', filtreMois !== 'tous', filtreMode !== 'tous'].filter(Boolean).length;

  // Calculer les statistiques par logement
  const statsParLogement = contrats.map(contrat => {
    const paiementsContrat = paiements.filter(p => p.contrat_id === contrat.id);
    const total = paiementsContrat.reduce((sum, p) => sum + Number(p.montant_paye), 0);
    return {
      contrat_id: contrat.id,
      adresse: contrat.bien_adresse,
      nbPaiements: paiementsContrat.length,
      totalPaye: total,
      dernierPaiement: paiementsContrat.length > 0 ? paiementsContrat[0].date_paiement : null
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="relative">
          <div className="w-24 h-24 border-8 border-blue-200 rounded-full animate-pulse"></div>
          <div className="w-24 h-24 border-t-8 border-blue-600 rounded-full animate-spin absolute top-0 left-0"></div>
          <Sparkles className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8 relative overflow-hidden">
      {/* Décorations de fond */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl -ml-48 -mb-48"></div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header Premium */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-slate-200/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="relative">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl blur-lg opacity-50"></div>
                  <div className="relative p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl">
                    <Home className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                      Mon Espace Locataire
                    </h1>
                    <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                  </div>
                  <p className="text-slate-600 mt-1 font-medium">Bienvenue, {user?.locataire_nom}</p>
                  <p className="text-sm text-blue-600 font-semibold mt-1">
                    {contrats.length} logement{contrats.length > 1 ? 's' : ''} • {paiements.length} paiement{paiements.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {notificationsFiltrees.length > 0 && (
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg font-semibold"
                  >
                    <Bell className={`w-5 h-5 ${!showNotifications ? 'animate-pulse' : ''}`} />
                    <span className="hidden sm:inline">
                      {showNotifications ? 'Masquer' : 'Voir'} alertes
                    </span>
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                      {notificationsFiltrees.length}
                    </span>
                  </button>
                )}
                
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all shadow-lg font-semibold group"
                >
                  <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vue d'ensemble des logements */}
        {contrats.length > 1 && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-slate-200/50">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              Vue d'ensemble de vos logements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statsParLogement.map((stat) => (
                <div 
                  key={stat.contrat_id}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                    contratActif?.id === stat.contrat_id
                      ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400 shadow-lg'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                  onClick={() => {
                    const contrat = contrats.find(c => c.id === stat.contrat_id);
                    setContratActif(contrat || null);
                    setFiltreBien(stat.contrat_id.toString());
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm mb-1">🏠 {stat.adresse}</p>
                      {contratActif?.id === stat.contrat_id && (
                        <span className="inline-block px-2 py-1 bg-blue-500 text-white text-xs rounded-lg font-bold">
                          Sélectionné
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Paiements:</span>
                      <span className="font-bold text-slate-800">{stat.nbPaiements}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total payé:</span>
                      <span className="font-bold text-emerald-600">{stat.totalPaye.toLocaleString()} FCFA</span>
                    </div>
                    {stat.dernierPaiement && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Dernier:</span>
                        <span className="font-semibold text-slate-700">
                          {new Date(stat.dernierPaiement).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sélecteur de logement */}
        {contrats.length > 0 && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-slate-200/50">
            <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {contrats.length > 1 ? 'Logement actif pour les paiements' : 'Votre logement'}
            </label>
            {contrats.length > 1 ? (
              <>
                <select
                  value={contratActif?.id || ''}
                  onChange={(e) => {
                    const contrat = contrats.find(c => c.id === Number(e.target.value));
                    setContratActif(contrat || null);
                  }}
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-slate-800 cursor-pointer transition-all bg-white"
                >
                  {contrats.map((contrat) => (
                    <option key={contrat.id} value={contrat.id}>
                      🏠 {contrat.bien_adresse} - {Number(contrat.montant_loyer).toLocaleString()} FCFA/mois
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  💡 Ce logement sera utilisé pour déclarer vos prochains paiements
                </p>
              </>
            ) : (
              <div className="px-4 py-4 bg-blue-50 border-2 border-blue-200 rounded-2xl font-semibold text-slate-800">
                🏠 {contratActif?.bien_adresse} - {Number(contratActif?.montant_loyer || 0).toLocaleString()} FCFA/mois
              </div>
            )}
          </div>
        )}

        {/* Notifications d'échéances filtrées */}
        {notificationsFiltrees.length > 0 && showNotifications && (
          <div className="space-y-3">
            {notificationsFiltrees.map((notification) => {
              const contratNotif = contrats.find(c => c.id === notification.contrat_id);
              return (
                <div
                  key={notification.id}
                  className={`bg-gradient-to-r ${getNotificationColor(notification.type)} rounded-3xl shadow-xl p-6 text-white relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl flex-shrink-0 animate-pulse">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-xl mb-2 flex items-center gap-2">
                          {notification.type === 'danger' ? '🚨 Paiement en retard !' : 
                           notification.type === 'warning' ? '⚠️ Échéance proche' : 
                           '📅 Rappel de paiement'}
                          {notification.source === 'admin' && (
                            <span className="text-xs bg-white/30 px-3 py-1 rounded-full font-semibold">
                              Message du propriétaire
                            </span>
                          )}
                        </h3>
                        {contratNotif && contrats.length > 1 && (
                          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl mb-3 inline-block">
                            <span className="font-bold text-sm">🏠 {contratNotif.bien_adresse}</span>
                          </div>
                        )}
                        <p className="text-white/95 mb-4 font-medium">{notification.message}</p>
                        <div className="flex flex-wrap gap-3 text-sm mb-4">
                          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                            <span className="opacity-90">Période: </span>
                            <span className="font-bold">
                              {new Date(notification.moisConcerne).toLocaleDateString('fr-FR', { 
                                month: 'long', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                            <span className="opacity-90">Montant: </span>
                            <span className="font-black text-lg">{notification.montant.toLocaleString()} FCFA</span>
                          </div>
                          {notification.joursRetard > 0 && (
                            <div className="bg-red-900/60 backdrop-blur-sm px-4 py-2 rounded-xl">
                              <span className="opacity-90">Retard: </span>
                              <span className="font-bold">{notification.joursRetard} jour{notification.joursRetard > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const contrat = contrats.find(c => c.id === notification.contrat_id);
                            setContratActif(contrat || null);
                            setShowForm(true);
                          }}
                          className="bg-white text-gray-800 px-6 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-xl"
                        >
                          💳 Déclarer mon paiement maintenant
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Message si notifications masquées */}
        {notificationsFiltrees.length > 0 && !showNotifications && (
          <div className="bg-white/90 backdrop-blur-xl border-2 border-orange-200 rounded-2xl p-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-2xl">
                <Bell className="w-6 h-6 text-orange-600 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-orange-900 text-lg">
                  {notificationsFiltrees.length} notification{notificationsFiltrees.length > 1 ? 's' : ''} en attente
                </p>
                <p className="text-sm text-orange-700">
                  Cliquez sur "Voir alertes" pour les afficher
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNotifications(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold shadow-lg"
            >
              Afficher
            </button>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 flex items-center gap-3 shadow-lg animate-fadeIn">
            <div className="p-2 bg-emerald-500 rounded-full">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <p className="text-emerald-800 font-bold text-lg">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-center gap-3 shadow-lg animate-fadeIn">
            <div className="p-2 bg-red-500 rounded-full">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <p className="text-red-800 font-bold text-lg">{error}</p>
          </div>
        )}

        {/* Informations du contrat actif */}
        {contratActif && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-slate-200/50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl blur-lg opacity-50"></div>
                    <div className="relative p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl">
                      <Home className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {contrats.length > 1 ? 'Logement sélectionné' : 'Votre logement'}
                  </h2>
                </div>
                {contrats.length > 1 && (
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold">
                    {contrats.findIndex(c => c.id === contratActif.id) + 1} / {contrats.length}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200 shadow-lg col-span-full">
                  <p className="text-blue-600 text-sm mb-2 font-bold">Adresse</p>
                  <p className="font-bold text-slate-800 text-lg">{contratActif.bien_adresse}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-200 shadow-lg">
                  <p className="text-emerald-600 text-sm mb-2 font-bold">Loyer mensuel</p>
                  <p className="font-black text-emerald-700 text-2xl">{Number(contratActif.montant_loyer).toLocaleString()} FCFA</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border border-orange-200 shadow-lg">
                  <p className="text-orange-600 text-sm mb-2 font-bold">Charges</p>
                  <p className="font-black text-orange-700 text-2xl">{Number(contratActif.charges || 0).toLocaleString()} FCFA</p>
                </div>
                {contratActif.ancien_index_eau && (
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-5 border border-cyan-200 shadow-lg">
                    <p className="text-cyan-600 text-sm mb-2 font-bold">Dernier index eau</p>
                    <p className="font-bold text-slate-800 text-lg">{contratActif.nouvel_index_eau || contratActif.ancien_index_eau} m³</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bouton nouveau paiement */}
        {!showForm && contratActif && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full md:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-8 py-5 rounded-3xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-2xl font-bold text-lg group"
          >
            <DollarSign className="w-7 h-7 group-hover:scale-110 transition-transform" />
            Déclarer un paiement pour ce logement
          </button>
        )}

        {/* Formulaire de paiement */}
        {showForm && contratActif && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-slate-200/50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Nouveau paiement</h2>
                <p className="text-sm text-slate-600 mt-1">Pour: {contratActif.bien_adresse}</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Mois concerné *
                </label>
                <input
                  type="month"
                  value={moisConcerne}
                  onChange={(e) => setMoisConcerne(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                  required
                />
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-3xl p-6">
                <h3 className="font-bold text-lg text-blue-800 mb-4 flex items-center gap-2">
                  <Droplet className="w-5 h-5" />
                  Relevé de compteur d'eau
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nouvel index (m³) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={nouvelIndexEau}
                      onChange={(e) => setNouvelIndexEau(e.target.value)}
                      placeholder="Ex: 245.50"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Date du relevé *
                    </label>
                    <input
                      type="date"
                      value={dateReleve}
                      onChange={(e) => setDateReleve(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Photo du compteur d'eau
                  </label>
                  {!photoEauPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-blue-300 rounded-2xl cursor-pointer bg-white hover:bg-blue-50 transition-all group">
                      <Upload className="w-12 h-12 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-sm text-blue-600 font-bold">Cliquez pour ajouter une photo</p>
                      <p className="text-xs text-blue-500 mt-1">JPG, PNG (Max 5MB)</p>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handlePhotoEauChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={photoEauPreview}
                        alt="Compteur eau"
                        className="w-full h-56 object-cover rounded-2xl border-2 border-blue-200 shadow-lg"
                      />
                      <button
                        onClick={removePhotoEau}
                        className="absolute top-3 right-3 bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-all shadow-xl"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-3xl p-6">
                <h3 className="font-bold text-lg text-emerald-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Informations de paiement
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Montant payé (FCFA) *
                    </label>
                    <input
                      type="number"
                      value={montantPaye}
                      onChange={(e) => setMontantPaye(e.target.value)}
                      placeholder="Ex: 50000"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium transition-all"
                      required
                    />
                    {contratActif && (
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        Montant attendu: {(Number(contratActif.montant_loyer) + Number(contratActif.charges || 0)).toLocaleString()} FCFA
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Mode de paiement *
                    </label>
                    <select
                      value={modePaiement}
                      onChange={(e) => setModePaiement(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer font-medium transition-all"
                    >
                      <option value="Espèces">💵 Espèces</option>
                      <option value="Virement">🏦 Virement</option>
                      <option value="Mobile Money">📱 Mobile Money</option>
                      <option value="Chèque">📝 Chèque</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Preuve de paiement (reçu, capture d'écran...)
                  </label>
                  
                  {!photoPaiementPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-emerald-300 rounded-2xl cursor-pointer bg-white hover:bg-emerald-50 transition-all group">
                      <Upload className="w-12 h-12 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-sm text-emerald-600 font-bold">Cliquez pour ajouter une photo</p>
                      <p className="text-xs text-emerald-500 mt-1">JPG, PNG (Max 5MB)</p>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handlePhotoPaiementChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={photoPaiementPreview}
                        alt="Preuve paiement"
                        className="w-full h-56 object-cover rounded-2xl border-2 border-emerald-200 shadow-lg"
                      />
                      <button
                        onClick={removePhotoPaiement}
                        className="absolute top-3 right-3 bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-all shadow-xl"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-4 border-2 border-slate-300 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitPaiement}
                  disabled={submitting || !contratActif || !nouvelIndexEau || !montantPaye}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      Soumettre le paiement
                    </>
                  )}
                </button>
              </div>
              
              {!contratActif && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800 font-semibold">
                    Veuillez sélectionner un logement pour continuer
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Historique des paiements */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-slate-200/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Historique des paiements
              {paiementsFiltres.length !== paiements.length && (
                <span className="text-sm text-slate-500 font-normal">
                  ({paiementsFiltres.length} / {paiements.length})
                </span>
              )}
            </h2>

            {paiements.length > 0 && (
              <button
                onClick={() => setShowFiltres(!showFiltres)}
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg relative"
              >
                <Filter className="w-5 h-5" />
                {showFiltres ? 'Masquer' : 'Filtrer'}
                {filtresActifs > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {filtresActifs}
                  </span>
                )}
              </button>
            )}
          </div>

          {showFiltres && paiements.length > 0 && (
            <div className="mb-6 bg-blue-50/50 rounded-2xl border-2 border-blue-200 p-6 animate-slideDown">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {contrats.length > 1 && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Logement
                    </label>
                    <select
                      value={filtreBien}
                      onChange={(e) => setFiltreBien(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="tous">🏠 Tous les logements</option>
                      {contrats.map(contrat => (
                        <option key={contrat.id} value={contrat.id}>
                          📍 {contrat.bien_adresse}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Année
                  </label>
                  <select
                    value={filtreAnnee}
                    onChange={(e) => setFiltreAnnee(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="tous">📅 Toutes les années</option>
                    {anneesDisponibles.map(annee => (
                      <option key={annee} value={annee}>📆 {annee}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Mois
                  </label>
                  <select
                    value={filtreMois}
                    onChange={(e) => setFiltreMois(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="tous">📅 Tous les mois</option>
                    <option value="1">Janvier</option>
                    <option value="2">Février</option>
                    <option value="3">Mars</option>
                    <option value="4">Avril</option>
                    <option value="5">Mai</option>
                    <option value="6">Juin</option>
                    <option value="7">Juillet</option>
                    <option value="8">Août</option>
                    <option value="9">Septembre</option>
                    <option value="10">Octobre</option>
                    <option value="11">Novembre</option>
                    <option value="12">Décembre</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    Mode
                  </label>
                  <select
                    value={filtreMode}
                    onChange={(e) => setFiltreMode(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="tous">💳 Tous les modes</option>
                    <option value="Espèces">💵 Espèces</option>
                    <option value="Virement">🏦 Virement</option>
                    <option value="Mobile Money">📱 Mobile Money</option>
                    <option value="Chèque">📝 Chèque</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t-2 border-blue-200">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-blue-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-700">
                    <span className="font-bold text-blue-600 text-lg">{paiementsFiltres.length}</span>
                    <span className="ml-1 text-gray-600">paiement{paiementsFiltres.length > 1 ? 's' : ''} trouvé{paiementsFiltres.length > 1 ? 's' : ''}</span>
                  </p>
                </div>
                
                {filtresActifs > 0 && (
                  <button
                    onClick={() => {
                      setFiltreBien('tous');
                      setFiltreAnnee('tous');
                      setFiltreMois('tous');
                      setFiltreMode('tous');
                    }}
                    className="px-6 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all font-bold shadow-lg flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
          )}

          {paiementsFiltres.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                <DollarSign className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-slate-600 font-bold text-lg mb-2">
                {paiements.length === 0 ? 'Aucun paiement enregistré' : 'Aucun paiement trouvé'}
              </p>
              <p className="text-sm text-slate-500">
                {paiements.length === 0 ? 'Commencez par déclarer votre premier paiement' : 'Essayez de modifier vos filtres'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paiementsFiltres.map((paiement) => (
                <div
                  key={paiement.id}
                  className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-5 hover:shadow-xl transition-all duration-300 border-2 border-slate-200 group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        {contrats.length > 1 && (
                          <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-bold">
                            🏠 {paiement.bien_adresse}
                          </span>
                        )}
                        <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-bold">
                          {new Date(paiement.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </span>
                        <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold">
                          {Number(paiement.montant_paye).toLocaleString()} FCFA
                        </span>
                        <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                          {paiement.mode_paiement}
                        </span>
                      </div>
                      
                      <div className="text-sm text-slate-600">
                        <span className="text-slate-500">Payé le:</span>
                        <span className="ml-2 font-bold text-slate-800">
                          {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      {(paiement.photo_eau || paiement.photo_paiement) && (
                        <div className="flex gap-2">
                          {paiement.photo_eau && (
                            <button
                              onClick={() => window.open(`http://localhost:3000/uploads/photos/${paiement.photo_eau}`, '_blank')}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all font-medium"
                            >
                              <Eye className="w-3 h-3" />
                              Photo compteur
                            </button>
                          )}
                          {paiement.photo_paiement && (
                            <button
                              onClick={() => window.open(`http://localhost:3000/uploads/photos/${paiement.photo_paiement}`, '_blank')}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all font-medium"
                            >
                              <Eye className="w-3 h-3" />
                              Preuve paiement
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleGenererQuittance(paiement.id)}
                      className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-bold group-hover:scale-105"
                    >
                      <Download className="w-5 h-5" />
                      Quittance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); max-height: 0; }
          to { opacity: 1; transform: translateY(0); max-height: 500px; }
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}