import { useState, useEffect } from 'react';
import { Home, UserCircle, Users, Building2, FileText, DollarSign, Menu, X, LogOut, Sparkles } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Proprietaires from './components/Proprietaires';
import Locataires from './components/Locataires';
import Biens from './components/Biens';
import Contrats from './components/Contrats';
import Paiements from './components/Paiements';
import Documents from './components/Documents';
import Login from './components/Login';
import LocataireDashboard from './components/LocataireDashboard';
import { auth } from './services/api';

type View = 'dashboard' | 'proprietaires' | 'locataires' | 'biens' | 'contrats' | 'paiements' | 'documents';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'locataire';
  locataire_id?: number;
  locataire_nom?: string;
}

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

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
  };

  const handleLogout = () => {
    auth.logout();
    setUser(null);
  };

  const navigation = [
    { id: 'dashboard' as View, name: 'Tableau de bord', icon: Home },
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
      default:
        return <Dashboard />;
    }
  };

  // Loading state
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

  // Not authenticated - show login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Locataire view - special dashboard
  if (user.role === 'locataire') {
    return <LocataireDashboard user={user} onLogout={handleLogout} />;
  }

  // Admin view - full application
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header Premium */}
      <nav className="bg-white/90 backdrop-blur-xl shadow-xl border-b border-slate-200/50 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-4">
            {/* Logo et Titre */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl blur-lg opacity-50 hidden sm:block"></div>
                <div className="relative p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl">
                  <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent whitespace-nowrap">
                    Gestion Loyers
                  </h1>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 animate-pulse hidden xl:block flex-shrink-0" />
                </div>
                <div className="hidden sm:flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full">
                    ADMIN
                  </span>
                  <span className="text-xs text-slate-600 font-medium truncate max-w-[150px]">{user.email}</span>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all shadow-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-end">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`relative flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-4 py-2.5 rounded-2xl transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    )}
                    <Icon className={`w-4 h-4 xl:w-5 xl:h-5 relative z-10 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                    <span className="text-xs xl:text-sm font-semibold relative z-10 whitespace-nowrap">{item.name}</span>
                  </button>
                );
              })}
              
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-4 py-2.5 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all ml-1 xl:ml-2 font-semibold group shadow-lg hover:shadow-xl flex-shrink-0"
              >
                <LogOut className="w-4 h-4 xl:w-5 xl:h-5 group-hover:rotate-12 transition-transform" />
                <span className="text-xs xl:text-sm whitespace-nowrap">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl animate-fadeIn">
            <div className="w-full px-4 py-4 space-y-2 max-h-[calc(100vh-5rem)] overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
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
                  </button>
                );
              })}
              
              {/* Mobile logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-5 py-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all border-t-2 border-slate-200 mt-4 pt-6 font-semibold"
              >
                <LogOut className="w-6 h-6" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>

      {/* Footer Premium */}
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
                  ✓ Connecté en tant que {user.role === 'admin' ? 'Administrateur' : 'Locataire'}
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