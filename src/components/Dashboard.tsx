import { useState, useEffect } from 'react';
import { Home, Users, Building2, FileText, DollarSign, TrendingUp, Calendar, Target, AlertTriangle, Filter, X, Download, RefreshCw, ChevronDown } from 'lucide-react';
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
  paiementsEnRetard: any[];
  topProprietaires: any[];
  evolutionMensuelle: any[];
}

interface Filters {
  periode: string;
  moisDebut: string;
  moisFin: string;
  proprietaire: string;
  typeBien: string;
  statut: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [proprietaires, setProprietaires] = useState<any[]>([]);
  
  const [filters, setFilters] = useState<Filters>({
    periode: 'mois_actuel',
    moisDebut: new Date().toISOString().slice(0, 7),
    moisFin: new Date().toISOString().slice(0, 7),
    proprietaire: 'tous',
    typeBien: 'tous',
    statut: 'tous'
  });

  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [
        proprietairesData,
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

      setProprietaires(proprietairesData);

      // Appliquer les filtres
      let biensFiltered = biens;
      let contratsFiltered = contrats;
      let contratsActifsFiltered = contratsActifs;

      if (filters.proprietaire !== 'tous') {
        biensFiltered = biens.filter((b: any) => b.proprietaire_id === parseInt(filters.proprietaire));
        const bienIds = biensFiltered.map((b: any) => b.id);
        contratsFiltered = contrats.filter((c: any) => bienIds.includes(c.bien_id));
        contratsActifsFiltered = contratsActifs.filter((c: any) => bienIds.includes(c.bien_id));
      }

      if (filters.typeBien !== 'tous') {
        biensFiltered = biensFiltered.filter((b: any) => b.type === filters.typeBien);
        const bienIds = biensFiltered.map((b: any) => b.id);
        contratsFiltered = contratsFiltered.filter((c: any) => bienIds.includes(c.bien_id));
        contratsActifsFiltered = contratsActifsFiltered.filter((c: any) => bienIds.includes(c.bien_id));
      }

      if (filters.statut !== 'tous') {
        biensFiltered = biensFiltered.filter((b: any) => b.statut === filters.statut);
      }

      // Calculer les dates selon la période
      let dateDebut: Date, dateFin: Date;
      const now = new Date();

      switch (filters.periode) {
        case 'mois_actuel':
          dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'mois_dernier':
          dateDebut = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          dateFin = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'trimestre':
          const trimestre = Math.floor(now.getMonth() / 3);
          dateDebut = new Date(now.getFullYear(), trimestre * 3, 1);
          dateFin = new Date(now.getFullYear(), (trimestre + 1) * 3, 0);
          break;
        case 'annee':
          dateDebut = new Date(now.getFullYear(), 0, 1);
          dateFin = new Date(now.getFullYear(), 11, 31);
          break;
        case 'personnalise':
          dateDebut = new Date(filters.moisDebut + '-01');
          dateFin = new Date(filters.moisFin + '-01');
          dateFin = new Date(dateFin.getFullYear(), dateFin.getMonth() + 1, 0);
          break;
        default:
          dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      // Calculer le montant attendu
      const montantAttendu = contratsActifsFiltered.reduce((sum: number, c: any) => {
        return sum + (Number(c.montant_loyer) || 0);
      }, 0);

      // Filtrer les paiements par période
      const paiementsPeriode = paiements.filter((p: any) => {
        const datePaiement = new Date(p.date_paiement);
        return datePaiement >= dateDebut && datePaiement <= dateFin;
      });

      const contratIds = contratsActifsFiltered.map((c: any) => c.id);
      const paiementsFiltres = paiementsPeriode.filter((p: any) => contratIds.includes(p.contrat_id));

      const montantPayePeriode = paiementsFiltres.reduce((sum: number, p: any) => {
        return sum + (Number(p.montant_paye) || 0);
      }, 0);

      const tauxCollecte = montantAttendu > 0 
        ? Math.round((montantPayePeriode / montantAttendu) * 100) 
        : 0;

      // Derniers paiements
      const derniersPaiements = paiementsFiltres
        .sort((a: any, b: any) => new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime())
        .slice(0, 5);

      // Contrats expirant dans les 30 jours
      const dans30Jours = new Date();
      dans30Jours.setDate(dans30Jours.getDate() + 30);

      const contratsExpirants = contratsActifsFiltered.filter((c: any) => {
        const dateFin = new Date(c.date_fin);
        return dateFin <= dans30Jours && dateFin >= now;
      });

      // Paiements en retard
      const paiementsEnRetard = contratsActifsFiltered.filter((c: any) => {
        const dernierPaiement = paiements
          .filter((p: any) => p.contrat_id === c.id)
          .sort((a: any, b: any) => new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime())[0];
        
        if (!dernierPaiement) return true;
        
        const joursPasses = Math.floor((now.getTime() - new Date(dernierPaiement.date_paiement).getTime()) / (1000 * 60 * 60 * 24));
        return joursPasses > 30;
      });

      // Top propriétaires
      const proprietairesStats = proprietairesData.map((p: any) => {
        const biensProprietaire = biensFiltered.filter((b: any) => b.proprietaire_id === p.id);
        const contratsProprietaire = contratsActifsFiltered.filter((c: any) => 
          biensProprietaire.find((b: any) => b.id === c.bien_id)
        );
        const revenu = contratsProprietaire.reduce((sum: number, c: any) => sum + Number(c.montant_loyer), 0);
        
        return {
          ...p,
          nombreBiens: biensProprietaire.length,
          revenuMensuel: revenu
        };
      }).sort((a: any, b: any) => b.revenuMensuel - a.revenuMensuel).slice(0, 5);

      // Évolution sur 6 mois
      const evolutionMensuelle = [];
      for (let i = 5; i >= 0; i--) {
        const mois = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const moisSuivant = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const paiementsMois = paiements.filter((p: any) => {
          const date = new Date(p.date_paiement);
          return date >= mois && date <= moisSuivant;
        });
        
        const montant = paiementsMois.reduce((sum: number, p: any) => sum + Number(p.montant_paye), 0);
        
        evolutionMensuelle.push({
          mois: mois.toLocaleDateString('fr-FR', { month: 'short' }),
          montant
        });
      }

      setStats({
        totalProprietaires: proprietairesData.length,
        totalLocataires: locataires.length,
        totalBiens: biensFiltered.length,
        biensDisponibles: biensFiltered.filter((b: any) => b.statut === 'disponible').length,
        biensLoues: biensFiltered.filter((b: any) => b.statut === 'loue').length,
        totalContrats: contratsFiltered.length,
        contratsActifs: contratsActifsFiltered.length,
        totalPaiements: paiementsFiltres.length,
        montantPaiementsMoisActuel: montantPayePeriode,
        montantAttenduMoisActuel: montantAttendu,
        tauxCollecte,
        derniersPaiements,
        contratsExpirantBientot: contratsExpirants,
        objectifMensuel: montantAttendu,
        progression: tauxCollecte,
        paiementsEnRetard,
        topProprietaires: proprietairesStats,
        evolutionMensuelle
      });
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      periode: 'mois_actuel',
      moisDebut: new Date().toISOString().slice(0, 7),
      moisFin: new Date().toISOString().slice(0, 7),
      proprietaire: 'tous',
      typeBien: 'tous',
      statut: 'tous'
    });
  };

  const exportData = () => {
    if (!stats) return;
    
    // Créer le contenu HTML pour le PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rapport Dashboard - ${new Date().toLocaleDateString('fr-FR')}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #666;
            margin: 10px 0 0 0;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            background: #2563eb;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          .stat-card {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          .stat-card .number {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin: 10px 0;
          }
          .stat-card .label {
            color: #666;
            font-size: 14px;
          }
          .progress-section {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .progress-bar {
            width: 100%;
            height: 30px;
            background: #e5e7eb;
            border-radius: 15px;
            overflow: hidden;
            margin: 15px 0;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(to right, #10b981, #059669);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
          }
          .details-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 15px;
          }
          .detail-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          .detail-card .amount {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
            margin: 5px 0;
          }
          .detail-card .label {
            font-size: 12px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #e5e7eb;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .alert-box {
            background: #fef2f2;
            border: 2px solid #fca5a5;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
          }
          .alert-box h4 {
            color: #dc2626;
            margin: 0 0 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Rapport de Gestion Locative</h1>
          <p>Généré le ${new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p><strong>Période:</strong> ${getPeriodeName()}</p>
        </div>

        <!-- Statistiques principales -->
        <div class="section">
          <div class="section-title">📈 Statistiques Principales</div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="label">Propriétaires</div>
              <div class="number">${stats.totalProprietaires}</div>
            </div>
            <div class="stat-card">
              <div class="label">Locataires</div>
              <div class="number">${stats.totalLocataires}</div>
            </div>
            <div class="stat-card">
              <div class="label">Biens</div>
              <div class="number">${stats.totalBiens}</div>
              <div class="label" style="margin-top: 5px;">${stats.biensDisponibles} dispo • ${stats.biensLoues} loués</div>
            </div>
            <div class="stat-card">
              <div class="label">Contrats Actifs</div>
              <div class="number">${stats.contratsActifs}</div>
              <div class="label" style="margin-top: 5px;">sur ${stats.totalContrats} total</div>
            </div>
          </div>
        </div>

        <!-- Objectif de collecte -->
        <div class="section">
          <div class="section-title">🎯 Objectif de Collecte</div>
          <div class="progress-section">
            <h3 style="margin: 0 0 10px 0;">Progression: ${stats.progression}%</h3>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(stats.progression, 100)}%">
                ${stats.progression}%
              </div>
            </div>
            <div class="details-grid">
              <div class="detail-card">
                <div class="label">Montant Attendu</div>
                <div class="amount">${stats.montantAttenduMoisActuel.toLocaleString('fr-FR')} FCFA</div>
              </div>
              <div class="detail-card">
                <div class="label">Montant Collecté</div>
                <div class="amount" style="color: #10b981;">${stats.montantPaiementsMoisActuel.toLocaleString('fr-FR')} FCFA</div>
              </div>
              <div class="detail-card">
                <div class="label">Montant Restant</div>
                <div class="amount" style="color: #f59e0b;">${Math.max(0, stats.montantAttenduMoisActuel - stats.montantPaiementsMoisActuel).toLocaleString('fr-FR')} FCFA</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Indicateurs clés -->
        <div class="section">
          <div class="section-title">📊 Indicateurs Clés</div>
          <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="stat-card">
              <div class="label">Taux d'Occupation</div>
              <div class="number">${stats.totalBiens > 0 ? Math.round((stats.biensLoues / stats.totalBiens) * 100) : 0}%</div>
              <div class="label">${stats.biensLoues} / ${stats.totalBiens} biens</div>
            </div>
            <div class="stat-card">
              <div class="label">Loyer Moyen</div>
              <div class="number">${stats.contratsActifs > 0 ? Math.round(stats.montantAttenduMoisActuel / stats.contratsActifs).toLocaleString('fr-FR') : 0}</div>
              <div class="label">FCFA / contrat</div>
            </div>
            <div class="stat-card">
              <div class="label">Taux de Collecte</div>
              <div class="number">${stats.tauxCollecte}%</div>
            </div>
          </div>
        </div>

        ${stats.paiementsEnRetard.length > 0 ? `
        <!-- Alertes -->
        <div class="section">
          <div class="section-title">⚠️ Alertes et Notifications</div>
          <div class="alert-box">
            <h4>🚨 Paiements en Retard (${stats.paiementsEnRetard.length})</h4>
            <table>
              <thead>
                <tr>
                  <th>Locataire</th>
                  <th>Bien</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                ${stats.paiementsEnRetard.slice(0, 10).map((c: any) => `
                  <tr>
                    <td>${c.locataire_nom}</td>
                    <td>${c.bien_adresse}</td>
                    <td style="color: #dc2626; font-weight: bold;">${Number(c.montant_loyer).toLocaleString('fr-FR')} FCFA</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        ${stats.contratsExpirantBientot.length > 0 ? `
        <!-- Contrats expirant -->
        <div class="section">
          <div class="section-title">📅 Contrats Expirant Prochainement</div>
          <table>
            <thead>
              <tr>
                <th>Locataire</th>
                <th>Bien</th>
                <th>Date d'Expiration</th>
                <th>Jours Restants</th>
              </tr>
            </thead>
            <tbody>
              ${stats.contratsExpirantBientot.map((c: any) => `
                <tr>
                  <td>${c.locataire_nom}</td>
                  <td>${c.bien_adresse}</td>
                  <td>${new Date(c.date_fin).toLocaleDateString('fr-FR')}</td>
                  <td style="color: #f59e0b; font-weight: bold;">
                    ${Math.ceil((new Date(c.date_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} jours
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${stats.topProprietaires.length > 0 ? `
        <!-- Top propriétaires -->
        <div class="section">
          <div class="section-title">🏆 Top Propriétaires</div>
          <table>
            <thead>
              <tr>
                <th>Rang</th>
                <th>Nom</th>
                <th>Nombre de Biens</th>
                <th>Revenu Mensuel</th>
              </tr>
            </thead>
            <tbody>
              ${stats.topProprietaires.map((p: any, index: number) => `
                <tr>
                  <td><strong>${index + 1}</strong></td>
                  <td>${p.nom} ${p.prenom}</td>
                  <td>${p.nombreBiens}</td>
                  <td style="color: #2563eb; font-weight: bold;">${p.revenuMensuel.toLocaleString('fr-FR')} FCFA</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${stats.derniersPaiements.length > 0 ? `
        <!-- Derniers paiements -->
        <div class="section">
          <div class="section-title">💰 Derniers Paiements</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Locataire</th>
                <th>Montant</th>
                <th>Mode de Paiement</th>
              </tr>
            </thead>
            <tbody>
              ${stats.derniersPaiements.map((p: any) => `
                <tr>
                  <td>${new Date(p.date_paiement).toLocaleDateString('fr-FR')}</td>
                  <td>${p.locataire_nom}</td>
                  <td style="color: #10b981; font-weight: bold;">${Number(p.montant_paye).toLocaleString('fr-FR')} FCFA</td>
                  <td>${p.mode_paiement}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p>Ce rapport a été généré automatiquement par le système de gestion locative</p>
          <p>© ${new Date().getFullYear()} - Tous droits réservés</p>
        </div>
      </body>
      </html>
    `;

    // Ouvrir dans une nouvelle fenêtre pour impression PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Attendre le chargement puis déclencher l'impression
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const getPeriodeName = () => {
    switch (filters.periode) {
      case 'mois_actuel': return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      case 'mois_dernier': {
        const last = new Date();
        last.setMonth(last.getMonth() - 1);
        return last.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      }
      case 'trimestre': return 'Trimestre en cours';
      case 'annee': return new Date().getFullYear().toString();
      case 'personnalise': return `${filters.moisDebut} au ${filters.moisFin}`;
      default: return '';
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

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Home className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
            <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadStats()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Actualiser</span>
          </button>
          
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Exporter</span>
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filtres</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <X className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
              <select
                value={filters.periode}
                onChange={(e) => setFilters({...filters, periode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="mois_actuel">Mois actuel</option>
                <option value="mois_dernier">Mois dernier</option>
                <option value="trimestre">Trimestre en cours</option>
                <option value="annee">Année en cours</option>
                <option value="personnalise">Personnalisée</option>
              </select>
            </div>

            {filters.periode === 'personnalise' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Du</label>
                  <input
                    type="month"
                    value={filters.moisDebut}
                    onChange={(e) => setFilters({...filters, moisDebut: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Au</label>
                  <input
                    type="month"
                    value={filters.moisFin}
                    onChange={(e) => setFilters({...filters, moisFin: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Propriétaire</label>
              <select
                value={filters.proprietaire}
                onChange={(e) => setFilters({...filters, proprietaire: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="tous">Tous les propriétaires</option>
                {proprietaires.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de bien</label>
              <select
                value={filters.typeBien}
                onChange={(e) => setFilters({...filters, typeBien: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="tous">Tous les types</option>
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="studio">Studio</option>
                <option value="bureau">Bureau</option>
                <option value="commerce">Commerce</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters({...filters, statut: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="tous">Tous les statuts</option>
                <option value="disponible">Disponible</option>
                <option value="loue">Loué</option>
                <option value="maintenance">En maintenance</option>
              </select>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Période sélectionnée:</span> {getPeriodeName()}
            </p>
          </div>
        </div>
      )}

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

      {/* Objectif mensuel */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 p-3 rounded-lg">
              <Target className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Objectif de collecte</h3>
              <p className="text-sm text-gray-500 capitalize">{getPeriodeName()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-teal-600">{stats.progression}%</p>
            <p className="text-xs text-gray-500">de l'objectif</p>
          </div>
        </div>

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

      {/* Graphique d'évolution */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Évolution des collectes (6 derniers mois)</h3>
        </div>
        <div className="flex items-end justify-between h-48 gap-2">
          {stats.evolutionMensuelle.map((item, index) => {
            const maxMontant = Math.max(...stats.evolutionMensuelle.map(e => e.montant));
            const hauteur = maxMontant > 0 ? (item.montant / maxMontant) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gray-100 rounded-t-lg relative group cursor-pointer hover:opacity-80 transition-opacity" style={{ height: `${hauteur}%`, minHeight: '20px' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg"></div>
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.montant.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600 capitalize">{item.mois}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alertes et Top propriétaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paiements en retard */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Paiements en retard</h3>
              <p className="text-xs text-gray-500">Plus de 30 jours sans paiement</p>
            </div>
            <span className="ml-auto bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
              {stats.paiementsEnRetard.length}
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stats.paiementsEnRetard.length > 0 ? (
              stats.paiementsEnRetard.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-800">{c.locataire_nom}</p>
                    <p className="text-xs text-gray-600">{c.bien_adresse}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">
                      {Number(c.montant_loyer).toLocaleString('fr-FR')} FCFA
                    </p>
                    <p className="text-xs text-gray-500">En retard</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun paiement en retard</p>
            )}
          </div>
        </div>

        {/* Top propriétaires */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Top propriétaires</h3>
              <p className="text-xs text-gray-500">Par revenu mensuel</p>
            </div>
          </div>
          <div className="space-y-3">
            {stats.topProprietaires.length > 0 ? (
              stats.topProprietaires.map((p: any, index: number) => (
                <div key={p.id} className="flex items-center gap-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 text-white rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{p.nom} {p.prenom}</p>
                    <p className="text-xs text-gray-600">{p.nombreBiens} bien(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-600">
                      {p.revenuMensuel.toLocaleString('fr-FR')} FCFA
                    </p>
                    <p className="text-xs text-gray-500">/ mois</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
            )}
          </div>
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
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Contrats expirant bientôt</h3>
              <p className="text-xs text-gray-500">Dans les 30 prochains jours</p>
            </div>
            <span className="ml-auto bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">
              {stats.contratsExpirantBientot.length}
            </span>
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

      {/* Indicateurs supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-indigo-600">Taux d'occupation</h4>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-indigo-700">
            {stats.totalBiens > 0 ? Math.round((stats.biensLoues / stats.totalBiens) * 100) : 0}%
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            {stats.biensLoues} sur {stats.totalBiens} biens
          </p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border border-pink-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-pink-600">Montant moyen loyer</h4>
            <DollarSign className="w-5 h-5 text-pink-600" />
          </div>
          <p className="text-3xl font-bold text-pink-700">
            {stats.contratsActifs > 0 
              ? Math.round(stats.montantAttenduMoisActuel / stats.contratsActifs).toLocaleString('fr-FR')
              : 0}
          </p>
          <p className="text-xs text-pink-600 mt-1">FCFA / contrat</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 border border-cyan-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-cyan-600">Revenus totaux</h4>
            <TrendingUp className="w-5 h-5 text-cyan-600" />
          </div>
          <p className="text-3xl font-bold text-cyan-700">
            {stats.montantPaiementsMoisActuel.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-cyan-600 mt-1">FCFA cette période</p>
        </div>
      </div>
    </div>
  );
}