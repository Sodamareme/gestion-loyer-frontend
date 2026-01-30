import { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Save } from 'lucide-react';

interface ProfileSettingsProps {
  user: any;
  onClose?: () => void;
}

export default function ProfileSettings({ user, onClose }: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'password'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // États pour changement d'email
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [currentPasswordEmail, setCurrentPasswordEmail] = useState('');

  // États pour changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibilité des mots de passe
  const [showCurrentPasswordEmail, setShowCurrentPasswordEmail] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validation
      if (!newEmail || !confirmEmail || !currentPasswordEmail) {
        throw new Error('Veuillez remplir tous les champs');
      }

      if (newEmail !== confirmEmail) {
        throw new Error('Les emails ne correspondent pas');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        throw new Error('Email invalide');
      }

      if (newEmail === user.email) {
        throw new Error('Le nouvel email est identique à l\'ancien');
      }

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Session expirée');

      const response = await fetch('http://localhost:3000/api/auth/change-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newEmail,
          currentPassword: currentPasswordEmail
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement d\'email');
      }

      setMessage({ type: 'success', text: '✅ Email changé avec succès ! Veuillez vous reconnecter.' });
      
      // Réinitialiser le formulaire
      setNewEmail('');
      setConfirmEmail('');
      setCurrentPasswordEmail('');

      // Déconnexion après 3 secondes
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.reload();
      }, 3000);

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Veuillez remplir tous les champs');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Les nouveaux mots de passe ne correspondent pas');
      }

      if (newPassword.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      if (currentPassword === newPassword) {
        throw new Error('Le nouveau mot de passe doit être différent de l\'ancien');
      }

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Session expirée');

      const response = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }

      setMessage({ type: 'success', text: '✅ Mot de passe changé avec succès !' });
      
      // Réinitialiser le formulaire
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setMessage(null), 5000);

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-slate-200/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Mon Profil</h2>
            <p className="text-sm text-slate-600">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Message de succès/erreur */}
      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 mb-6 ${
          message.type === 'success'
            ? 'bg-green-50 border-2 border-green-200'
            : 'bg-red-50 border-2 border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className={`font-medium ${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message.text}
          </span>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b-2 border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all font-semibold ${
            activeTab === 'email'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-5 h-5" />
          Changer l'email
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all font-semibold ${
            activeTab === 'password'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-5 h-5" />
          Changer le mot de passe
        </button>
      </div>

      {/* Formulaire changement d'email */}
      {activeTab === 'email' && (
        <form onSubmit={handleChangeEmail} className="space-y-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
            <p className="text-sm text-blue-800 font-medium">
              ⚠️ Après avoir changé votre email, vous serez déconnecté et devrez vous reconnecter avec votre nouvel email.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Email actuel
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl bg-slate-100 text-slate-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nouvel email *
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nouveau@email.com"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Confirmer le nouvel email *
            </label>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="nouveau@email.com"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Mot de passe actuel *
            </label>
            <div className="relative">
              <input
                type={showCurrentPasswordEmail ? 'text' : 'password'}
                value={currentPasswordEmail}
                onChange={(e) => setCurrentPasswordEmail(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPasswordEmail(!showCurrentPasswordEmail)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPasswordEmail ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Modification en cours...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Changer l'email
              </>
            )}
          </button>
        </form>
      )}

      {/* Formulaire changement de mot de passe */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
            <p className="text-sm text-blue-800 font-medium">
              🔒 Le mot de passe doit contenir au moins 6 caractères.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Mot de passe actuel *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Votre mot de passe actuel"
                className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nouveau mot de passe *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Confirmer le nouveau mot de passe *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le nouveau mot de passe"
                className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Modification en cours...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Changer le mot de passe
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}