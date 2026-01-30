import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Calendar, Search, Filter, X, File, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { locataireApi } from '../services/api';
import { DocumentLocataire } from '../services/api';

interface Document {
  id: number;
  type: 'quittance' | 'avis_echeance' | 'contrat' | 'quittance_caution';
  nom_fichier: string;
  url: string;
  date_creation: string;
  mois_concerne?: string;
  montant?: number;
  bien_adresse?: string;
  numero_bien?: string;
  contrat_id?: number;
  paiement_id?: number;
}

const DOCUMENTS_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LocataireDocuments() {
      const [documents, setDocuments] = useState<DocumentLocataire[]>([]);
   const [loading, setLoading] = useState(true);
  const [filtreType, setFiltreType] = useState<string>('tous');
  const [filtreAnnee, setFiltreAnnee] = useState<string>('tous');
  const [filtreBien, setFiltreBien] = useState<string>('tous');
  const [recherche, setRecherche] = useState('');
  const [showFiltres, setShowFiltres] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

const loadDocuments = async () => {
  setLoading(true);
  try {
    // ✅ Utiliser locataireApi (pas api)
   const data = await locataireApi.getMesDocuments();
    setDocuments(data);
  } catch (error: any) {
    console.error('❌ Erreur:', error);
  } finally {
    setLoading(false);
  }
};

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quittance':
        return { icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-100' };
      case 'avis_echeance':
        return { icon: <Calendar className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'contrat':
        return { icon: <FileText className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'quittance_caution':
        return { icon: <File className="w-5 h-5" />, color: 'text-orange-600', bg: 'bg-orange-100' };
      default:
        return { icon: <File className="w-5 h-5" />, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quittance': return 'Quittance de loyer';
      case 'avis_echeance': return 'Avis d\'échéance';
      case 'contrat': return 'Contrat de location';
      case 'quittance_caution': return 'Quittance de caution';
      default: return 'Document';
    }
  };

  const handleOuvrirDocument = (url: string) => {
    window.open(`${DOCUMENTS_BASE_URL}${url}`, '_blank');
  };

  const handleTelechargerDocument = (url: string, nomFichier: string) => {
    const link = document.createElement('a');
    link.href = `${DOCUMENTS_BASE_URL}${url}`;
    link.download = nomFichier;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setMessage({ type: 'success', text: '📥 Téléchargement lancé!' });
    setTimeout(() => setMessage(null), 3000);
  };

  // Filtrer les documents
  const documentsFiltres = documents.filter(doc => {
    // Filtre par type
    if (filtreType !== 'tous' && doc.type !== filtreType) return false;

    // Filtre par année
    if (filtreAnnee !== 'tous') {
      const anneeDoc = new Date(doc.mois_concerne || doc.date_creation).getFullYear().toString();
      if (anneeDoc !== filtreAnnee) return false;
    }

    // Filtre par bien
    if (filtreBien !== 'tous' && doc.bien_adresse !== filtreBien) return false;

    // Recherche
    if (recherche) {
      const rechercheMin = recherche.toLowerCase();
      const nomFichier = doc.nom_fichier.toLowerCase();
      const typeLabel = getTypeLabel(doc.type).toLowerCase();
      const adresse = (doc.bien_adresse || '').toLowerCase();
      
      if (!nomFichier.includes(rechercheMin) && 
          !typeLabel.includes(rechercheMin) && 
          !adresse.includes(rechercheMin)) {
        return false;
      }
    }

    return true;
  });

  // Obtenir les années disponibles
  const anneesDisponibles = Array.from(
    new Set(
      documents.map(doc => 
        new Date(doc.mois_concerne || doc.date_creation).getFullYear()
      )
    )
  ).sort((a, b) => b - a);

  // Obtenir les biens disponibles (adresses uniques)
  const biensDisponibles = Array.from(
    new Set(
      documents
        .filter(doc => doc.bien_adresse)
        .map(doc => doc.bien_adresse)
    )
  ).filter(Boolean) as string[];

  const filtresActifs = [
    filtreType !== 'tous',
    filtreAnnee !== 'tous',
    filtreBien !== 'tous',
    recherche !== ''
  ].filter(Boolean).length;

  // Grouper par type
  const documentsParType = {
    quittance: documentsFiltres.filter(d => d.type === 'quittance'),
    avis_echeance: documentsFiltres.filter(d => d.type === 'avis_echeance'),
    contrat: documentsFiltres.filter(d => d.type === 'contrat'),
    quittance_caution: documentsFiltres.filter(d => d.type === 'quittance_caution'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Chargement de vos documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-slate-200/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl">
                <FileText className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mes Documents
              </h1>
              <p className="text-slate-600 mt-1">
                {documentsFiltres.length} document{documentsFiltres.length > 1 ? 's' : ''} disponible{documentsFiltres.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFiltres(!showFiltres)}
            className="relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-semibold"
          >
            <Filter className="w-5 h-5" />
            <span>{showFiltres ? 'Masquer' : 'Filtrer'}</span>
            {filtresActifs > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                {filtresActifs}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${
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

      {/* Panel de filtres */}
      {showFiltres && (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 overflow-hidden animate-slideDown">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtrer vos documents
            </h3>
          </div>

          <div className="p-6 space-y-4">
            {/* Barre de recherche */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                🔍 Rechercher
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher par nom, type ou adresse..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                {recherche && (
                  <button
                    onClick={() => setRecherche('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtre par type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📄 Type de document
                </label>
                <select
                  value={filtreType}
                  onChange={(e) => setFiltreType(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                >
                  <option value="tous">Tous les types</option>
                  <option value="quittance">✅ Quittances ({documentsParType.quittance.length})</option>
                  <option value="avis_echeance">📅 Avis d'échéance ({documentsParType.avis_echeance.length})</option>
                  <option value="contrat">📝 Contrats ({documentsParType.contrat.length})</option>
                  <option value="quittance_caution">🛡️ Quittances caution ({documentsParType.quittance_caution.length})</option>
                </select>
              </div>

              {/* Filtre par année */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📅 Année
                </label>
                <select
                  value={filtreAnnee}
                  onChange={(e) => setFiltreAnnee(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                >
                  <option value="tous">Toutes les années</option>
                  {anneesDisponibles.map(annee => (
                    <option key={annee} value={annee}>{annee}</option>
                  ))}
                </select>
              </div>

              {/* Filtre par bien */}
              {biensDisponibles.length > 1 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    🏠 Logement
                  </label>
                  <select
                    value={filtreBien}
                    onChange={(e) => setFiltreBien(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                  >
                    <option value="tous">Tous les logements</option>
                    {biensDisponibles.map(adresse => (
                      <option key={adresse} value={adresse}>
                        {adresse}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Bouton réinitialiser */}
            {filtresActifs > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setFiltreType('tous');
                    setFiltreAnnee('tous');
                    setFiltreBien('tous');
                    setRecherche('');
                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-2xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all shadow-md flex items-center justify-center gap-2"
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
        <div className="bg-blue-50 border border-blue-300 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-blue-800">
              <span className="font-bold text-lg">{documentsFiltres.length}</span>
              <span className="ml-1">document{documentsFiltres.length > 1 ? 's' : ''} trouvé{documentsFiltres.length > 1 ? 's' : ''}</span>
            </p>
          </div>
          <p className="text-xs text-blue-600 font-medium">
            {filtresActifs} filtre{filtresActifs > 1 ? 's' : ''} actif{filtresActifs > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Statistiques */}
      {documents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-5">
            <p className="text-sm text-green-700 font-medium mb-1">✅ Quittances</p>
            <p className="text-3xl font-bold text-green-900">{documentsParType.quittance.length}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5">
            <p className="text-sm text-blue-700 font-medium mb-1">📅 Avis d'échéance</p>
            <p className="text-3xl font-bold text-blue-900">{documentsParType.avis_echeance.length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-5">
            <p className="text-sm text-purple-700 font-medium mb-1">📝 Contrats</p>
            <p className="text-3xl font-bold text-purple-900">{documentsParType.contrat.length}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-5">
            <p className="text-sm text-orange-700 font-medium mb-1">🛡️ Cautions</p>
            <p className="text-3xl font-bold text-orange-900">{documentsParType.quittance_caution.length}</p>
          </div>
        </div>
      )}

      {/* Liste des documents */}
      {documentsFiltres.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-12 border border-slate-200/50 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
            <FileText className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-600 font-bold text-lg mb-2">
            {documents.length === 0 ? 'Aucun document disponible' : 'Aucun document trouvé'}
          </p>
          <p className="text-sm text-slate-500">
            {documents.length === 0 
              ? 'Vos documents apparaîtront ici une fois générés' 
              : 'Essayez de modifier vos filtres'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documentsFiltres.map((doc) => {
            const { icon, color, bg } = getTypeIcon(doc.type);
            
            return (
              <div
                key={doc.id}
                className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200 hover:shadow-xl transition-all group"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`${bg} p-3 rounded-xl ${color} flex-shrink-0`}>
                      {icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-slate-800">{getTypeLabel(doc.type)}</h3>
                        <span className={`px-3 py-1 ${bg} ${color} text-xs font-bold rounded-lg`}>
                          {doc.type === 'quittance' && '✅'}
                          {doc.type === 'avis_echeance' && '📅'}
                          {doc.type === 'contrat' && '📝'}
                          {doc.type === 'quittance_caution' && '🛡️'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-slate-600 flex-wrap">
                        {doc.mois_concerne && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(doc.mois_concerne).toLocaleDateString('fr-FR', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                        )}
                        {doc.montant && (
                          <span className="font-semibold text-emerald-600">
                            {Number(doc.montant).toLocaleString()} FCFA
                          </span>
                        )}
                        {doc.bien_adresse && (
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded truncate max-w-xs">
                            🏠 {doc.bien_adresse}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-500 mt-1">
                        Créé le {new Date(doc.date_creation).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleOuvrirDocument(doc.url)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Ouvrir</span>
                    </button>
                    <button
                      onClick={() => handleTelechargerDocument(doc.url, doc.nom_fichier)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md font-medium"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Télécharger</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 1000px;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}