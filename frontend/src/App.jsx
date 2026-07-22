import { Routes, Route, Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import PlanningPage from './pages/PlanningPage';
import ReportPage from './pages/ReportPage';
import GrowthPage from './pages/GrowthPage';
import Layout from './components/Layout';

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
      <h1 className="text-2xl font-bold text-gray-800 mb-2">页面未找到</h1>
      <p className="text-gray-500 mb-6">你访问的页面不存在</p>
      <Link to="/" className="btn-primary inline-flex items-center gap-2">
        <Home className="w-4 h-4" />
        返回首页
      </Link>
    </div>
  );
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/report/:planId" element={<ReportPage />} />
        <Route path="/growth" element={<GrowthPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
