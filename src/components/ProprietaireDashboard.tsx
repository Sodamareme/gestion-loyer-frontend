import { useState, useEffect } from 'react';
import { 
  Home, Building2, Users, DollarSign, FileText, TrendingUp, 
  AlertCircle, Calendar, Download, RefreshCw, LogOut, Eye,
  CheckCircle, Clock, XCircle, Plus, Search, Filter
} from 'lucide-react';
import BiensProprio from './BiensProprio';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'locataire' | 'proprietaire' | 'agence';
  proprietaire_id?: number;
  proprietaire_nom?: string;
}

interface ProprietaireDashboardProps {
  user: User;
  onLogout: () => void;
}

interface Stats {
  totalBiens: number;
  biensLoues: number;
  biensDisponibles: number;
  totalContrats: number;
  contratsActifs: number;
  revenuMensuel: number;
  revenuAnnuel: number;
  tauxOccupation: number;
  paiementsEnAttente: number;
  derniersPaiements: any[];
  mesBiens: any[];
  mesContrats: any[];
}

export default function ProprietaireDashboard({ user, onLogout }: ProprietaireDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'biens' | 'contrats' | 'paiements'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');

  const API_BASE_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://localhost:3000/api';

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [biensRes, contratsRes, paiementsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/proprietaire/mes-biens`, { headers }),
        fetch(`${API_BASE_URL}/proprietaire/mes-contrats`, { headers }),
        fetch(`${API_BASE_URL}/proprietaire/mes-paiements`, { headers })
      ]);

      if (!biensRes.ok || !contratsRes.ok || !paiementsRes.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const biens = await biensRes.json();
      const contrats = await contratsRes.json();
      const paiements = await paiementsRes.json();

      const contratsActifs = contrats.filter((c: any) => c.statut === 'actif');

      const revenuMensuel = contratsActifs.reduce((sum: number, c: any) => {
        return sum + (Number(c.montant_loyer) || 0);
      }, 0);

      const now = new Date();
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
      const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const paiementsMoisActuel = paiements.filter((p: any) => {
        const date = new Date(p.date_paiement);
        return date >= debutMois && date <= finMois;
      });

      const contratIds = contratsActifs.map((c: any) => c.id);
      const paiementsRecus = paiementsMoisActuel.map((p: any) => p.contrat_id);
      const paiementsEnAttente = contratIds.filter((id: number) => !paiementsRecus.includes(id)).length;

      const derniersPaiements = paiements
        .sort((a: any, b: any) => new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime())
        .slice(0, 10);

      setStats({
        totalBiens: biens.length,
        biensLoues: biens.filter((b: any) => b.statut === 'loue').length,
        biensDisponibles: biens.filter((b: any) => b.statut === 'disponible').length,
        totalContrats: contrats.length,
        contratsActifs: contratsActifs.length,
        revenuMensuel,
        revenuAnnuel: revenuMensuel * 12,
        tauxOccupation: biens.length > 0 
          ? Math.round((biens.filter((b: any) => b.statut === 'loue').length / biens.length) * 100)
          : 0,
        paiementsEnAttente,
        derniersPaiements,
        mesBiens: biens,
        mesContrats: contratsActifs
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => {
    if (!stats) return null;

    return (
      <div className="space-y-6">
        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.totalBiens}</span>
            </div>
            <h3 className="text-sm font-medium opacity-90">Mes Biens</h3>
            <p className="text-xs opacity-75 mt-1">
              {stats.biensDisponibles} disponibles • {stats.biensLoues} loués
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.contratsActifs}</span>
            </div>
            <h3 className="text-sm font-medium opacity-90">Contrats Actifs</h3>
            <p className="text-xs opacity-75 mt-1">sur {stats.totalContrats} total</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 opacity-80" />
              <div className="text-right">
                <span className="text-2xl font-bold">
                  {(stats.revenuMensuel / 1000).toFixed(0)}K
                </span>
                <p className="text-xs opacity-75">FCFA</p>
              </div>
            </div>
            <h3 className="text-sm font-medium opacity-90">Revenu Mensuel</h3>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.tauxOccupation}%</span>
            </div>
            <h3 className="text-sm font-medium opacity-90">Taux d'Occupation</h3>
          </div>
        </div>

        {/* Revenu annuel et paiements en attente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Revenus Annuels Estimés</h3>
                <p className="text-xs text-gray-500">Basé sur les contrats actifs</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-green-600">
              {stats.revenuAnnuel.toLocaleString('fr-FR')} FCFA
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Revenu mensuel moyen</span>
                <span className="font-semibold text-gray-800">
                  {stats.revenuMensuel.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Paiements en Attente</h3>
                <p className="text-xs text-gray-500">Pour ce mois</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-orange-600">
              {stats.paiementsEnAttente}
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taux de collecte</span>
                <span className="font-semibold text-gray-800">
                  {stats.contratsActifs > 0 
                    ? Math.round(((stats.contratsActifs - stats.paiementsEnAttente) / stats.contratsActifs) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Derniers paiements */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Derniers Paiements</h3>
            </div>
            <button
              onClick={() => setActiveTab('paiements')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir tout →
            </button>
          </div>
          <div className="space-y-3">
            {stats.derniersPaiements.length > 0 ? (
              stats.derniersPaiements.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{p.locataire_nom}</p>
                      <p className="text-sm text-gray-500">{p.bien_adresse}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(p.date_paiement).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {Number(p.montant_paye).toLocaleString('fr-FR')} FCFA
                    </p>
                    <p className="text-xs text-gray-500">{p.mode_paiement}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun paiement enregistré</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContrats = () => {
    if (!stats) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Locataire</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Bien</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Loyer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date début</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date fin</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.mesContrats.map((contrat: any) => (
                  <tr key={contrat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{contrat.locataire_nom}</p>
                        <p className="text-sm text-gray-500">{contrat.locataire_tel}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{contrat.bien_adresse}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-blue-600">
                        {Number(contrat.montant_loyer).toLocaleString('fr-FR')} FCFA
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(contrat.date_debut).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(contrat.date_fin).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Actif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {stats.mesContrats.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun contrat actif</p>
          </div>
        )}
      </div>
    );
  };

  const renderPaiements = () => {
    if (!stats) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Locataire</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Bien</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Montant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Mode</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Mois</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.derniersPaiements.map((paiement: any) => (
                  <tr key={paiement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{paiement.locataire_nom}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{paiement.bien_adresse}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-green-600">
                        {Number(paiement.montant_paye).toLocaleString('fr-FR')} FCFA
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{paiement.mode_paiement}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(paiement.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {stats.derniersPaiements.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun paiement enregistré</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur-xl shadow-xl border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-2xl shadow-xl">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Espace Propriétaire
                </h1>
                <p className="text-sm text-gray-600">Bienvenue, {user.proprietaire_nom}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={loadStats}
                className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex gap-2 pb-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="w-4 h-4" />
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveTab('biens')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'biens'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Mes Biens
            </button>
            <button
              onClick={() => setActiveTab('contrats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'contrats'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Contrats
            </button>
            <button
              onClick={() => setActiveTab('paiements')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'paiements'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Paiements
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'biens' && <BiensProprio />}
        {activeTab === 'contrats' && renderContrats()}
        {activeTab === 'paiements' && renderPaiements()}
      </main>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-xl border-t border-slate-200/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <p className="text-slate-600 text-sm font-medium">
                VOSCLES - Espace Propriétaire
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-blue-100 rounded-full text-xs font-bold text-blue-700">
                ✓ Connecté en tant que Propriétaire
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}