import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import CandidateForm from './pages/CandidateForm';
import AdminLogin from './pages/AdminLogin';

import AdminDashboard from './pages/AdminDashboard';
import AdminQuizManagement from './pages/AdminQuizManagement';
import AdminQuestionManagement from './pages/AdminQuestionManagement';
import AdminQuizDetails from './pages/AdminQuizDetails';
import QuizTakingInterface from './pages/QuizTakingInterface';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-900 transition-colors duration-200">
              <Toaster position="top-right" />
              <Navbar />
              <main className="flex-grow">
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Navigate to="/admin/login" replace />} />
                <Route path="/quiz/:quizId/register" element={<CandidateForm />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                

                <Route path="/quiz/:quizId" element={
                  <ProtectedRoute><QuizTakingInterface /></ProtectedRoute>
                } />
                
                {/* Protected Admin Routes */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>
                } />
                <Route path="/admin/quizzes" element={
                  <ProtectedRoute requireAdmin={true}><AdminQuizManagement /></ProtectedRoute>
                } />
                <Route path="/admin/quizzes/:quizId/questions" element={
                  <ProtectedRoute requireAdmin={true}><AdminQuestionManagement /></ProtectedRoute>
                } />
                <Route path="/admin/quizzes/:quizId/results" element={
                  <ProtectedRoute requireAdmin={true}><AdminQuizDetails /></ProtectedRoute>
                } />
                
                {/* Catch-all route to redirect unmatched paths to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
