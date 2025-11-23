import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Dashboard from './components/Dashboard';
import SmartInputSheet from './components/SmartInputSheet';
import TabBar from './components/UI/TabBar';
import ChatInterface from './components/Chat/ChatInterface';
import SettingsPage from './components/Settings/SettingsPage';
import GroupsPage from './components/Groups/GroupsPage';
import GroupView from './components/Groups/GroupView';
import FamilyView from './components/Family/FamilyView';
import AnalyticsView from './components/Analytics/AnalyticsView';
import { Transaction, TransactionType, User } from './types';
import { authApi, transactionsApi, TransactionPayload } from './services/api';
import { useMonthlyTransactions } from './hooks/useMonthlyTransactions';

import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

type AuthMode = 'login' | 'register';

const App: React.FC = () => {
  const [showSmartInput, setShowSmartInput] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [budget, setBudget] = useState(0);

  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.me,
    retry: false,
  });

  useEffect(() => {
    if (currentUser) {
      setUser({
        id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        budget: currentUser.budget,
      });
      setBudget(currentUser.budget ?? 0);
      setAuthError(null);
    } else if (!userLoading) {
      setUser(null);
      setBudget(0);
    }
  }, [currentUser, userLoading]);

  const {
    transactions,
    currentDate,
    isLoading: transactionsLoading,
    isError: transactionsError,
    fetchNextPage,
    hasNextPage,
    goToPreviousMonth,
    goToNextMonth,
    refetch: refreshTransactions
  } = useMonthlyTransactions(user?.id);

  const authMutation = useMutation({
    mutationFn: async () => {
      if (authMode === 'login') {
        return authApi.login({ email: authForm.email.trim(), password: authForm.password });
      }
      return authApi.register({
        name: authForm.name.trim(),
        email: authForm.email.trim(),
        password: authForm.password,
      });
    },
    onSuccess: (data) => {
      setUser({
        id: data._id,
        name: data.name,
        email: data.email,
        budget: data.budget,
      });
      setBudget(data.budget ?? 0);
      setAuthError(null);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      refreshTransactions();
    },
    onError: () => {
      setAuthError('Authentication failed. Please double-check your details.');
    },
  });

  const transactionMutation = useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: () => {
      setTransactionError(null);
      setShowSmartInput(false);
      // setActiveTab('home'); // Navigation handled by user or separate logic
      // Invalidate all relevant queries to ensure UI updates immediately
      queryClient.invalidateQueries({ queryKey: ['monthlyStats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      refreshTransactions();
    },
    onError: () => {
      setTransactionError('Could not save the transaction. Please try again.');
    },
  });

  const validateAuthForm = (): string | null => {
    if (!authForm.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return 'Enter a valid email address.';
    }
    if (authForm.password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (authMode === 'register' && authForm.name.trim().length < 2) {
      return 'Name must be at least 2 characters.';
    }
    return null;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationMessage = validateAuthForm();
    if (validationMessage) {
      setAuthError(validationMessage);
      return;
    }
    authMutation.mutate();
  };

  const handleLogout = async () => {
    await authApi.logout();
    setUser(null);
    setBudget(0);
    queryClient.removeQueries({ queryKey: ['transactions'] });
    queryClient.removeQueries({ queryKey: ['currentUser'] });
  };

  const handleAddTransaction = async (payload: TransactionPayload) => {
    await transactionMutation.mutateAsync(payload);
  };



  const handleAddClick = () => {
    setShowSmartInput(true);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] text-gray-900 font-sans selection:bg-primary selection:text-white flex items-center justify-center">
        <p className="text-sm text-gray-500 animate-pulse">Checking your session...</p>
      </div>
    );
  }

  const showAuthForm = !user;

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-gray-900 font-sans selection:bg-primary selection:text-white">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden">
        {!showAuthForm ? (
          <>
            {location.pathname !== '/chat' && location.pathname !== '/settings' && ( // Exclude header for chat and settings
              <header className="px-6 py-4 flex justify-between items-center border-b border-gray-200 bg-white/70 backdrop-blur-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Welcome back</p>
                  <h1 className="font-bold text-lg text-gray-900">{user?.name}</h1>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-primary hover:text-blue-700 transition-colors"
                >
                  Logout
                </button>
              </header>
            )}
            <main className="h-full pb-32">

              <Routes>
                <Route path="/" element={
                  <div className="animate-[fadeIn_0.3s_ease-out]">
                    {transactionsLoading && transactions.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">Loading your wallet...</div>
                    ) : transactionsError ? (
                      <div className="p-6 text-center flex flex-col items-center gap-2">
                        <p className="text-red-500">Could not load transactions.</p>
                        <button
                          onClick={() => refreshTransactions()}
                          className="px-4 py-2 bg-white rounded-xl text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <Dashboard
                        transactions={transactions}
                        budget={budget}
                        user={user}
                        currentDate={currentDate}
                        onPrevMonth={goToPreviousMonth}
                        onNextMonth={goToNextMonth}
                        onLoadMore={fetchNextPage}
                        hasMore={hasNextPage}
                        onSettingsClick={() => navigate('/settings')}
                      />
                    )}
                  </div>
                } />

                <Route path="/chat" element={
                  <div className="animate-[fadeIn_0.3s_ease-out]">
                    <ChatInterface
                      transactions={transactions}
                      budget={budget}
                      onAddTransaction={refreshTransactions}
                    />
                  </div>
                } />

                <Route path="/analytics" element={
                  <div className="animate-[fadeIn_0.3s_ease-out]">
                    <AnalyticsView transactions={transactions} />
                  </div>
                } />

                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/:id" element={<GroupView />} />
                <Route path="/settings" element={
                  <div className="animate-[fadeIn_0.3s_ease-out]">
                    <SettingsPage
                      user={user}
                      onLogout={handleLogout}
                      onBack={() => { }} // Will be handled by internal navigation
                    />
                  </div>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <SmartInputSheet
              isOpen={showSmartInput}
              onClose={() => setShowSmartInput(false)}
              onTransactionAdded={handleAddTransaction}
              isSubmitting={transactionMutation.isPending}
              submitError={transactionError}
            />

            <TabBar
              onAddClick={handleAddClick}
            />
          </>
        ) : (
          <div className="min-h-screen flex items-center justify-center p-6">
            <form
              onSubmit={handleAuthSubmit}
              className="bg-white w-full rounded-3xl p-8 shadow-xl space-y-6"
            >
              <div className="text-center space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  {authMode === 'login' ? 'Login' : 'Create Account'}
                </p>
                <h1 className="text-2xl font-bold text-gray-900">
                  {authMode === 'login' ? 'Welcome to Hasala' : 'Join Hasala'}
                </h1>
                <p className="text-sm text-gray-500">
                  Frictionless money tracking built for Egyptian students.
                </p>
              </div>

              {authMode === 'register' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Youssef Hassan"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="student@university.edu"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Minimum 6 characters"
                />
              </div>

              {authError && (
                <p className="text-sm text-red-500 bg-red-50 rounded-2xl px-4 py-2">{authError}</p>
              )}

              <button
                type="submit"
                disabled={authMutation.isPending}
                className="w-full py-4 rounded-2xl bg-primary text-white font-semibold shadow-lg shadow-primary/30 hover:bg-blue-600 transition disabled:opacity-60"
              >
                {authMutation.isPending
                  ? 'Just a sec...'
                  : authMode === 'login'
                    ? 'Log into Hasala'
                    : 'Create Account'}
              </button>

              <p className="text-xs text-center text-gray-500">
                {authMode === 'login' ? (
                  <>
                    No account yet?{' '}
                    <button
                      type="button"
                      className="text-primary font-semibold"
                      onClick={() => {
                        setAuthMode('register');
                        setAuthError(null);
                      }}
                    >
                      Register
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="text-primary font-semibold"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError(null);
                      }}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;