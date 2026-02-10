import { useState, useEffect, useRef } from 'react';
import {
  Building2, Users, FileText, DollarSign,
  Shield, Clock, BarChart3, Check, ArrowRight, Sparkles,
  Menu, X, Zap, Award, Star, ChevronRight,
  MapPin, Home, Maximize, Search, Filter, Eye, Heart,
  PhoneCall, Mail, MessageCircle, CheckCircle2, ImageIcon,
  TrendingUp, Layout, Bell, ChevronDown, Send, AlertCircle, MessageSquare
} from 'lucide-react';

interface LandingPageProps {
  onShowLogin: () => void;
  onShowInscription: () => void;
  onShowDemandePublique?: () => void;
}

interface Bien {
  id: number;
  numero_bien: string;
  adresse: string;
  type: string;
  surface: number;
  nombre_pieces: number;
  description?: string;
  proprietaire_nom?: string;
  photos?: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3000/api';

const HERO_IMAGES = [
  'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1920'
];

export default function LandingPage({ onShowLogin, onShowInscription, onShowDemandePublique }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedBien, setSelectedBien] = useState<Bien | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [showAllBiens, setShowAllBiens] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    loadBiens();
    setIsVisible(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadBiens = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/biens/disponibles`);
      if (res.ok) {
        const data = await res.json();
        setBiens(data);
      }
    } catch (error) {
      console.error('Erreur chargement biens:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  const getImageUrl = (photoPath: string) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}/${photoPath}`;
  };

  const handleImageError = (photoPath: string) => {
    setImageErrors(prev => new Set([...prev, photoPath]));
  };

  const isImageValid = (photoPath: string) => {
    return photoPath && !imageErrors.has(photoPath);
  };

  const getValidPhotos = (photos?: string[]) => {
    if (!photos || photos.length === 0) return [];
    return photos.filter(photo => isImageValid(photo));
  };

  const filteredBiens = biens.filter(bien => {
    const matchSearch = searchTerm === '' ||
      bien.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bien.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bien.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = typeFilter === 'all' || bien.type === typeFilter;

    return matchSearch && matchType;
  });

  // Limiter à 9 biens si on n'est pas en mode "voir tout"
  const displayedBiens = showAllBiens ? filteredBiens : filteredBiens.slice(0, 9);

  const features = [
    {
      icon: Building2,
      title: 'Gestion Centralisée',
      description: 'Gérez tous vos biens, locataires et contrats depuis une interface intuitive.',
      gradient: 'from-blue-600 via-blue-500 to-cyan-500',
      shadowColor: 'shadow-blue-500/20'
    },
    {
      icon: DollarSign,
      title: 'Suivi Financier',
      description: 'Tableaux de bord en temps réel avec rapports détaillés et alertes automatiques.',
      gradient: 'from-emerald-600 via-emerald-500 to-teal-500',
      shadowColor: 'shadow-emerald-500/20'
    },
    {
      icon: Users,
      title: 'Gestion Locataires',
      description: 'Portail locataire intégré avec communication simplifiée.',
      gradient: 'from-cyan-600 via-cyan-500 to-blue-500',
      shadowColor: 'shadow-cyan-500/20'
    },
    {
      icon: Zap,
      title: 'Automatisation',
      description: 'Automatisez les tâches répétitives et gagnez du temps précieux.',
      gradient: 'from-teal-600 via-teal-500 to-emerald-500',
      shadowColor: 'shadow-teal-500/20'
    }
  ];

  const stats = [
    { number: '500+', label: 'Propriétaires Actifs', icon: Award },
    { number: '2K+', label: 'Biens Gérés', icon: Building2 },
    { number: '24/24', label: 'Support Dédié', icon: Clock },
    { number: '99.9%', label: 'Disponibilité', icon: CheckCircle2 }
  ];

