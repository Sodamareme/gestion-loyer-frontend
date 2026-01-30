const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3000/api';
  import axios from 'axios';
  
export interface User {
  id: number;
  email: string;
  role: 'admin' | 'locataire' | 'proprietaire' | 'agence';
  locataire_id?: number;
  locataire_nom?: string;
  locataire_tel?: string;
     proprietaire_id?: number; // 🆕 Pour les propriétaires
  proprietaire_nom?: string; // 🆕 Pour les propriétaires
    agence_id?: number;
  agence_nom?: string;
  agence_code?: string;
  agence_active?: boolean;

}
export interface CreateLocataireResponse {
  id: number;
  message: string;
  credentials?: {
    email: string;
    password: string;
    info: string;
  };
}

export interface ResetPasswordResponse {
  message: string;
  newPassword: string;
  info: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface QuittanceResponse {
  message: string;
  url: string;
  numeroQuittance: string;
}
export interface Proprietaire {
  id: number;
  nom: string;
  telephone: string;
  email?: string;
  prenom?: string;
    date_naissance?: string; // 🆕
  lieu_naissance?: string; // 🆕
  numero_cni?: string; // 🆕
  carte_identite?: string; // 🆕
  adresse?: string;
  created_at?: string;
}

export interface Locataire {
  id: number;
  nom: string;
    prenom?: string; // 🆕
    date_naissance?: string; // 🆕
  lieu_naissance?: string; // 🆕
  numero_cni?: string; // 🆕
  carte_identite?: string; // 🆕
   telephone: string;
  email?: string;
   type?: string;
  created_at?: string;
}

export interface Bien {
  id: number;
  numero_bien: string;
  proprietaire_id: number;
  adresse: string;
   type: 'chambre' | 'appartement' | 'maison' | 'studio' | 'villa' | 'bureau' | 'commerce';
  surface: number;
  nombre_pieces: number;
  description?: string;
  statut: string;
  proprietaire_nom?: string;
  proprietaire_telephone?: string;
   agence_nom?: string;
  agence_code?: string;
  created_at?: string;
  
}

export interface Contrat {
  id: number;
  contrat_id?: number;
  bien_id: number;
  locataire_id: number;
  date_debut: string;
  date_fin: string;
  montant_loyer: number;
  montant_caution: number;
  jour_paiement: number;
  charges: number;

    charges_structurelles?: number;
    charges_periode?: number;
  montant_eau?: number;
  montant_internet?: number;
  tva?: number;
  montant_regulariser?: number;
  ancien_index_eau?: number;
  nouvel_index_eau?: number;
  date_releve_eau?: string;
  archive?: boolean | number;
  date_archive?: string;
  // Statuts
  statut?: string;
  contrat_statut?: string; // Aussi pour la vue

