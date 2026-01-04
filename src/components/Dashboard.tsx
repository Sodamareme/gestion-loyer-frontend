import { useState, useEffect } from 'react';
import { Home, Users, Building2, FileText, DollarSign, TrendingUp, Calendar, Target, AlertTriangle } from 'lucide-react';
import api from '../services/api';

interface Stats {
  totalProprietaires: number;
  totalLocataires: number;
  totalBiens: number;
  biensDisponibles: number;
  biensLoues: number;
  totalContrats: number;
  contratsActifs: number;
  totalPaiements: number;
  montantPaiementsMoisActuel: number;
  montantAttenduMoisActuel: number;
  tauxCollecte: number;
  derniersPaiements: any[];
  contratsExpirantBientot: any[];
  objectifMensuel: number;
  progression: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        proprietaires,
        locataires,
        biens,
        contrats,
        paiements,
        contratsActifs
      ] = await Promise.all([
        api.proprietaires.getAll(),
        api.locataires.getAll(),
        api.biens.getAll(),
        api.contrats.getAll(),
        api.paiements.getAll(),
        api.contrats.getActifs()
      ]);

      // Calculer le montant attendu du mois (somme des loyers des contrats actifs)
      const montantAttendu = contratsActifs.reduce((sum: number, c: any) => {
        return sum + (Number(c.montant_loyer) || 0);
      }, 0);

      // Calculer les paiements du mois en cours
      const now = new Date();
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
      const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const paiementsMois = paiements.filter((p: any) => {
        const datePaiement = new Date(p.date_paiement);
        return datePaiement >= debutMois && datePaiement <= finMois;
      });

      const montantPayeMois = paiementsMois.reduce((sum: number, p: any) => {
        return sum + (Number(p.montant_paye) || 0);
      }, 0);

      // Calculer le taux de collecte
      const tauxCollecte = montantAttendu > 0 
        ? Math.round((montantPayeMois / montantAttendu) * 100) 
        : 0;

      // Objectif mensuel = montant attendu
      const objectifMensuel = montantAttendu;
      const progression = tauxCollecte;

      // Derniers paiements (5 derniers)
      const derniersPaiements = paiements
        .sort((a: any, b: any) => new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime())
        .slice(0, 5);

      // Contrats expirant dans les 30 jours
      const dans30Jours = new Date();
      dans30Jours.setDate(dans30Jours.getDate() + 30);

      const contratsExpirants = contratsActifs.filter((c: any) => {
        const dateFin = new Date(c.date_fin);
        return dateFin <= dans30Jours && dateFin >= now;
      });

      setStats({
        totalProprietaires: proprietaires.length,
        totalLocataires: locataires.length,
        totalBiens: biens.length,
        biensDisponibles: biens.filter((b: any) => b.statut === 'disponible').length,
        biensLoues: biens.filter((b: any) => b.statut === 'loue').length,
        totalContrats: contrats.length,
        contratsActifs: contratsActifs.length,
        totalPaiements: paiements.length,
        montantPaiementsMoisActuel: montantPayeMois,
        montantAttenduMoisActuel: montantAttendu,
        tauxCollecte,
        derniersPaiements,
        contratsExpirantBientot: contratsExpirants,
        objectifMensuel,
        progression
      });
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const getMoisActuel = () => {
    return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Home className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
        </div>
      </div>

      {/* Cartes statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.totalProprietaires}</span>
          </div>
          <h3 className="text-sm font-medium opacity-90">Propriétaires</h3>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{stats.totalLocataires}</span>
          </div>
          <h3 className="text-sm font-medium opacity-90">Locataires</h3>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Building2 className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <span className="text-3xl font-bold">{stats.totalBiens}</span>
              <p className="text-xs opacity-80 mt-1">
                {stats.biensDisponibles} dispo • {stats.biensLoues} loués
              </p>
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90">Biens</h3>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 opacity-80" />
            <div className="text-right">
              <span className="text-3xl font-bold">{stats.contratsActifs}</span>
              <p className="text-xs opacity-80 mt-1">actifs / {stats.totalContrats} total</p>
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90">Contrats</h3>
        </div>
      </div>

      {/* Objectif mensuel dynamique */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 p-3 rounded-lg">
              <Target className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Objectif mensuel</h3>
              <p className="text-sm text-gray-500 capitalize">{getMoisActuel()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-teal-600">{stats.progression}%</p>
            <p className="text-xs text-gray-500">de l'objectif</p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-4">
          <div className="relative">
            <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stats.progression >= 100
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : stats.progression >= 75
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600'
                    : stats.progression >= 50
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600'
                }`}
                style={{ width: `${Math.min(stats.progression, 100)}%` }}
              >
                <div className="h-full flex items-center justify-end pr-3">
                  {stats.progression >= 20 && (
                    <span className="text-xs font-bold text-white">
                      {stats.progression}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-xs font-medium text-blue-600 mb-1">Attendu</p>
              <p className="text-xl font-bold text-blue-700">
                {stats.montantAttenduMoisActuel.toLocaleString('fr-FR')} FCFA
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <p className="text-xs font-medium text-green-600 mb-1">Collecté</p>
              <p className="text-xl font-bold text-green-700">
                {stats.montantPaiementsMoisActuel.toLocaleString('fr-FR')} FCFA
              </p>
            </div>

            <div className={`rounded-lg p-4 ${
              stats.progression >= 100
                ? 'bg-gradient-to-br from-green-50 to-green-100'
                : 'bg-gradient-to-br from-orange-50 to-orange-100'
            }`}>
              <p className={`text-xs font-medium mb-1 ${
                stats.progression >= 100 ? 'text-green-600' : 'text-orange-600'
              }`}>
                Restant
              </p>
              <p className={`text-xl font-bold ${
                stats.progression >= 100 ? 'text-green-700' : 'text-orange-700'
              }`}>
                {Math.max(0, stats.montantAttenduMoisActuel - stats.montantPaiementsMoisActuel).toLocaleString('fr-FR')} FCFA
              </p>
            </div>
          </div>

          {/* Message d'état */}
          {stats.progression >= 100 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">
                🎉 Objectif atteint ! Félicitations !
              </p>
            </div>
          ) : stats.progression >= 75 ? (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <p className="text-sm text-teal-800 font-medium">
                Excellent ! Plus que {100 - stats.progression}% pour atteindre l'objectif.
              </p>
            </div>
          ) : stats.progression >= 50 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
              <Target className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800 font-medium">
                Bon rythme ! Continuez ainsi pour atteindre l'objectif.
              </p>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-orange-800 font-medium">
                Attention ! Seulement {stats.progression}% de l'objectif collecté.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section inférieure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Derniers paiements */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Derniers paiements</h3>
          </div>
          <div className="space-y-3">
            {stats.derniersPaiements.length > 0 ? (
              stats.derniersPaiements.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-800">{p.locataire_nom}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(p.date_paiement).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
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

        {/* Contrats expirant bientôt */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-800">Contrats expirant bientôt</h3>
          </div>
          <div className="space-y-3">
            {stats.contratsExpirantBientot.length > 0 ? (
              stats.contratsExpirantBientot.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium text-gray-800">{c.locataire_nom}</p>
                    <p className="text-xs text-gray-600">{c.bien_adresse}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-600">
                      {new Date(c.date_fin).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.ceil((new Date(c.date_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} jours
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun contrat n'expire prochainement</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}