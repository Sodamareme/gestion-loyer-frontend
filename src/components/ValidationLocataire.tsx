import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, FileText } from 'lucide-react';

interface Locataire {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  numero_cni: string;
  date_naissance: string;
  lieu_naissance: string;
  carte_identite: string;
  type: 'particulier' | 'entreprise';
  statut_validation: 'en_attente' | 'valide' | 'rejete';
  date_inscription: string;
  date_validation?: string;
  motif_rejet?: string;
}

interface ValidationLocataireProps {
  onValidationChange?: () => void;
}

export default function ValidationLocataire({ onValidationChange }: ValidationLocataireProps) {
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocataire, setSelectedLocataire] = useState<Locataire | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [motifRejet, setMotifRejet] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchLocataires();
  }, []);

  const fetchLocataires = async () => {
    try {
      const { validationLocataireApi } = await import('../services/api');
      const data = await validationLocataireApi.getAllLocataires();
      setLocataires(data);
      
      if (onValidationChange) {
        onValidationChange();
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (id: number) => {
    if (!confirm('Voulez-vous vraiment valider ce locataire ?')) return;
    
    setActionLoading(true);
    try {
      const { validationLocataireApi } = await import('../services/api');
      const result = await validationLocataireApi.validerLocataire(id);
      
      alert(result.message || 'Locataire validé avec succès ! Un email a été envoyé avec les identifiants.');
      fetchLocataires();
      setShowModal(false);
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(`Erreur : ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejeter = async (id: number) => {
    if (!motifRejet.trim()) {
      alert('Veuillez saisir un motif de rejet');
      return;
    }

    setActionLoading(true);
    try {
      const { validationLocataireApi } = await import('../services/api');
      const result = await validationLocataireApi.rejeterLocataire(id, motifRejet);
      
      alert(result.message || 'Locataire rejeté avec succès');
      fetchLocataires();
      setShowModal(false);
      setMotifRejet('');
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(`Erreur : ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const configs = {
      en_attente: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'En attente' },
      valide: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Validé' },
      rejete: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Rejeté' }
    };
    
    const config = configs[statut as keyof typeof configs];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Validation des Locataires</h1>
        <p className="text-gray-600 mt-1">Gérez les demandes d'inscription des locataires</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">En attente</p>
              <p className="text-2xl font-bold text-yellow-900">
                {locataires.filter(l => l.statut_validation === 'en_attente').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Validés</p>
              <p className="text-2xl font-bold text-green-900">
                {locataires.filter(l => l.statut_validation === 'valide').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Rejetés</p>
              <p className="text-2xl font-bold text-red-900">
                {locataires.filter(l => l.statut_validation === 'rejete').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Liste des locataires */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date inscription</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locataires.map((loc) => (
              <tr key={loc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{loc.prenom} {loc.nom}</div>
                  <div className="text-sm text-gray-500">CNI: {loc.numero_cni}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loc.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loc.telephone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    loc.type === 'entreprise' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {loc.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(loc.date_inscription).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatutBadge(loc.statut_validation)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => {
                      setSelectedLocataire(loc);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de détails */}
      {showModal && selectedLocataire && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Détails du Locataire</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setMotifRejet('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Prénom</label>
                    <p className="text-gray-900">{selectedLocataire.prenom}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nom</label>
                    <p className="text-gray-900">{selectedLocataire.nom}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedLocataire.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Téléphone</label>
                    <p className="text-gray-900">{selectedLocataire.telephone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="text-gray-900">{selectedLocataire.type === 'entreprise' ? 'Entreprise' : 'Particulier'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date de naissance</label>
                    <p className="text-gray-900">
                      {new Date(selectedLocataire.date_naissance).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Lieu de naissance</label>
                    <p className="text-gray-900">{selectedLocataire.lieu_naissance}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Numéro CNI</label>
                    <p className="text-gray-900">{selectedLocataire.numero_cni}</p>
                  </div>
                </div>

                {/* Carte d'identité */}
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Carte d'identité</label>
                  <a
                    href={`/uploads/cni/${selectedLocataire.carte_identite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Voir la carte d'identité
                  </a>
                </div>

                {/* Statut actuel */}
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Statut</label>
                  {getStatutBadge(selectedLocataire.statut_validation)}
                </div>

                {/* Actions de validation */}
                {selectedLocataire.statut_validation === 'en_attente' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleValider(selectedLocataire.id)}
                        disabled={actionLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Valider et envoyer les identifiants
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motif du rejet (si applicable)
                      </label>
                      <textarea
                        value={motifRejet}
                        onChange={(e) => setMotifRejet(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        rows={3}
                        placeholder="Expliquez pourquoi la demande est rejetée..."
                      />
                      <button
                        onClick={() => handleRejeter(selectedLocataire.id)}
                        disabled={actionLoading || !motifRejet.trim()}
                        className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" />
                        Rejeter la demande
                      </button>
                    </div>
                  </div>
                )}

                {selectedLocataire.motif_rejet && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-800 mb-1">Motif du rejet :</p>
                    <p className="text-sm text-red-700">{selectedLocataire.motif_rejet}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}