  const biensTypes = ['chambre', 'appartement', 'maison', 'studio', 'villa', 'bureau', 'commerce'];

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      chambre: '🛏️',
      appartement: '🏢',
      maison: '🏠',
      studio: '🏘️',
      villa: '🏛️',
      bureau: '💼',
      commerce: '🏪'
    };
    return icons[type] || '🏠';
  };

  const BienImage = ({ bien, className = "" }: { bien: Bien; className?: string }) => {
    const validPhotos = getValidPhotos(bien.photos);
    const hasValidPhoto = validPhotos.length > 0;

    if (hasValidPhoto) {
      const imageUrl = getImageUrl(validPhotos[0]);
      if (imageUrl) {
        return (
          <img
            src={imageUrl}
            alt={bien.numero_bien}
            className={`w-full h-full object-cover ${className}`}
            onError={() => handleImageError(validPhotos[0])}
            loading="lazy"
          />
        );
      }
    }

    return (
      <div className={`w-full h-full bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex flex-col items-center justify-center ${className}`}>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 blur-3xl opacity-20 animate-pulse"></div>
          <Building2 className="relative w-16 h-16 text-blue-400" />
        </div>
        <span className="text-blue-600 text-xs font-bold mt-3 uppercase tracking-wider">Aucune photo</span>
      </div>
    );
  };

  const BienImageGallery = ({ bien }: { bien: Bien }) => {
    const validPhotos = getValidPhotos(bien.photos);
    const currentPhoto = validPhotos[currentPhotoIndex];
    const hasPhotos = validPhotos.length > 0;

    const handleZoomIn = () => {
      setImageZoom(prev => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = () => {
      setImageZoom(prev => Math.max(prev - 0.5, 1));
      if (imageZoom <= 1.5) {
        setImagePosition({ x: 0, y: 0 });
      }
    };

    const handleResetZoom = () => {
      setImageZoom(1);
      setImagePosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      if (imageZoom > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - imagePosition.x,
          y: e.clientY - imagePosition.y
        });
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging && imageZoom > 1) {
        setImagePosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handlePhotoChange = (index: number) => {
      setCurrentPhotoIndex(index);
      handleResetZoom();
    };

    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        // Scroll up - zoom in
        setImageZoom(prev => Math.min(prev + 0.1, 3));
      } else {
        // Scroll down - zoom out
        setImageZoom(prev => {
          const newZoom = Math.max(prev - 0.1, 1);
          if (newZoom <= 1) {
            setImagePosition({ x: 0, y: 0 });
          }
          return newZoom;
        });
      }
    };

    return (
      <div className="relative h-[28rem] bg-slate-950 rounded-t-3xl overflow-hidden">
        <div 
          className="w-full h-full overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {hasPhotos && currentPhoto ? (
            <img
              src={getImageUrl(currentPhoto)!}
              alt={`${bien.numero_bien} - Photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                cursor: imageZoom > 1 ? 'move' : 'default'
              }}
              onError={() => handleImageError(currentPhoto)}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 blur-3xl opacity-30 animate-pulse"></div>
                <ImageIcon className="relative w-24 h-24 text-blue-400" />
              </div>
              <span className="text-slate-400 font-semibold mt-4 uppercase tracking-wider text-sm">Aucune photo</span>
            </div>
          )}
        </div>

        <div className="absolute top-6 left-6">
          <span className="px-5 py-2.5 bg-white/95 backdrop-blur-xl rounded-full text-sm font-black text-slate-900 shadow-2xl border border-white/40">
            {getTypeIcon(bien.type)} {bien.type.toUpperCase()}
          </span>
        </div>

        {/* Zoom Controls */}
        {hasPhotos && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/95 backdrop-blur-xl rounded-full p-2 shadow-2xl border border-white/40">
            <button
              onClick={handleZoomOut}
              disabled={imageZoom <= 1}
              className="p-2 hover:bg-slate-100 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Dézoomer"
            >
              <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            
            <div className="px-3 py-1 min-w-[60px] text-center">
              <span className="text-sm font-black text-slate-900">{Math.round(imageZoom * 100)}%</span>
            </div>
            
            <button
              onClick={handleZoomIn}
              disabled={imageZoom >= 3}
              className="p-2 hover:bg-slate-100 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoomer"
            >
              <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
            
            {imageZoom > 1 && (
              <button
                onClick={handleResetZoom}
                className="p-2 hover:bg-slate-100 rounded-full transition-all ml-1"
                title="Réinitialiser"
              >
                <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => {
            setSelectedBien(null);
            handleResetZoom();
          }}
          className="absolute top-6 right-6 bg-white/95 backdrop-blur-xl hover:bg-white p-3.5 rounded-full transition-all shadow-2xl hover:scale-110 hover:rotate-90 border border-white/40 group"
        >
          <X className="w-5 h-5 text-slate-900" />
        </button>

        {validPhotos.length > 1 && (
          <>
            <div className="absolute bottom-6 left-6 right-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {validPhotos.map((photo, index) => {
                const photoUrl = getImageUrl(photo);
                return photoUrl ? (
                  <img
                    key={index}
                    src={photoUrl}
                    alt={`Photo ${index + 1}`}
                    className={`w-24 h-24 object-cover rounded-2xl cursor-pointer transition-all flex-shrink-0 ${
                      index === currentPhotoIndex
                        ? 'ring-4 ring-white shadow-2xl scale-105'
                        : 'opacity-60 hover:opacity-100 hover:scale-105 ring-2 ring-white/20'
                    }`}
                    onClick={() => handlePhotoChange(index)}
                    onError={() => handleImageError(photo)}
                  />
                ) : null;
              })}
            </div>

            <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-xl text-white px-5 py-2.5 rounded-full text-sm font-black border border-white/10">
              {currentPhotoIndex + 1} / {validPhotos.length}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-2xl shadow-lg shadow-slate-900/5'
          : 'bg-transparent'
      }`}>
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className={`relative p-3.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-xl shadow-blue-500/30 transition-all duration-500 ${
                scrolled ? 'scale-90' : 'scale-100'
              } group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-blue-500/50`}>
                <Building2 className="w-7 h-7 text-white" />
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent tracking-tight">
                  VOSCLES
                </h1>
                <p className="text-[10px] text-slate-600 font-extrabold tracking-[0.2em] uppercase -mt-0.5">
                  Gestion Premium
                </p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <a href="#biens" className="px-6 py-3 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                Biens
              </a>
              <a href="#features" className="px-6 py-3 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                Fonctionnalités
              </a>
              <a href="#contact" className="px-6 py-3 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                Contact
              </a>
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-2"></div>
              {onShowDemandePublique && (
                <button
                  onClick={onShowDemandePublique}
                  className="px-6 py-3 text-sm font-bold text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-xl transition-all flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Demande
                </button>
              )}
              <button
                onClick={onShowLogin}
                className="px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              >
                Connexion
              </button>
              <button
                onClick={onShowInscription}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105"
              >
                Commencer
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-3 rounded-xl hover:bg-slate-100 text-slate-900 transition-all"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden py-8 border-t border-slate-200 animate-slideDown">
              <div className="space-y-3">
                <a
                  href="#biens"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Biens Disponibles
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Fonctionnalités
                </a>
                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Contact
                </a>
                <div className="border-t border-slate-200 my-4"></div>
                <button
                  onClick={() => {
                    onShowDemandePublique?.();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 text-sm font-bold text-amber-700 hover:bg-amber-50 rounded-xl transition-all flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Faire une demande
                </button>
                <button
                  onClick={() => {
                    onShowLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Connexion
                </button>
                <button
                  onClick={() => {
                    onShowInscription();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-black rounded-xl shadow-lg"
                >
                  Commencer Gratuitement
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0 z-0">
          {HERO_IMAGES.map((image, index) => (
            <div
              key={image}
              className={`absolute inset-0 transition-opacity duration-[2000ms] ${
                index === currentHeroImage ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image}
                alt="Property"
                className="w-full h-full object-cover animate-slowZoom"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/75 to-blue-950/80"></div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-20 w-full">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            {/* Badge */}
            <div className={`inline-flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span className="text-sm font-black text-white uppercase tracking-wider">Plateforme de Gestion Immobilière</span>
            </div>

            {/* Title */}
            <div className={`space-y-6 transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
                Trouvez le bien idéal
                <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-300 bg-clip-text text-transparent mt-3">
                  pour votre projet
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-white/80 leading-relaxed font-medium max-w-3xl mx-auto">
                {biens.length}+ biens disponibles • Gestion professionnelle • Support 24/24
              </p>
            </div>

            {/* Search Bar */}
            <div className={`transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-white rounded-3xl p-3 shadow-2xl border border-white/20 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Search Input */}
                  <div className="md:col-span-2 relative">
                    <input
                      type="text"
                      placeholder="Rechercher par ville, quartier, type de bien..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-6 py-4 pl-14 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-semibold text-slate-900 placeholder:text-slate-400"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>

                  {/* Type Select */}
                  <div className="relative">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-6 py-4 pl-14 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-600 transition-all font-semibold text-slate-900 appearance-none cursor-pointer"
                    >
                      <option value="all">Tous les types</option>
                      {biensTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Search Button */}
                <button
                  onClick={() => {
                    const biensSection = document.getElementById('biens');
                    biensSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full mt-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white text-base font-black rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-3 uppercase tracking-wider"
                >
                  <Search className="w-5 h-5" />
                  Rechercher
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 transition-all duration-1000 delay-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all"
                  >
                    <Icon className="w-6 h-6 text-cyan-300 mb-2" />
                    <p className="text-2xl font-black text-white">{stat.number}</p>
                    <p className="text-xs text-white/70 font-bold uppercase tracking-wide">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <a href="#biens" className="block p-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 hover:bg-white/20 transition-all">
            <ChevronDown className="w-6 h-6 text-white" />
          </a>
        </div>
      </section>

      {/* Properties Section */}
      <section id="biens" className="py-24 px-6 sm:px-8 lg:px-12 bg-white scroll-mt-20">
        <div className="max-w-[1400px] mx-auto">
          {/* Section Header */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-blue-50 border border-blue-200 rounded-full mb-4">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-black text-blue-700 uppercase tracking-wider">Nos Biens</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  Biens disponibles à la location
                </h2>
                <p className="text-lg text-slate-600 font-semibold mt-3">
                  {filteredBiens.length} bien{filteredBiens.length > 1 ? 's' : ''} correspond{filteredBiens.length > 1 ? 'ent' : ''} à votre recherche
                  {!showAllBiens && filteredBiens.length > 9 && (
                    <span className="text-blue-600"> • Affichage de 9 biens</span>
                  )}
                </p>
              </div>

              {/* Filters Toggle (Desktop) */}
              <div className="hidden lg:flex items-center gap-3">
                <button className="px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition-all flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtres
                </button>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-6 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-900 appearance-none cursor-pointer hover:border-slate-300 transition-all"
                >
                  <option value="all">Tous les types</option>
                  {biensTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3">
              {biensTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type === typeFilter ? 'all' : type)}
                  className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                    typeFilter === type
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {getTypeIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
              {typeFilter !== 'all' && (
                <button
                  onClick={() => setTypeFilter('all')}
                  className="px-5 py-2.5 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Properties Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-blue-600 border-r-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-700 font-black text-xl uppercase tracking-wider">Chargement...</p>
            </div>
          ) : filteredBiens.length === 0 ? (
            <div className="text-center py-40 bg-gradient-to-br from-slate-100 to-blue-50 rounded-3xl border-2 border-slate-200">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 blur-3xl opacity-30 animate-pulse"></div>
                <Building2 className="relative w-24 h-24 text-slate-400" />
              </div>
              <p className="text-slate-700 font-black text-2xl mb-2">Aucun bien disponible</p>
              <p className="text-slate-500 font-semibold">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {displayedBiens.map((bien, idx) => {
                  const validPhotos = getValidPhotos(bien.photos);
                  return (
                    <div
                      key={bien.id}
                      className="group relative bg-white rounded-[2rem] overflow-hidden border border-slate-200 hover:border-transparent hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-700 cursor-pointer"
                      style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => {
                        setSelectedBien(bien);
                        setCurrentPhotoIndex(0);
                        setImageZoom(1);
                        setImagePosition({ x: 0, y: 0 });
                      }}
                    >
                      {/* Gradient Border Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[2rem] -z-10 blur-sm"></div>
                      
                      {/* Image Section */}
                      <div className="relative h-72 overflow-hidden">
                        <BienImage bien={bien} className="group-hover:scale-125 transition-transform duration-1000 ease-out" />

                        {/* Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
                        
                        {/* Animated Shine Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>

                        {/* Type Badge */}
                        <div className="absolute top-5 left-5 transform group-hover:scale-110 transition-transform duration-300">
                          <div className="px-5 py-2.5 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/50 flex items-center gap-2">
                            <span className="text-2xl">{getTypeIcon(bien.type)}</span>
                            <span className="text-xs font-black text-slate-900 uppercase tracking-[0.15em]">
                              {bien.type}
                            </span>
                          </div>
                        </div>

                        {/* Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(bien.id);
                          }}
                          className="absolute top-5 right-5 p-3.5 bg-white/95 backdrop-blur-2xl rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-2xl border border-white/50 z-10"
                        >
                          <Heart
                            className={`w-5 h-5 transition-all duration-300 ${
                              favorites.has(bien.id)
                                ? 'fill-red-500 text-red-500 scale-110'
                                : 'text-slate-700 group-hover:text-red-500'
                            }`}
                          />
                        </button>

                        {/* Photo Counter */}
                        {validPhotos.length > 0 && (
                          <div className="absolute bottom-5 right-5 px-4 py-2.5 bg-slate-950/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
                            <div className="flex items-center gap-2.5">
                              <ImageIcon className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs font-black text-white uppercase tracking-wider">
                                {validPhotos.length} {validPhotos.length > 1 ? 'Photos' : 'Photo'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Bottom Info on Hover */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/90 backdrop-blur-xl rounded-xl">
                                <Maximize className="w-4 h-4 text-white" />
                                <span className="text-sm font-black text-white">{bien.surface}m²</span>
                              </div>
                              <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/90 backdrop-blur-xl rounded-xl">
                                <Home className="w-4 h-4 text-white" />
                                <span className="text-sm font-black text-white">{bien.nombre_pieces} pcs</span>
                              </div>
                            </div>
                            <div className="p-3 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                              <Eye className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-7 space-y-6">
                        {/* Title */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                              {bien.numero_bien}
                            </h3>
                            <div className="px-3 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                                Disponible
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2.5">
                            <div className="p-2 bg-slate-100 rounded-lg mt-0.5">
                              <MapPin className="w-4 h-4 text-slate-500" />
                            </div>
                            <p className="text-sm font-semibold text-slate-600 line-clamp-2 leading-relaxed">
                              {bien.adresse}
                            </p>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-slate-100">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Maximize className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Surface</span>
                            </div>
                            <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                              {bien.surface}m²
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-cyan-100 rounded-lg">
                                <Home className="w-4 h-4 text-cyan-600" />
                              </div>
                              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Pièces</span>
                            </div>
                            <p className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                              {bien.nombre_pieces}
                            </p>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBien(bien);
                            setCurrentPhotoIndex(0);
                            setImageZoom(1);
                            setImagePosition({ x: 0, y: 0 });
                          }}
                          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group/btn uppercase tracking-wider relative overflow-hidden"
                        >
                          {/* Button Shine Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                          
                          <Eye className="w-5 h-5 relative z-10" />
                          <span className="relative z-10">Voir les détails</span>
                          <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform relative z-10" />
                        </button>
                      </div>

                      {/* Hover Glow Effect */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-[2rem] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-700 -z-20"></div>
                    </div>
                  );
                })}
              </div>

              {/* Show More / Show Less Buttons */}
              {!showAllBiens && filteredBiens.length > 9 && (
                <div className="mt-16 text-center">
                  <button
                    onClick={() => setShowAllBiens(true)}
                    className="group px-12 py-6 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white text-lg font-black rounded-2xl transition-all shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/60 hover:scale-105 inline-flex items-center gap-4 uppercase tracking-wider"
                  >
                    <Eye className="w-6 h-6" />
                    Voir tous les {filteredBiens.length} biens
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </button>
                  <p className="text-slate-600 font-semibold mt-4">
                    {filteredBiens.length - 9} biens supplémentaires disponibles
                  </p>
                </div>
              )}

              {showAllBiens && filteredBiens.length > 9 && (
                <div className="mt-16 text-center">
                  <button
                    onClick={() => {
                      setShowAllBiens(false);
                      document.getElementById('biens')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-10 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all inline-flex items-center gap-3 uppercase tracking-wider"
                  >
                    Voir moins
                    <ChevronDown className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Property Modal */}
      {selectedBien && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-scaleIn">
            <BienImageGallery bien={selectedBien} />

            <div className="p-10 sm:p-12 space-y-10">
              <div>
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">{selectedBien.numero_bien}</h2>
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="w-6 h-6 text-blue-500" />
                  <span className="text-lg font-semibold">{selectedBien.adresse}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 border-2 border-blue-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                      <Maximize className="w-7 h-7 text-blue-600" />
                    </div>
                    <span className="text-sm font-black text-blue-900 uppercase tracking-wider">Surface</span>
                  </div>
                  <p className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {selectedBien.surface} m²
                  </p>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-3xl p-8 border-2 border-cyan-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                      <Home className="w-7 h-7 text-cyan-600" />
                    </div>
                    <span className="text-sm font-black text-cyan-900 uppercase tracking-wider">Pièces</span>
                  </div>
                  <p className="text-4xl font-black bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                    {selectedBien.nombre_pieces}
                  </p>
                </div>
              </div>

              {selectedBien.description && (
                <div className="bg-slate-50 rounded-3xl p-8 border-2 border-slate-200">
                  <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <FileText className="w-5 h-5 text-slate-600" />
                    Description
                  </h3>
                  <p className="text-slate-700 leading-relaxed font-medium text-lg">{selectedBien.description}</p>
                </div>
              )}

              {selectedBien.proprietaire_nom && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border-2 border-emerald-100">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                      <Users className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-1">Propriétaire</p>
                      <p className="text-2xl font-black text-emerald-700">{selectedBien.proprietaire_nom}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-8 border-t-2 border-slate-200">
                <button
                  onClick={() => toggleFavorite(selectedBien.id)}
                  className={`px-8 py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 uppercase tracking-wider ${
                    favorites.has(selectedBien.id)
                      ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-600 border-2 border-red-200'
                      : 'bg-slate-100 text-slate-700 border-2 border-slate-300 hover:border-red-200 hover:bg-red-50'
                  }`}
                >
                  <Heart className={favorites.has(selectedBien.id) ? 'fill-current w-5 h-5' : 'w-5 h-5'} />
                  {favorites.has(selectedBien.id) ? 'Retirer' : 'Ajouter'}
                </button>

                <button
                  onClick={() => {
                    sessionStorage.setItem('selectedBienForDemande', JSON.stringify({
                      bien_id: selectedBien.id,
                      numero_bien: selectedBien.numero_bien,
                      adresse: selectedBien.adresse
                    }));
                    setSelectedBien(null);
                    onShowDemandePublique?.();
                  }}
                  className="px-8 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/60 flex items-center justify-center gap-3 uppercase tracking-wider"
                >
                  <MessageSquare className="w-5 h-5" />
                  Contacter
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenant CTA Banner */}
      <section className="py-16 px-6 sm:px-8 lg:px-12 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI0ZGRiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-1">Vous êtes locataire ?</h3>
                <p className="text-white/90 font-semibold">Contactez votre agence pour tout problème dans votre logement</p>
              </div>
            </div>
            <button
              onClick={onShowDemandePublique}
              className="group px-10 py-5 bg-white hover:bg-white/90 text-amber-600 font-black rounded-2xl transition-all shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center gap-4 whitespace-nowrap"
            >
              <Send className="w-5 h-5" />
              Envoyer une demande
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-white via-slate-50 to-white scroll-mt-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-slate-200 rounded-full mb-8 shadow-lg">
              <Star className="w-5 h-5 text-slate-700" />
              <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Fonctionnalités</span>
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 mb-6 tracking-tight">
              Une solution
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                complète
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto font-semibold">
              Tous les outils pour gérer efficacement votre patrimoine
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const isActive = idx === activeFeature;
              return (
                <div
                  key={feature.title}
                  className={`group relative bg-white rounded-3xl p-10 border-2 transition-all duration-700 ${
                    isActive
                      ? `border-transparent shadow-2xl ${feature.shadowColor} -translate-y-4 scale-105`
                      : 'border-slate-200 hover:border-blue-200 hover:shadow-xl hover:-translate-y-2'
                  }`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-3xl`}></div>
                  )}
                  
                  <div className="relative">
                    <div className={`inline-flex p-5 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 ${
                      isActive ? 'shadow-2xl scale-110' : 'shadow-lg'
                    } transition-all duration-500`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-4">
                      {feature.title}
                    </h3>

                    <p className="text-slate-600 leading-relaxed font-semibold text-lg">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 sm:px-8 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center bg-fixed"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-slate-900/95 to-cyan-950/95"></div>
        
        {/* Decorative */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-xl rounded-full text-white text-sm font-black mb-10 border border-white/20 shadow-2xl uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            Gratuit & Sans Engagement
          </div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-8 tracking-tight leading-[1.1]">
            Transformez votre
            <span className="block mt-2">gestion locative</span>
          </h2>

          <p className="text-2xl text-white/90 mb-14 max-w-3xl mx-auto font-semibold leading-relaxed">
            Essayez VOSCLES gratuitement pendant 30 jours.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
            <button
              onClick={onShowInscription}
              className="group px-12 py-6 bg-white hover:bg-white/90 text-blue-600 text-xl font-black rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all inline-flex items-center gap-4"
            >
              <Sparkles className="w-6 h-6" />
              Commencer Gratuitement
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>

            <button
              onClick={onShowLogin}
              className="px-12 py-6 bg-transparent border-2 border-white hover:border-white/80 hover:bg-white/10 text-white text-xl font-black rounded-2xl transition-all"
            >
              J'ai déjà un compte
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              { icon: CheckCircle2, text: 'Suivi Paiements ' },
              { icon: Shield, text: 'Données sécurisées' },
              { icon: Clock, text: 'Support 24/24' }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-white font-black text-lg uppercase tracking-wider">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-slate-950 text-white py-24 px-6 sm:px-8 lg:px-12 scroll-mt-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-2xl shadow-blue-500/30">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-black text-3xl text-white">VOSCLES</p>
                  <p className="text-xs text-slate-400 font-extrabold tracking-[0.2em] uppercase">Gestion Premium</p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed mb-10 max-w-md font-medium text-lg">
                La solution professionnelle complète pour gérer vos biens immobiliers avec efficacité et modernité.
              </p>
              <div className="flex gap-4">
                {[
                  { icon: Mail, label: 'Email' },
                  { icon: PhoneCall, label: 'Téléphone' },
                  { icon: MessageCircle, label: 'Chat' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all hover:scale-110 shadow-lg"
                      title={item.label}
                    >
                      <Icon className="w-6 h-6 text-slate-400 hover:text-white transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-black text-lg mb-8 uppercase tracking-wider">Navigation</h3>
              <ul className="space-y-4">
                {[
                  { label: 'Biens', href: '#biens' },
                  { label: 'Fonctionnalités', href: '#features' },
                  { label: 'Contact', href: '#contact' }
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-slate-400 hover:text-white transition-colors font-semibold inline-flex items-center gap-3 group text-lg"
                    >
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-black text-lg mb-8 uppercase tracking-wider">Contact</h3>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-black uppercase tracking-wider mb-1">Email</p>
                    <a href="mailto:contact@voscles.com" className="text-white hover:text-blue-400 transition-colors font-bold text-lg">
                      contact@voscles.com
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <PhoneCall className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-black uppercase tracking-wider mb-1">Téléphone</p>
                    <a href="tel:+221123456789" className="text-white hover:text-emerald-400 transition-colors font-bold text-lg">
                      +221 12 345 67 89
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-500 text-sm font-semibold">
              © {new Date().getFullYear()} VOSCLES. Tous droits réservés.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Fait avec</span>
              <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
              <span className="text-xs text-slate-500 font-semibold">au Sénégal</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slowZoom {
          from { transform: scale(1); }
          to { transform: scale(1.15); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-slowZoom {
          animation: slowZoom 25s ease-in-out infinite alternate;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}