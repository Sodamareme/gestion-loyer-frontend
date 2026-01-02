import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, AlertCircle, CheckCircle, Printer, Eye, RefreshCw, Shield } from 'lucide-react';
import api, { auth, Contrat, Paiement } from '../services/api';
import NotificationsEcheances from './NotificationsEcheances';
const API_BASE_URL = 'http://localhost:3000/api';

export default function Documents() {
  const [activeTab, setActiveTab] = useState<'quittance' | 'avis' | 'caution'>('quittance');
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [selectedContrat, setSelectedContrat] = useState<number | null>(null);
  const [selectedPaiement, setSelectedPaiement] = useState<number | null>(null);
  const [moisConcerne, setMoisConcerne] = useState('');
  const [montantCaution, setMontantCaution] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const token = auth.getToken();
      
      const [contratsData, paiementsData] = await Promise.all([
        fetch('http://localhost:3000/api/contrats?statut=actif', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => {
          if (r.status === 401) {
            auth.logout();
            throw new Error('Session expirée');
          }
          return r.json();
        }),
        api.paiements.getAll()
      ]);
      
      setContrats(contratsData);
      setPaiements(paiementsData);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' });
    } finally {
      setLoadingData(false);
    }
  };

  const handleGenerateQuittance = async () => {
    if (!selectedPaiement) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un paiement' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setGeneratedUrl(null);

    try {
      const token = auth.getToken();
      const res = await fetch(`${API_BASE_URL}/pdf/quittance/${selectedPaiement}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (res.status === 401) {
        auth.logout();
        throw new Error('Session expirée');
      }

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la génération');
      }

      const data = await res.json();
      setGeneratedUrl(data.url);
      setMessage({ type: 'success', text: data.message || 'Quittance générée avec succès!' });
    } catch (error: any) {
      console.error('Erreur génération quittance:', error);
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la génération de la quittance' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAvis = async () => {
    if (!selectedContrat || !moisConcerne) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un contrat et un mois' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setGeneratedUrl(null);

    try {
      let moisFormatted = moisConcerne;
      if (moisFormatted && moisFormatted.length === 7) {
        moisFormatted = `${moisFormatted}-01`;
      }

      console.log('Génération avis pour contrat:', selectedContrat, 'mois:', moisFormatted);

      const res = await fetch(`${API_BASE_URL}/pdf/avis-echeance/${selectedContrat}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mois_concerne: moisFormatted }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la génération');
      }

      const data = await res.json();
      setGeneratedUrl(data.url);
      setMessage({ type: 'success', text: data.message || 'Avis d\'échéance généré avec succès!' });
    } catch (error: any) {
      console.error('Erreur génération avis:', error);
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la génération de l\'avis d\'échéance' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCaution = async () => {
    if (!selectedContrat) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un contrat' });
      return;
    }

    if (!montantCaution || Number(montantCaution) <= 0) {
      setMessage({ type: 'error', text: 'Veuillez entrer un montant de caution valide' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setGeneratedUrl(null);

    try {
      console.log('Génération caution pour contrat:', selectedContrat, 'montant:', montantCaution);

      const res = await fetch(`${API_BASE_URL}/pdf/quittance-caution/${selectedContrat}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montant_caution: Number(montantCaution) }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la génération');
      }

      const data = await res.json();
      setGeneratedUrl(data.url);
      setMessage({ type: 'success', text: data.message || 'Quittance de caution générée avec succès!' });
    } catch (error: any) {
      console.error('Erreur génération caution:', error);
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la génération de la quittance de caution' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedUrl) {
      window.open(`http://localhost:3000${generatedUrl}`, '_blank');
    }
  };

  // Calculer automatiquement le montant de caution (2 mois de loyer)
  const handleContratSelectCaution = (contratId: number) => {
    setSelectedContrat(contratId);
    const contrat = contrats.find(c => (c.id || c.contrat_id) === contratId);
    if (contrat) {
      const loyer = Number(contrat.montant_loyer || 0);
      setMontantCaution((loyer * 2).toString());
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'alertes */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Génération de Documents</h1>
              <p className="text-gray-600 mt-1">Créez vos quittances et avis d'échéance en un clic</p>
            </div>
          </div>
          
          {/* Bouton Alertes d'échéances */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl ${
              showNotifications
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
            }`}
          >
            <AlertCircle className={`w-5 h-5 ${showNotifications ? '' : 'animate-pulse'}`} />
            <span>{showNotifications ? 'Masquer les alertes' : 'Voir les alertes'}</span>
          </button>
        </div>
      </div>

      {/* Notifications d'échéances conditionnelles */}
      {showNotifications && (
        <div className="animate-fadeIn">
          <NotificationsEcheances />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('quittance');
              setMessage(null);
              setGeneratedUrl(null);
            }}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'quittance'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Quittance Loyer</span>
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('avis');
              setMessage(null);
              setGeneratedUrl(null);
            }}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'avis'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>Avis d'Échéance</span>
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('caution');
              setMessage(null);
              setGeneratedUrl(null);
            }}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'caution'
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Quittance Caution</span>
            </div>
          </button>
        </div>

        <div className="p-8">
          {/* Message d'alerte */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
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

          {/* Contenu Quittance */}
          {activeTab === 'quittance' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Générer une Quittance de Loyer
                </h3>
                <p className="text-blue-700 text-sm mb-4">
                  Sélectionnez un paiement pour générer automatiquement la quittance correspondante
                </p>
                
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Paiement à documenter *
                    </span>
                    <select
                      value={selectedPaiement || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedPaiement(value ? Number(value) : null);
                        console.log('Paiement sélectionné:', value);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                    >
                      <option value="">-- Sélectionner un paiement --</option>
                      {paiements.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.locataire_nom} - {p.bien_adresse} - {new Date(p.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} ({Number(p.montant_paye).toLocaleString()} FCFA)
                        </option>
                      ))}
                    </select>
                    {paiements.length === 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        Aucun paiement trouvé. Créez d'abord un paiement.
                      </p>
                    )}
                  </label>

                  {selectedPaiement && (
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-800 mb-2">Détails du paiement</h4>
                      {paiements.filter(p => p.id === selectedPaiement).map(p => (
                        <div key={p.id} className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Locataire:</span> {p.locataire_nom}</p>
                          <p><span className="font-medium">Bien:</span> {p.bien_adresse}</p>
                          <p><span className="font-medium">Période:</span> {new Date(p.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                          <p><span className="font-medium">Montant payé:</span> {Number(p.montant_paye).toLocaleString()} FCFA</p>
                          <p><span className="font-medium">Date:</span> {new Date(p.date_paiement).toLocaleDateString('fr-FR')}</p>
                          <p><span className="font-medium">Mode:</span> {p.mode_paiement}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateQuittance}
                    disabled={loading || !selectedPaiement}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Génération en cours...</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-5 h-5" />
                        <span>Générer la Quittance</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contenu Avis d'Échéance */}
          {activeTab === 'avis' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Générer un Avis d'Échéance
                </h3>
                <p className="text-purple-700 text-sm mb-4">
                  Créez un avis d'échéance pour rappeler aux locataires leurs prochains paiements
                </p>
                
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Contrat concerné *
                    </span>
                    <select
                      value={selectedContrat || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedContrat(value ? Number(value) : null);
                        console.log('Contrat sélectionné:', value);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                    >
                      <option value="">-- Sélectionner un contrat --</option>
                      {contrats.map((c) => {
                        const id = c.id || c.contrat_id;
                        const montant = Number(c.montant_loyer || 0);
                        
                        return (
                          <option key={id} value={id}>
                            {c.locataire_nom} - {c.bien_adresse} ({montant.toLocaleString()} FCFA/mois)
                          </option>
                        );
                      })}
                    </select>
                    {contrats.length === 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        Aucun contrat actif trouvé. Créez d'abord un contrat.
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Mois concerné *
                    </span>
                    <input
                      type="month"
                      value={moisConcerne}
                      onChange={(e) => {
                        setMoisConcerne(e.target.value);
                        console.log('Mois sélectionné:', e.target.value);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                    />
                  </label>

                  {selectedContrat && (
                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-gray-800 mb-2">Détails du contrat</h4>
                      {contrats.filter(c => (c.id || c.contrat_id) === selectedContrat).map(c => {
                        const id = c.id || c.contrat_id;
                        const montantLoyer = Number(c.montant_loyer || 0);
                        const charges = Number(c.charges || 0);
                        
                        return (
                          <div key={id} className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-medium">Locataire:</span> {c.locataire_nom}</p>
                            <p><span className="font-medium">Bien:</span> {c.bien_adresse}</p>
                            <p><span className="font-medium">Loyer mensuel:</span> {montantLoyer.toLocaleString()} FCFA</p>
                            <p><span className="font-medium">Charges:</span> {charges.toLocaleString()} FCFA</p>
                            <p className="pt-2 font-semibold text-purple-700">
                              Total à payer: {(montantLoyer + charges).toLocaleString()} FCFA
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateAvis}
                    disabled={loading || !selectedContrat || !moisConcerne}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Génération en cours...</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-5 h-5" />
                        <span>Générer l'Avis d'Échéance</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contenu Quittance de Caution */}
          {activeTab === 'caution' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Générer une Quittance de Caution
                </h3>
                <p className="text-orange-700 text-sm mb-4">
                  Document attestant du paiement de la caution locative (généralement 2 mois de loyer)
                </p>
                
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Contrat concerné *
                    </span>
                    <select
                      value={selectedContrat || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) {
                          handleContratSelectCaution(Number(value));
                        } else {
                          setSelectedContrat(null);
                          setMontantCaution('');
                        }
                        console.log('Contrat sélectionné pour caution:', value);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all"
                    >
                      <option value="">-- Sélectionner un contrat --</option>
                      {contrats.map((c) => {
                        const id = c.id || c.contrat_id;
                        const montant = Number(c.montant_loyer || 0);
                        
                        return (
                          <option key={id} value={id}>
                            {c.locataire_nom} - {c.bien_adresse} ({montant.toLocaleString()} FCFA/mois)
                          </option>
                        );
                      })}
                    </select>
                    {contrats.length === 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        Aucun contrat actif trouvé. Créez d'abord un contrat.
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Montant de la caution (FCFA) *
                    </span>
                    <input
                      type="number"
                      value={montantCaution}
                      onChange={(e) => setMontantCaution(e.target.value)}
                      placeholder="Montant automatiquement calculé"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Le montant est automatiquement calculé (2 mois de loyer) mais vous pouvez le modifier
                    </p>
                  </label>

                  {selectedContrat && montantCaution && (
                    <div className="bg-white p-4 rounded-lg border border-orange-200">
                      <h4 className="font-semibold text-gray-800 mb-2">Détails de la caution</h4>
                      {contrats.filter(c => (c.id || c.contrat_id) === selectedContrat).map(c => {
                        const id = c.id || c.contrat_id;
                        const montantLoyer = Number(c.montant_loyer || 0);
                        const nbMois = Math.round(Number(montantCaution) / montantLoyer);
                        
                        return (
                          <div key={id} className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-medium">Locataire:</span> {c.locataire_nom}</p>
                            <p><span className="font-medium">Bien:</span> {c.bien_adresse}</p>
                            <p><span className="font-medium">Loyer mensuel:</span> {montantLoyer.toLocaleString()} FCFA</p>
                            <p className="pt-2 font-semibold text-orange-700">
                              Caution: {Number(montantCaution).toLocaleString()} FCFA ({nbMois} mois de loyer)
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateCaution}
                    disabled={loading || !selectedContrat || !montantCaution}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-orange-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Génération en cours...</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-5 h-5" />
                        <span>Générer la Quittance de Caution</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Zone de téléchargement */}
          {generatedUrl && (
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-3 rounded-full">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-900">Document généré avec succès!</h4>
                    <p className="text-sm text-green-700">Votre document est prêt à être téléchargé</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleDownload}
                    className="bg-white text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-all border border-green-300 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ouvrir
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Quittance de Loyer
          </h3>
          <p className="text-sm text-gray-600">
            Document officiel attestant du paiement du loyer. Obligatoire sur demande du locataire.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Avis d'Échéance
          </h3>
          <p className="text-sm text-gray-600">
            Rappel de paiement envoyé au locataire avant la date d'échéance du loyer.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-600" />
            Quittance de Caution
          </h3>
          <p className="text-sm text-gray-600">
            Reçu du dépôt de garantie versé au début du bail. À conserver précieusement.
          </p>
        </div>
      </div>
    </div>
  );
}