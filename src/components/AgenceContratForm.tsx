import { useState, useEffect } from 'react';
import { Plus, X, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import api, { Bien, Locataire, Contrat } from '../services/api';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'locataire' | 'proprietaire' | 'agence';
  agence_id?: number;
  agence_nom?: string;
  agence_code?: string;
}
interface AgenceContratFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editingContrat?: Contrat | null;
   user: User;
}

export default function AgenceContratForm({ onSuccess, onCancel, editingContrat, user }: AgenceContratFormProps) {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Mode : 'existing' (locataire existant) ou 'new' (nouveau locataire)
  const [locataireMode, setLocataireMode] = useState<'existing' | 'new'>('existing');
  
  const [formData, setFormData] = useState({
    // Bien
    bien_id: editingContrat?.bien_id || 0,
    // Locataire existant
    locataire_id: editingContrat?.locataire_id || 0,
    // Nouveau locataire
    locataire_nom: '',
    locataire_prenom: '',
    locataire_telephone: '',
    locataire_email: '',
    locataire_type: 'particulier' as 'particulier' | 'commerce',
    locataire_adresse: '',
    // Contrat
    date_debut: editingContrat?.date_debut?.split('T')[0] || '',
    date_fin: editingContrat?.date_fin?.split('T')[0] || '',
    montant_loyer: editingContrat?.montant_loyer || 0,
    montant_caution: editingContrat?.montant_caution || 0,
    jour_paiement: editingContrat?.jour_paiement || 1,
    charges_structurelles: editingContrat?.charges_structurelles || 0,
    charges_periode: editingContrat?.charges_periode || 0,
    montant_eau: editingContrat?.montant_eau || 0,
    montant_internet: editingContrat?.montant_internet || 0,
    tva: editingContrat?.tva || 0,
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    info: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // ✅ Utiliser user.agence_id pour filtrer les biens
      const [biensData, locatairesData] = await Promise.all([
        api.biens.getDisponibles(user.agence_id), // ✅ Filtre par agence
        api.locataires.getAll(),
      ]);
      
      console.log('✅ Biens disponibles (agence):', biensData.length);
      console.log('✅ Locataires validés:', locatairesData.length);
      
      setBiens(biensData);
      setLocataires(locatairesData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };


  // 🆕 Gérer la sélection d'un locataire existant
  const handleLocataireSelection = (locataireId: number) => {
    const selectedLocataire = locataires.find(l => l.id === locataireId);
    
    if (selectedLocataire) {
      console.log('📋 Locataire sélectionné:', selectedLocataire);
      
      // Mettre à jour le formData avec les infos du locataire
      setFormData({
        ...formData,
        locataire_id: selectedLocataire.id,
        locataire_type: (selectedLocataire.type || 'particulier') as 'particulier' | 'commerce',
      });
    } else {
      setFormData({
        ...formData,
        locataire_id: locataireId,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingContrat) {
        // Mode édition
        await api.agences.updateContrat(editingContrat.id!, {
          date_fin: formData.date_fin,
          montant_loyer: formData.montant_loyer,
          montant_caution: formData.montant_caution,
          jour_paiement: formData.jour_paiement,
          charges_structurelles: formData.charges_structurelles,
          charges_periode: formData.charges_periode,
          montant_eau: formData.montant_eau,
          montant_internet: formData.montant_internet,
          tva: formData.tva,
        });
        
        alert('✅ Contrat modifié avec succès !');
        onSuccess();
      } else {
        // Mode création
        const dataToSend: any = {
          bien_id: formData.bien_id,
          date_debut: formData.date_debut,
          date_fin: formData.date_fin,
          montant_loyer: formData.montant_loyer,
          montant_caution: formData.montant_caution,
          jour_paiement: formData.jour_paiement,
          charges_structurelles: formData.charges_structurelles,
          charges_periode: formData.charges_periode,
          montant_eau: formData.montant_eau,
          montant_internet: formData.montant_internet,
          tva: formData.tva,
        };

        if (locataireMode === 'existing') {
          // ✅ Locataire existant - juste envoyer l'ID
          dataToSend.locataire_id = formData.locataire_id;
          console.log('📤 Envoi avec locataire existant:', formData.locataire_id);
        } else {
          // ✅ Nouveau locataire - envoyer toutes les infos
          dataToSend.locataire_nom = formData.locataire_nom;
          dataToSend.locataire_prenom = formData.locataire_prenom;
          dataToSend.locataire_telephone = formData.locataire_telephone;
          dataToSend.locataire_email = formData.locataire_email;
          dataToSend.locataire_type = formData.locataire_type;
          dataToSend.locataire_adresse = formData.locataire_adresse;
          console.log('📤 Envoi avec nouveau locataire');
        }

        console.log('📦 Données envoyées:', dataToSend);

        const result = await api.agences.createContrat(dataToSend);
        
        console.log('✅ Résultat:', result);

        if (result.credentials) {
          // Nouveau locataire créé - afficher le modal avec les identifiants
          setCreatedCredentials(result.credentials);
          setShowSuccessModal(true);
        } else {
          // Locataire existant - juste un message de succès
          alert('✅ ' + result.message);
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✅ Copié !');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Modal de succès avec identifiants */}
      {showSuccessModal && createdCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Contrat créé avec succès !
              </h2>
              <p className="text-sm text-gray-600">
                {createdCredentials.info}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <label className="block text-xs font-semibold text-blue-800 mb-2">
                  📧 EMAIL DE CONNEXION
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdCredentials.email}
                    className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(createdCredentials.email)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium"
                  >
                    Copier
                  </button>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <label className="block text-xs font-semibold text-green-800 mb-2">
                  🔑 MOT DE PASSE
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdCredentials.password}
                    className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm font-mono font-bold"
                  />
                  <button
                    onClick={() => copyToClipboard(createdCredentials.password)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>IMPORTANT :</strong> Notez bien ces identifiants ou envoyez-les au locataire.
              </p>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                setCreatedCredentials(null);
                onSuccess();
              }}
              className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
            >
              J'ai noté les identifiants
            </button>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" />
            {editingContrat ? 'Modifier le contrat' : 'Nouveau contrat'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection du bien */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bien *</label>
            <select
              required
              disabled={!!editingContrat}
              value={formData.bien_id}
              onChange={(e) => setFormData({ ...formData, bien_id: Number(e.target.value) })}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 ${editingContrat ? 'bg-gray-100' : ''}`}
            >
              <option value={0}>Sélectionner un bien</option>
              {biens.map((bien) => (
                <option key={bien.id} value={bien.id}>
                  {bien.adresse} ({bien.type})
                </option>
              ))}
            </select>
          </div>

          {/* Sélection locataire */}
          {!editingContrat && (
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Locataire *
              </label>
              
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setLocataireMode('existing');
                    setFormData({ ...formData, locataire_id: 0 });
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    locataireMode === 'existing'
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <User className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Locataire existant</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setLocataireMode('new');
                    setFormData({ ...formData, locataire_id: 0 });
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    locataireMode === 'new'
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Plus className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Nouveau locataire</span>
                </button>
              </div>

              {locataireMode === 'existing' ? (
                <div>
                  <select
                    required
                    value={formData.locataire_id}
                    onChange={(e) => handleLocataireSelection(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={0}>Sélectionner un locataire</option>
                    {locataires.map((locataire) => (
                      <option key={locataire.id} value={locataire.id}>
                        {locataire.nom} {locataire.prenom} - {locataire.telephone} ({locataire.type || 'particulier'})
                      </option>
                    ))}
                  </select>
                  
                  {locataires.length === 0 && (
                    <p className="text-sm text-orange-600 mt-2">
                      ℹ️ Aucun locataire disponible. Créez-en un nouveau ou vérifiez que des locataires sont associés à votre agence.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4 bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.locataire_nom}
                        onChange={(e) => setFormData({ ...formData, locataire_nom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="Nom du locataire"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={formData.locataire_prenom}
                        onChange={(e) => setFormData({ ...formData, locataire_prenom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="Prénom"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.locataire_telephone}
                        onChange={(e) => setFormData({ ...formData, locataire_telephone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="77 123 4567"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Sera le mot de passe de connexion
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.locataire_email}
                        onChange={(e) => setFormData({ ...formData, locataire_email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de locataire
                      </label>
                      <select
                        value={formData.locataire_type}
                        onChange={(e) => setFormData({ ...formData, locataire_type: e.target.value as 'particulier' | 'commerce' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="particulier">Particulier</option>
                        <option value="commerce">Commerce</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse
                      </label>
                      <input
                        type="text"
                        value={formData.locataire_adresse}
                        onChange={(e) => setFormData({ ...formData, locataire_adresse: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="Adresse du locataire"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Informations du contrat */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations du contrat</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date début *
                </label>
                <input
                  type="date"
                  required
                  disabled={!!editingContrat}
                  value={formData.date_debut}
                  onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 ${editingContrat ? 'bg-gray-100' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date fin *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date_fin}
                  onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant loyer (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.montant_loyer}
                  onChange={(e) => setFormData({ ...formData, montant_loyer: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caution (FCFA)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.montant_caution}
                  onChange={(e) => setFormData({ ...formData, montant_caution: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jour de paiement *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={31}
                  value={formData.jour_paiement}
                  onChange={(e) => setFormData({ ...formData, jour_paiement: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Charges structurelles (FCFA)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.charges_structurelles}
                  onChange={(e) => setFormData({ ...formData, charges_structurelles: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Charges période (FCFA)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.charges_periode}
                  onChange={(e) => setFormData({ ...formData, charges_periode: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant eau (FCFA)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.montant_eau}
                  onChange={(e) => setFormData({ ...formData, montant_eau: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {formData.locataire_type === 'particulier' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant Internet (FCFA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.montant_internet}
                    onChange={(e) => setFormData({ ...formData, montant_internet: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {formData.locataire_type === 'commerce' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TVA (FCFA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.tva}
                    onChange={(e) => setFormData({ ...formData, tva: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 justify-end pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Création...
                </>
              ) : (
                <>
                  {editingContrat ? 'Modifier' : 'Créer le contrat'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}