import { useState, useEffect } from 'react';
import { Building2, Upload, X } from 'lucide-react';

interface Agence {
  id: number;
  nom: string;
  code: string;
}

interface Proprietaire {
  id: number;
  nom: string;
  prenom: string;
}

export default function BiensForm() {
  const [agences, setAgences] = useState<Agence[]>([]);
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>([]);
  const [formData, setFormData] = useState({
    proprietaire_id: '',
    agence_id: '',
    adresse: '',
    type: 'appartement',
    surface: '',
    nombre_pieces: '',
    description: ''
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    // Charger les agences actives
    fetch('/api/agences/actives')
      .then(res => res.json())
      .then(data => setAgences(data))
      .catch(err => console.error('Erreur chargement agences:', err));

    // Charger les propriétaires
    fetch('/api/proprietaires')
      .then(res => res.json())
      .then(data => setProprietaires(data))
      .catch(err => console.error('Erreur chargement propriétaires:', err));
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      alert('Maximum 5 photos autorisées');
      return;
    }

    setPhotos([...photos, ...files]);

    // Créer les previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = new FormData();
    submitData.append('proprietaire_id', formData.proprietaire_id);
    submitData.append('adresse', formData.adresse);
    submitData.append('type', formData.type);
    submitData.append('surface', formData.surface);
    submitData.append('nombre_pieces', formData.nombre_pieces);
    submitData.append('description', formData.description);

    // Ajouter l'agence si sélectionnée
    if (formData.agence_id) {
      submitData.append('agence_id', formData.agence_id);
    }

    // Ajouter les photos
    photos.forEach(photo => {
      submitData.append('photos', photo);
    });

    try {
      const response = await fetch('/api/biens', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création');
      }

      const data = await response.json();
      alert('Bien créé avec succès : ' + data.numero_bien);
      
      // Réinitialiser le formulaire
      setFormData({
        proprietaire_id: '',
        agence_id: '',
        adresse: '',
        type: 'appartement',
        surface: '',
        nombre_pieces: '',
        description: ''
      });
      setPhotos([]);
      setPreviews([]);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du bien');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Ajouter un bien</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection de l'agence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agence (optionnel)
            </label>
            <select
              value={formData.agence_id}
              onChange={(e) => setFormData({...formData, agence_id: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Aucune agence --</option>
              {agences.map(agence => (
                <option key={agence.id} value={agence.id}>
                  {agence.nom} ({agence.code})
                </option>
              ))}
            </select>
          </div>

          {/* Sélection du propriétaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Propriétaire *
            </label>
            <select
              required
              value={formData.proprietaire_id}
              onChange={(e) => setFormData({...formData, proprietaire_id: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Sélectionner un propriétaire --</option>
              {proprietaires.map(prop => (
                <option key={prop.id} value={prop.id}>
                  {prop.nom} {prop.prenom}
                </option>
              ))}
            </select>
          </div>

          {/* Type de bien */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de bien *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="chambre">Chambre</option>
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="studio">Studio</option>
              <option value="villa">Villa</option>
              <option value="bureau">Bureau</option>
              <option value="commerce">Commerce</option>
            </select>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse *
            </label>
            <textarea
              required
              value={formData.adresse}
              onChange={(e) => setFormData({...formData, adresse: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Surface et nombre de pièces */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Surface (m²) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.surface}
                onChange={(e) => setFormData({...formData, surface: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de pièces *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.nombre_pieces}
                onChange={(e) => setFormData({...formData, nombre_pieces: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Upload photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (max 5)
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer px-6 py-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Ajouter des photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-gray-500">
                {photos.length}/5 photos sélectionnées
              </span>
            </div>

            {/* Prévisualisation */}
            {previews.length > 0 && (
              <div className="grid grid-cols-5 gap-4 mt-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg"
            >
              Créer le bien
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  proprietaire_id: '',
                  agence_id: '',
                  adresse: '',
                  type: 'appartement',
                  surface: '',
                  nombre_pieces: '',
                  description: ''
                });
                setPhotos([]);
                setPreviews([]);
              }}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}