  // Informations relationnelles
  locataire_nom?: string;
  locataire_tel?: string;
  bien_adresse?: string;
  proprietaire_nom?: string;
  created_at?: string;
}

export interface Paiement {
  id: number;
  contrat_id: number;
  date_paiement: string;
  montant_paye: number;
  mode_paiement: string;
  reference?: string;
  mois_concerne: string;
  locataire_nom?: string;
  bien_adresse?: string;
  montant_loyer?: number;
  created_at?: string;
}
export interface EcheanceNotification {
  id: string;
  type: 'warning' | 'danger' | 'info';
  message: string;
  montant: number;
  joursRetard: number;
  moisConcerne: string;
  source?: 'automatique' | 'admin';
   contrat_id: number;
  rappelId?: number;
}
export interface Demande {
  id: number;
  locataire_id: number;
  bien_id: number;
  agence_id?: number;
  type: 'reparation' | 'entretien' | 'incident' | 'information' | 'plainte' | 'autre';
  sujet: string;
  description: string;
  urgence: 'basse' | 'normale' | 'haute' | 'urgente';
  statut: 'en_attente' | 'vue' | 'en_cours' | 'resolue' | 'rejetee';
  note_agence?: string;
  date_creation: string;
  date_traitement?: string;
  // Infos relationnelles
  bien_adresse?: string;
  numero_bien?: string;
  agence_nom?: string;
  agence_telephone?: string;
  agence_email?: string;
  locataire_nom?: string;
  locataire_prenom?: string;
  locataire_telephone?: string;
  locataire_email?: string;
  source_demande?: 'normale' | 'publique';
}

export interface CreateDemandeData {
  bien_id: number;
  type: 'reparation' | 'entretien' | 'incident' | 'information' | 'plainte' | 'autre';
  sujet: string;
  description: string;
  urgence: 'basse' | 'normale' | 'haute' | 'urgente';
}


export interface CreateDemandeResponse {
  id: number;
  message: string;
  agence_nom: string;
  agence_telephone?: string;
  agence_email?: string;
}

export interface UpdateDemandeStatutData {
  statut: 'en_attente' | 'vue' | 'en_cours' | 'resolue' | 'rejetee';
  note_agence?: string;
  source_demande?: 'normale' | 'publique';
}
export interface InscriptionResponse {
  message: string;
  info?: string;
}
export interface DocumentLocataire  {
  id: number;
  type: string; // 'quittance', 'avis_echeance', 'quittance_caution', 'contrat'
  nom_fichier: string;
  url: string;
  contrat_id: number;
  paiement_id?: number;
  mois_concerne?: string;
  montant?: number;
  date_creation: string;
  bien_adresse?: string;
  numero_bien?: string;
}

export interface StatsDocument {
  type: string;
  nombre: number;
  montant_total: number;
}
// Gestion du token
export const auth = {
  setToken: (token: string) => {
    localStorage.setItem('token', token);
  },
  
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
  
  removeToken: () => {
    localStorage.removeItem('token');
  },
  
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur de connexion');
    }
    
    const data = await res.json();
    auth.setToken(data.token);
    return data;
  },
  
  logout: () => {
    auth.removeToken();
    window.location.href = '/login';
  },
  
  getCurrentUser: async () => {
    const token = auth.getToken();
    if (!token) return null;
    
    const res = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      auth.removeToken();
      return null;
    }
    
    return res.json();
  }
};
export const validationProprietaireApi = {
  // Récupérer tous les propriétaires (incluant ceux en attente)
  getAllProprietaires: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/proprietaires`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des propriétaires');
    }

    return response.json();
  },

  // Valider un propriétaire
  validerProprietaire: async (id: number) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/proprietaires/${id}/valider`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la validation');
    }

    return response.json();
  },

  // Rejeter un propriétaire
  rejeterProprietaire: async (id: number, motif: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/proprietaires/${id}/rejeter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ motif })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors du rejet');
    }

    return response.json();
  },

  // Obtenir le nombre de propriétaires en attente (pour le badge)
  getProprietairesEnAttente: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/proprietaires`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return 0;
    }

    const proprietaires = await response.json();
    return proprietaires.filter((p: any) => p.statut_validation === 'en_attente').length;
  }
};
export const validationLocataireApi = {
  getAllLocataires: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL  }/locataires`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des locataires');
    }

    return response.json();
  },

  validerLocataire: async (id: number) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL  }/locataires/${id}/valider`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la validation');
    }

    return response.json();
  },

  rejeterLocataire: async (id: number, motif: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL  }/locataires/${id}/rejeter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ motif })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors du rejet');
    }

    return response.json();
  },

  getLocatairesEnAttente: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL  }/locataires`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return 0;
    }

    const locataires = await response.json();
    return locataires.filter((l: any) => l.statut_validation === 'en_attente').length;
  }
};
export const inscriptionApi = {
  // Inscription locataire
  inscrireLocataire: async (formData: FormData): Promise<InscriptionResponse> => {
    const res = await fetch(`${API_BASE_URL}/inscription-locataire/inscription`, {
      method: 'POST',
      body: formData, // FormData avec tous les champs + fichier
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur lors de l\'inscription');
    }
    
    return res.json();
  },

  // Inscription propriétaire
  inscrireProprietaire: async (formData: FormData): Promise<InscriptionResponse> => {
    const res = await fetch(`${API_BASE_URL}/inscription-proprietaire/inscription`, {
      method: 'POST',
      body: formData, // FormData avec tous les champs + fichier
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur lors de l\'inscription');
    }
    
    return res.json();
  }
};

