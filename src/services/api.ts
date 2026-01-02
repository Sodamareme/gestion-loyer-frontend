const API_BASE_URL = 'http://localhost:3000/api';
export interface User {
  id: number;
  email: string;
  role: 'admin' | 'locataire';
  locataire_id?: number;
  locataire_nom?: string;
  locataire_tel?: string;
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
  adresse?: string;
  created_at?: string;
}

export interface Locataire {
  id: number;
  nom: string;
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
};
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
    getAll: (): Promise<Bien[]> => {
      return authFetch(`${API_BASE_URL}/biens`);
    },
    
    getDisponibles: (): Promise<Bien[]> => {
      return authFetch(`${API_BASE_URL}/biens/disponibles`);
    },
    
    create: (data: Omit<Bien, 'id' | 'numero_bien' | 'statut' | 'created_at' | 'proprietaire_nom' | 'proprietaire_telephone'>): Promise<{ id: number; numero_bien: string; message: string }> => {
      return authFetch(`${API_BASE_URL}/biens`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    update: (id: number, data: Partial<Bien>): Promise<{ message: string }> => {
      return authFetch(`${API_BASE_URL}/biens/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    delete: (id: number): Promise<{ message: string }> => {
      return authFetch(`${API_BASE_URL}/biens/${id}`, {
        method: 'DELETE',
      });
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
};



export default api;
