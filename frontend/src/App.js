import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext } from './context/AuthContext';
import BilloraLandingPage from './pages/BilloraLandingPage';
import ClassDetailsPage from './pages/ClassDetailsPage';
import DashboardLayout from './pages/DashboardLayout';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SignUpPage from './pages/SignUpPage';
import AmountView from './pages/views/AmountView';
import ClassesView from './pages/views/ClassesView';
import PayFeeView from './pages/views/PayFeeView';
import RegisterView from './pages/views/RegisterView';
import ViewFeeHistory from './pages/views/ViewFeeHistory';

function App() {
  const { user } = React.useContext(AuthContext);
  const isPrincipal = user?.role === 'principal';
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<BilloraLandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute />}>
            <Route path="" element={<DashboardLayout />}>
              <Route index element={<Navigate to="classes" replace />} />
              <Route path="classes" element={<ClassesView />} />
              <Route path="classes/:classId" element={<ClassDetailsPage />} />
              <Route path="amount" element={<AmountView />} />
              <Route path="register" element={<RegisterView />} />
              <Route path="payfee" element={<PayFeeView />} />
              <Route path="viewfeehistory" element={<ViewFeeHistory />} />
            </Route>
          </Route>

        </Routes>
      </div>
    </Router>
  );
}

export default App;
