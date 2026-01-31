import { useState, useEffect } from 'react';
import { Home, UserCircle, Users, Building2, FileText, DollarSign, Menu, X, LogOut, Sparkles, CheckSquare, UserCheck, Building, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Proprietaires from './components/Proprietaires';
import Locataires from './components/Locataires';
import Biens from './components/Biens';
import Contrats from './components/Contrats';
import Paiements from './components/Paiements';
import Documents from './components/Documents';
import Agences from './components/Agences';
import Login from './components/Login';
import InscriptionPage from './components/InscriptionPage';
import LandingPage from './components/LandingPage';
import AgenceDashboard from './components/AgenceDashboard'; 
import LocataireDashboard from './components/LocataireDashboard';
import ProprietaireDashboard from './components/ProprietaireDashboard';
import ValidationProprietaire from './components/ValidationProprietaire';
import ValidationLocataire from './components/ValidationLocataire';
import { auth, validationProprietaireApi, validationLocataireApi } from './services/api';
import DemandePublique from './components/DemandePublique';
import ProfileSettings from './components/ProfileSettings';

type View = 'dashboard' | 'agences' | 'proprietaires' | 'validation-proprietaires' | 'validation-locataires' | 'locataires' | 'biens' | 'contrats' | 'paiements' | 'documents' | 'profile' | 'profile';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'locataire' | 'proprietaire' | 'agence';
  locataire_id?: number;
  locataire_nom?: string;
  proprietaire_id?: number;
  proprietaire_nom?: string;
  agence_id?: number;
  agence_nom?: string;
  agence_code?: string;
}

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInscription, setShowInscription] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingProprietairesCount, setPendingProprietairesCount] = useState(0);
  const [pendingLocatairesCount, setPendingLocatairesCount] = useState(0);
  const [showDemandePublique, setShowDemandePublique] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPendingValidations();
      const interval = setInterval(loadPendingValidations, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadPendingValidations = async () => {
    try {
      const [propCount, locCount] = await Promise.all([
        validationProprietaireApi.getProprietairesEnAttente(),
        validationLocataireApi.getLocatairesEnAttente()
      ]);
      setPendingProprietairesCount(propCount);
      setPendingLocatairesCount(locCount);
    } catch (error) {
      console.error('Erreur chargement validations:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const result = await auth.getCurrentUser();
      if (result && result.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentView('dashboard');
    setShowInscription(false);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    auth.logout();
    setUser(null);
    setCurrentView('dashboard');
    setShowInscription(false);
    setShowLogin(false);
  };

  const navigation = [
    { id: 'dashboard' as View, name: 'Tableau de bord', icon: Home },
    { 
      id: 'validation-proprietaires' as View, 
      name: 'Validation Propriétaires', 
      icon: CheckSquare, 
      showBadge: true,
      badgeCount: pendingProprietairesCount 
    },
    { 
      id: 'validation-locataires' as View, 
      name: 'Validation Locataires', 
      icon: UserCheck, 
      showBadge: true,
      badgeCount: pendingLocatairesCount 
    },
    { id: 'agences' as View, name: 'Agences', icon: Building },
    { id: 'proprietaires' as View, name: 'Propriétaires', icon: UserCircle },
    { id: 'locataires' as View, name: 'Locataires', icon: Users },
    { id: 'biens' as View, name: 'Biens', icon: Building2 },
    { id: 'contrats' as View, name: 'Contrats', icon: FileText },
    { id: 'paiements' as View, name: 'Paiements', icon: DollarSign },
    { id: 'documents' as View, name: 'Documents', icon: FileText },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'validation-proprietaires':
        return <ValidationProprietaire onValidationChange={loadPendingValidations} />;
      case 'validation-locataires':
        return <ValidationLocataire onValidationChange={loadPendingValidations} />;
      case 'agences':
        return <Agences />;
      case 'proprietaires':
        return <Proprietaires />;
      case 'locataires':
        return <Locataires />;
      case 'biens':
        return <Biens />;
      case 'contrats':
        return <Contrats />;
      case 'paiements':
        return <Paiements />;
      case 'documents':
        return <Documents />;
      case 'profile':
        return user ? <ProfileSettings user={user} /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showDemandePublique) {
      return (
        <DemandePublique 
          onRetour={() => setShowDemandePublique(false)}
          onShowLogin={() => {
            setShowDemandePublique(false);
            setShowLogin(true);
          }}
          onShowInscription={() => {
            setShowDemandePublique(false);
            setShowInscription(true);
          }}
        />
      );
    }
    
    if (showInscription) {
      return <InscriptionPage onBackToLogin={() => {
        setShowInscription(false);
        setShowLogin(true);
      }} />;
    }
    
    if (showLogin) {
      return <Login 
        onLogin={handleLogin} 
        onShowInscription={() => {
          setShowLogin(false);
          setShowInscription(true);
        }} 
      />;
    }
    
    return <LandingPage 
      onShowLogin={() => setShowLogin(true)}
      onShowInscription={() => setShowInscription(true)}
      onShowDemandePublique={() => setShowDemandePublique(true)}
    />;
  }

  if (user.role === 'agence') {
    return <AgenceDashboard user={user} onLogout={handleLogout} />;
  }
  
  if (user.role === 'proprietaire') {
    return <ProprietaireDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'locataire') {
    return <LocataireDashboard user={user} onLogout={handleLogout} />;
  }

  const totalPendingValidations = pendingProprietairesCount + pendingLocatairesCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <nav className="bg-white/95 backdrop-blur-xl shadow-2xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24 gap-6">
            {/* Logo et branding */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative p-3 lg:p-4 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform">
                  <Building2 className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl lg:text-2xl xl:text-3xl font-extrabold bg-gradient-to-r from-slate-800 via-blue-700 to-blue-600 bg-clip-text text-transparent tracking-tight">
                    Gestion Loyers
                  </h1>
                  <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 animate-pulse hidden lg:block" />
                </div>
                <p className="text-xs lg:text-sm text-slate-500 font-medium mt-0.5">Plateforme de gestion immobilière</p>
              </div>
            </div>

            {/* User info et menu mobile */}
            <div className="flex items-center gap-3 lg:gap-6">
              {/* User badge - desktop */}
              <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-lg shadow-sm">
                    ADMIN
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <span className="text-sm text-slate-700 font-semibold truncate max-w-[200px]">{user.email}</span>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 transition-all shadow-lg hover:shadow-xl relative"
              >
                {totalPendingValidations > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    {totalPendingValidations}
                  </span>
                )}
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Desktop navigation */}
              <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                {navigation.slice(0, 3).map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  const badgeCount = item.badgeCount || 0;
                  const showBadge = item.showBadge && badgeCount > 0 && !isActive;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/40'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600 border border-transparent hover:border-slate-200'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                      <span className="text-sm font-semibold whitespace-nowrap hidden xl:inline">{item.name}</span>
                      {showBadge && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
                
                {/* Logout button */}
                <div className="h-8 w-px bg-slate-200 mx-1"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100 text-red-600 hover:from-red-100 hover:to-red-200 transition-all font-semibold group shadow-md hover:shadow-lg border border-red-200/50"
                >
                  <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span className="text-sm hidden xl:inline">Déconnexion</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secondary navigation - desktop only */}
          <div className="hidden lg:block border-t border-slate-200/60 bg-gradient-to-b from-slate-50/50 to-transparent">
            <div className="flex items-center gap-2 py-3 overflow-x-auto">
              {/* ✅ Navigation items (Agences à Documents) */}
              {navigation.slice(3).map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                    <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                  </button>
                );
              })}
              
              {/* ✅ Bouton Mon Profil - APRÈS Documents */}
              <button
                onClick={() => setCurrentView('profile')}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all group ${
                  currentView === 'profile'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-white hover:text-purple-600 hover:shadow-sm'
                }`}
              >
                <User className={`w-4 h-4 ${currentView === 'profile' ? '' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="text-sm font-medium whitespace-nowrap">Mon Profil</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl animate-fadeIn">
            <div className="w-full px-4 py-4 space-y-2 max-h-[calc(100vh-5rem)] overflow-y-auto">
              {/* User info mobile */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200/60 mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-lg">
                  ADMIN
                </span>
                <span className="text-sm text-slate-700 font-semibold truncate flex-1">{user.email}</span>
              </div>

              {/* ✅ Navigation items */}
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                const badgeCount = item.badgeCount || 0;
                const showBadge = item.showBadge && badgeCount > 0 && !isActive;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`relative flex items-center gap-3 w-full px-5 py-4 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl blur opacity-30"></div>
                    )}
                    <Icon className="w-6 h-6 relative z-10" />
                    <span className="font-semibold relative z-10">{item.name}</span>
                    {showBadge && (
                      <span className="ml-auto min-w-[24px] h-6 px-2 bg-red-500 text-white text-sm font-bold rounded-full flex items-center justify-center animate-pulse">
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
              
              {/* ✅ Bouton Mon Profil mobile - APRÈS Documents */}
              <button
                onClick={() => {
                  setCurrentView('profile');
                  setMobileMenuOpen(false);
                }}
                className={`relative flex items-center gap-3 w-full px-5 py-4 rounded-2xl transition-all ${
                  currentView === 'profile'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                    : 'text-slate-600 bg-slate-50 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                {currentView === 'profile' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl blur opacity-30"></div>
                )}
                <User className="w-6 h-6 relative z-10" />
                <span className="font-semibold relative z-10">Mon Profil</span>
              </button>
              
              {/* ✅ Séparateur + Bouton Déconnexion */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl bg-gradient-to-r from-red-50 to-red-100 text-red-600 hover:from-red-100 hover:to-red-200 transition-all border-t-2 border-slate-200 mt-4 pt-6 font-semibold shadow-lg"
              >
                <LogOut className="w-6 h-6" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>

      <footer className="bg-white/90 backdrop-blur-xl border-t border-slate-200/50 mt-12">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <p className="text-slate-600 text-sm font-medium">
                Gestion de Loyers - Application de gestion immobilière
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-blue-100 rounded-full">
                <span className="text-xs font-bold text-blue-700">
                  ✓ Connecté en tant que Administrateur
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;