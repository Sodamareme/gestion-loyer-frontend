import { useState, useEffect } from 'react';
import { Home, Users, Building2, FileText, DollarSign, TrendingUp, ArrowUpRight, Calendar, Search, Filter, ChevronDown, X, Clock, CheckCircle, TrendingDown } from 'lucide-react';
import api, { Bien, Paiement } from '../services/api';

type PeriodFilter = 'month' | '3months' | '6months' | 'year' | 'all';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBiens: 0,
    biensLoues: 0,
    biensDisponibles: 0,
    contratsActifs: 0,
    totalPaiementsMois: 0,
    derniersPaiements: [] as Paiement[],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [allPaiements, setAllPaiements] = useState<Paiement[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [biens, contratsActifs, paiements] = await Promise.all([
        api.biens.getAll(),
        api.contrats.getActifs(),
        api.paiements.getAll(),
      ]);

      const biensLoues = biens.filter((b: Bien) => b.statut === 'loue').length;
      const biensDisponibles = biens.filter((b: Bien) => b.statut === 'disponible').length;

      const currentMonth = new Date().toISOString().slice(0, 7);
      const paiementsMois = paiements.filter((p: Paiement) => p.mois_concerne?.startsWith(currentMonth));
      const totalPaiementsMois = paiementsMois.reduce((sum: number, p: Paiement) => sum + Number(p.montant_paye), 0);

      setAllPaiements(paiements);
      setStats({
        totalBiens: biens.length,
        biensLoues,
        biensDisponibles,
        contratsActifs: contratsActifs.length,
        totalPaiementsMois,
        derniersPaiements: paiements.slice(0, 5),
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPaiements = () => {
    let filtered = showAllPayments ? allPaiements : stats.derniersPaiements;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.locataire_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.bien_adresse?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (periodFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (periodFilter) {
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          filterDate.setMonth(now.getMonth() - 6);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter((p) => new Date(p.date_paiement) >= filterDate);
    }

    return filtered;
  };

  const filteredPaiements = getFilteredPaiements();

  const getTotalFiltered = () => {
    return filteredPaiements.reduce((sum, p) => sum + Number(p.montant_paye), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
          <div className="w-16 h-16 border-t-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                  Tableau de bord
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Vue d'ensemble de votre gestion immobilière</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <Calendar className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {new Date().toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Building2 className="w-6 h-6" />}
            title="Total Biens"
            value={stats.totalBiens}
            iconBg="bg-blue-600"
            trend="+12%"
            trendUp={true}
          />
          <StatCard
            icon={<FileText className="w-6 h-6" />}
            title="Contrats Actifs"
            value={stats.contratsActifs}
            iconBg="bg-emerald-600"
            trend="+8%"
            trendUp={true}
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            title="Biens Loués"
            value={stats.biensLoues}
            iconBg="bg-amber-600"
            trend="+5%"
            trendUp={true}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Biens Disponibles"
            value={stats.biensDisponibles}
            iconBg="bg-slate-600"
            trend="-3%"
            trendUp={false}
          />
        </div>

        {/* Revenus du mois */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Revenus du mois</h2>
                <p className="text-sm text-slate-500">Performance mensuelle</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-600">+15.3%</span>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-emerald-600">
              {stats.totalPaiementsMois.toLocaleString('fr-FR')}
            </span>
            <span className="text-xl font-medium text-slate-500">FCFA</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">Objectif mensuel</span>
              <span className="font-semibold text-emerald-600">75% atteint</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full w-3/4"></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium mb-1">Cette semaine</p>
              <p className="text-lg font-bold text-slate-800">{(stats.totalPaiementsMois * 0.25).toLocaleString('fr-FR')}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium mb-1">Moy. journalière</p>
              <p className="text-lg font-bold text-slate-800">{(stats.totalPaiementsMois / 30).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 font-medium mb-1">Prévision</p>
              <p className="text-lg font-bold text-emerald-600">{(stats.totalPaiementsMois * 1.15).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>

        {/* Paiements Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Historique Paiements</h2>
                <p className="text-sm text-slate-500">
                  {filteredPaiements.length} transaction(s) • {getTotalFiltered().toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-700 font-medium"
            >
              <Filter className="w-4 h-4" />
              Filtres
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mb-6 p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rechercher
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Locataire, bien, référence..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Période
                  </label>
                  <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                  >
                    <option value="month">Ce mois</option>
                    <option value="3months">3 derniers mois</option>
                    <option value="6months">6 derniers mois</option>
                    <option value="year">Cette année</option>
                    <option value="all">Tout</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setShowAllPayments(!showAllPayments)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  {showAllPayments ? 'Afficher les 5 derniers' : 'Afficher tout'}
                </button>

                {(searchTerm || periodFilter !== 'month') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPeriodFilter('month');
                    }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredPaiements.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-3">
                  <DollarSign className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">
                  {searchTerm || periodFilter !== 'month' ? 'Aucun paiement trouvé' : 'Aucun paiement enregistré'}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {searchTerm || periodFilter !== 'month'
                    ? 'Essayez de modifier vos filtres'
                    : 'Les paiements apparaîtront ici'}
                </p>
              </div>
            ) : (
              filteredPaiements.map((paiement) => (
                <div
                  key={paiement.id}
                  className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                      {paiement.locataire_nom?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 truncate">
                        {paiement.locataire_nom}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-slate-500 flex items-center gap-1 truncate">
                          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{paiement.bien_adresse}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-1 flex-shrink-0">
                    <p className="font-bold text-lg text-emerald-600">
                      {Number(paiement.montant_paye).toLocaleString('fr-FR')} FCFA
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 rounded text-blue-600 text-xs font-medium">
                        {paiement.mode_paiement}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  iconBg,
  trend,
  trendUp,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  iconBg: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 ${iconBg} rounded-lg`}>
          <div className="text-white">{icon}</div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
          trendUp ? 'bg-emerald-50' : 'bg-red-50'
        }`}>
          {trendUp ? (
            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-600" />
          )}
          <span className={`text-xs font-semibold ${
            trendUp ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {trend}
          </span>
        </div>
      </div>
      <p className="text-slate-600 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
    </div>
  );
}