// Helper pour les requêtes authentifiées
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = auth.getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    auth.logout();
    throw new Error('Session expirée');
  }
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Erreur');
  }
  
  return res.json();
};

// API Locataire
// Ajoutez cette interface dans api.ts


export const locataireApi = {
  
    getMesContrats: (): Promise<Contrat[]> => {
    return authFetch(`${API_BASE_URL}/locataire/mes-contrats`);
  },
  getMonContrat: (): Promise<Contrat> => {
    return authFetch(`${API_BASE_URL}/locataire/mon-contrat`);
  },
  
  getMesPaiements: (): Promise<Paiement[]> => {
    return authFetch(`${API_BASE_URL}/locataire/mes-paiements`);
  },
  
  getMesEcheances: (): Promise<EcheanceNotification[]> => { // TYPE CORRIGÉ
    return authFetch(`${API_BASE_URL}/locataire/mes-echeances`);
  },
  
  marquerRappelLu: (rappelId: number): Promise<{ success: boolean }> => {
    return authFetch(`${API_BASE_URL}/locataire/marquer-rappel-lu/${rappelId}`, {
      method: 'POST',
    });
  },
  
  soumettrePaiement: async (formData: FormData): Promise<{ id: number; message: string; photo_eau?: string; photo_paiement?: string }> => {
    const token = auth.getToken();
    const res = await fetch(`${API_BASE_URL}/locataire/soumettre-paiement`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    
    if (res.status === 401) {
      auth.logout();
      throw new Error('Session expirée');
    }
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur lors de la soumission');
    }
    
    return res.json();
  },
  
  genererQuittance: async (paiementId: number): Promise<QuittanceResponse> => {
    const token = auth.getToken();
    const res = await fetch(`${API_BASE_URL}/locataire/generer-quittance/${paiementId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (res.status === 401) {
      auth.logout();
      throw new Error('Session expirée');
    }
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur génération quittance');
    }
    
    return res.json();
  },
   getMesDemandes: (): Promise<Demande[]> => {
    return authFetch(`${API_BASE_URL}/demandes/mes-demandes`);
  },

  createDemande: (data: CreateDemandeData): Promise<CreateDemandeResponse> => {
    return authFetch(`${API_BASE_URL}/demandes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  

  getDemandeDetails: (id: number): Promise<Demande> => {
    return authFetch(`${API_BASE_URL}/demandes/${id}`);
  },
   getMesDocuments: (): Promise<DocumentLocataire []> => {
    return authFetch(`${API_BASE_URL}/locataires/mes-documents`);
  },


   getStatsDocuments: (): Promise<StatsDocument[]> => {
    return authFetch(`${API_BASE_URL}/locataires/mes-documents/stats`);
  },
};

// Dans votre fichier api.ts, remplacez la section agences par ceci :


const api = {
  // PROPRIÉTAIRES
  proprietaires: {
    getAll: (): Promise<Proprietaire[]> => {
      return authFetch(`${API_BASE_URL}/proprietaires`);
    },
    
    create: (data: Omit<Proprietaire, 'id' | 'created_at'>): Promise<{ id: number; message: string }> => {
      return authFetch(`${API_BASE_URL}/proprietaires`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    update: (id: number, data: Omit<Proprietaire, 'id' | 'created_at'>): Promise<{ message: string }> => {
      return authFetch(`${API_BASE_URL}/proprietaires/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },

  // LOCATAIRES (AVEC AUTHENTIFICATION)
  locataires: {
    getAll: (): Promise<Locataire[]> => {
      return authFetch(`${API_BASE_URL}/locataires`);
    },
    
    create: (data: Omit<Locataire, 'id' | 'created_at'>): Promise<CreateLocataireResponse> => {
      return authFetch(`${API_BASE_URL}/locataires`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    update: (id: number, data: Omit<Locataire, 'id' | 'created_at'>): Promise<{ message: string }> => {
      return authFetch(`${API_BASE_URL}/locataires/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    resetPassword: (id: number): Promise<ResetPasswordResponse> => {
      return authFetch(`${API_BASE_URL}/locataires/${id}/reset-password`, {
        method: 'POST',
      });
    },
  },

  // BIENS (AVEC AUTHENTIFICATION)
  biens: {
   getAll: (agence_id?: number): Promise<Bien[]> => {
    // ✅ Si agence_id fourni (admin), l'utiliser en query param
    // ✅ Si pas fourni (agence), le backend détecte automatiquement
    const url = agence_id 
      ? `${API_BASE_URL}/biens?agence_id=${agence_id}`
      : `${API_BASE_URL}/biens`;
    return authFetch(url);
  },
  
  getDisponibles: (agence_id?: number): Promise<Bien[]> => {
    // ✅ Si agence_id fourni (admin), l'utiliser en query param
    // ✅ Si pas fourni (agence), le backend détecte automatiquement
    const url = agence_id 
      ? `${API_BASE_URL}/biens/disponibles?agence_id=${agence_id}`
      : `${API_BASE_URL}/biens/disponibles`;
    return authFetch(url);
  },
  
  create: (formData: FormData): Promise<{ id: number; numero_bien: string; photos: string[]; message: string }> => {
    return authFetch(`${API_BASE_URL}/biens`, {
      method: 'POST',
      body: formData,
      // Ne pas définir Content-Type, laissez le navigateur le faire pour multipart/form-data
      headers: undefined,
    });
  },
  
  update: (id: number, formData: FormData): Promise<{ message: string; photos: string[] }> => {
    return authFetch(`${API_BASE_URL}/biens/${id}`, {
      method: 'PUT',
      body: formData,
      headers: undefined,
    });
  },
  
  delete: (id: number): Promise<{ message: string }> => {
    return authFetch(`${API_BASE_URL}/biens/${id}`, {
      method: 'DELETE',
    });
  },

  deletePhoto: (id: number, photoPath: string): Promise<{ message: string; photos: string[] }> => {
    return authFetch(`${API_BASE_URL}/biens/${id}/photo`, {
      method: 'DELETE',
      body: JSON.stringify({ photoPath }),
    });
  },

  getStatsByAgence: (agence_id: number): Promise<{
    total_biens: number;
    biens_disponibles: number;
    biens_loues: number;
    biens_maintenance: number;
    surface_totale: number;
    surface_moyenne: number;
  }> => {
    return authFetch(`${API_BASE_URL}/biens/stats/agence/${agence_id}`);
  },
},

  // CONTRATS (AVEC AUTHENTIFICATION)
  contrats: {
    getAll: (includeArchives = false): Promise<Contrat[]> => {
    const url = includeArchives 
      ? `${API_BASE_URL}/contrats?archives=true`
      : `${API_BASE_URL}/contrats`;
    return authFetch(url);
  },
   getArchives: (): Promise<Contrat[]> => {
    return authFetch(`${API_BASE_URL}/contrats/archives`);
  },
  
    
    getActifs: (): Promise<Contrat[]> => {
      return authFetch(`${API_BASE_URL}/contrats/actifs`);
    },
    
    create: (data: Omit<Contrat, 'id' | 'statut' | 'created_at' | 'locataire_nom' | 'bien_adresse' | 'proprietaire_nom'>): Promise<{ id: number; message: string }> => {
      return authFetch(`${API_BASE_URL}/contrats`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    update: (id: number, data: Partial<Contrat>): Promise<{ message: string }> => {
      return authFetch(`${API_BASE_URL}/contrats/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
      archiver: (id: number): Promise<{ message: string }> => {
    return authFetch(`${API_BASE_URL}/contrats/${id}/archiver`, {
      method: 'POST',
    });
  },
  
  desarchiver: (id: number): Promise<{ message: string }> => {
    return authFetch(`${API_BASE_URL}/contrats/${id}/desarchiver`, {
      method: 'POST',
    });
  },
   genererContrat: async (contratId: number): Promise<{ message: string; url: string; numeroContrat: string }> => {
    const token = auth.getToken();
    const res = await fetch(`${API_BASE_URL}/pdf/contrat/${contratId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (res.status === 401) {
      auth.logout();
      throw new Error('Session expirée');
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur génération contrat');
    }

    return res.json();
  },
    genererPdf: (id: number): Promise<{ 
    message: string; 
    url: string; 
    numeroContrat: string; 
  }> => {
    return authFetch(`${API_BASE_URL}/contrats/${id}/generer-pdf`, {
      method: 'POST',
    });
  },
  },

  // PAIEMENTS (AVEC AUTHENTIFICATION)
  paiements: {
    getAll: (): Promise<Paiement[]> => {
      return authFetch(`${API_BASE_URL}/paiements`);
    },
    
    create: (data: any): Promise<{ id: number; message: string }> => {
      return authFetch(`${API_BASE_URL}/paiements`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    update: (id: number, data: any): Promise<{ message: string }> => {
      return authFetch(`${API_BASE_URL}/paiements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    downloadHistoriquePDF: () => {
      const token = auth.getToken();
      const url = new URL(`${API_BASE_URL}/paiements/historique/pdf`);
      if (token) {
        // Ouvrir avec le token dans l'URL ou utiliser une autre méthode
        window.open(url.toString(), '_blank');
      } else {
        alert('Veuillez vous connecter pour télécharger l\'historique');
      }
    },
  },
  pdf: {
    generateQuittance: (paiementId: number): Promise<QuittanceResponse> => {
      return authFetch(`${API_BASE_URL}/pdf/quittance/${paiementId}`, {
        method: 'POST',
      });
    },
    
    generateAvisEcheance: (contratId: number, moisConcerne: string): Promise<QuittanceResponse> => {
      return authFetch(`${API_BASE_URL}/pdf/avis-echeance/${contratId}`, {
        method: 'POST',
        body: JSON.stringify({ mois_concerne: moisConcerne }),
      });
    },
    
    generateQuittanceCaution: (contratId: number, montantCaution: number): Promise<QuittanceResponse> => {
      return authFetch(`${API_BASE_URL}/pdf/quittance-caution/${contratId}`, {
        method: 'POST',
        body: JSON.stringify({ montant_caution: montantCaution }),
      });
    },
  },
agences: {
    getAll: async () => {
      const token = auth.getToken();
      const response = await axios.get(`${API_BASE_URL}/agences`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },

    getActives: async () => {
      const token = auth.getToken();
      const response = await axios.get(`${API_BASE_URL}/agences/actives`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Gère les deux formats de retour
      const data = response.data;
      return Array.isArray(data) ? data : (data.agences || []);
    },

    getById: async (id: number) => {
      const token = auth.getToken();
      const response = await axios.get(`${API_BASE_URL}/agences/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },

    getStatistiques: async (id: number) => {
      const token = auth.getToken();
      const response = await axios.get(`${API_BASE_URL}/agences/${id}/statistiques`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },

    create: async (formData: FormData) => {
      const token = auth.getToken();
      const response = await axios.post(`${API_BASE_URL}/agences`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      return response.data;
    },

    update: async (id: number, formData: FormData) => {
      const token = auth.getToken();
      const response = await axios.put(`${API_BASE_URL}/agences/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      return response.data;
    },

    delete: async (id: number) => {
      const token = auth.getToken();
      const response = await axios.delete(`${API_BASE_URL}/agences/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },

    // 🆕 Récupérer les locataires de l'agence (CORRIGÉ)
    getLocataires: (): Promise<Locataire[]> => {
      return authFetch(`${API_BASE_URL}/agences/locataires`); // ✅ Route corrigée
    },
    
    // 🆕 Contrats de l'agence
    getContrats: (includeArchives = false): Promise<Contrat[]> => {
      const url = includeArchives 
        ? `${API_BASE_URL}/agences/contrats?archives=true`
        : `${API_BASE_URL}/agences/contrats`;
      return authFetch(url);
    },
    
    // 🆕 Créer un contrat (avec ou sans nouveau locataire)
    createContrat: (data: {
      // Bien
      bien_id: number;
      // Locataire existant OU nouveau locataire
      locataire_id?: number;
      locataire_nom?: string;
      locataire_prenom?: string;
      locataire_telephone?: string;
      locataire_email?: string;
      locataire_type?: 'particulier' | 'commerce';
      locataire_adresse?: string;
      // Contrat
      date_debut: string;
      date_fin: string;
      montant_loyer: number;
      montant_caution?: number;
      jour_paiement: number;
      charges_structurelles?: number;
      charges_periode?: number;
      montant_eau?: number;
      montant_internet?: number;
      tva?: number;
    }): Promise<{ 
      id: number; 
      locataire_id: number;
      message: string;
      nouveau_locataire?: boolean;
      credentials?: {
        email: string;
        password: string;
        info: string;
      };
    }> => {
      return authFetch(`${API_BASE_URL}/agences/contrats`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    // 🆕 Modifier un contrat
    updateContrat: (id: number, data: Partial<Contrat>): Promise<{ message: string }> => {
      return authFetch(`${API_BASE_URL}/agences/contrats/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    // 🆕 Archiver un contrat
    archiverContrat: (id: number): Promise<{ message: string }> => {
      return authFetch(`${API_BASE_URL}/agences/contrats/${id}/archiver`, {
        method: 'POST',
      });
    },
    
    // 🆕 Désarchiver un contrat
    desarchiverContrat: (id: number): Promise<{ message: string }> => {
      return authFetch(`${API_BASE_URL}/agences/contrats/${id}/desarchiver`, {
        method: 'POST',
      });
    },
    
    // Paiements
    getPaiements: (): Promise<Paiement[]> => {
      return authFetch(`${API_BASE_URL}/agences/paiements`);
    },
    
    createPaiement: (data: any): Promise<{ id: number; message: string }> => {
      return authFetch(`${API_BASE_URL}/agences/paiements`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    downloadContratPDF: (id: number): void => {
  const token = auth.getToken();
  const url = `${API_BASE_URL}/agences/contrats/${id}/pdf`;
  window.open(`${url}?token=${token}`, '_blank');
},
  },
  
   agenceProprietaires: {
    // Récupérer tous les propriétaires de l'agence
    getAll: (): Promise<Proprietaire[]> => {
      return authFetch(`${API_BASE_URL}/agences/proprietaires`);
    },
    
    // Créer un nouveau propriétaire
    create: (data: Omit<Proprietaire, 'id' | 'created_at'>): Promise<{ 
      id: number; 
      message: string; 
      info: string 
    }> => {
      return authFetch(`${API_BASE_URL}/agences/proprietaires`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    // Modifier un propriétaire
    update: (id: number, data: Omit<Proprietaire, 'id' | 'created_at'>): Promise<{ 
      message: string 
    }> => {
      return authFetch(`${API_BASE_URL}/agences/proprietaires/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    // Récupérer un propriétaire spécifique
    getById: (id: number): Promise<Proprietaire> => {
      return authFetch(`${API_BASE_URL}/agences/proprietaires/${id}`);
    },
  },
  demandes: {
    getAll: (): Promise<Demande[]> => {
      return authFetch(`${API_BASE_URL}/demandes`);
    },

    getDetails: (id: number): Promise<Demande> => {
      return authFetch(`${API_BASE_URL}/demandes/${id}`);
    },

    updateStatut: (id: number, data: UpdateDemandeStatutData): Promise<{ message: string }> => {
      return authFetch(`${API_BASE_URL}/demandes/${id}/statut`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    getStats: (): Promise<{
      total: number;
      en_attente: number;
      vue: number;
      en_cours: number;
      resolue: number;
      rejetee: number;
      urgentes: number;
      haute_priorite: number;
    }> => {
      return authFetch(`${API_BASE_URL}/demandes/stats/agence`);
    },
  },
};



export default api;
