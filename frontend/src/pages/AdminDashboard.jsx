import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Users, FileText, HelpCircle, CheckCircle, Plus, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader } from '../components/Loader';



const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalQuizzes: 0,
    totalQuestions: 0,
    completedTests: 0,
    recentActivity: [],
    submissionTrends: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data.data);
      } catch (error) {
        console.error('Error fetching admin stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your Technical Quiz platform</p>
        </div>
        <Link 
          to="/admin/quizzes"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm"
        >
          <Plus size={20} className="mr-2" /> Manage Quizzes
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stat Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mr-4">
            <Users className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg mr-4">
            <FileText className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Quizzes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalQuizzes}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg mr-4">
            <HelpCircle className="text-purple-600 dark:text-purple-400" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Questions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalQuestions}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex items-center">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg mr-4">
            <CheckCircle className="text-yellow-600 dark:text-yellow-400" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Tests</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedTests}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area - Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Submission Trends</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.submissionTrends && stats.submissionTrends.length > 0 ? stats.submissionTrends : [{ name: 'No Data', submissions: 0 }]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#e5e7eb', strokeWidth: 2, strokeDasharray: '3 3' }}
                  />
                  <Line type="monotone" dataKey="submissions" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity Sidebar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center">
              <Activity className="mr-2 text-blue-500" size={20} />
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white mr-2">
                      {activity.user.name} {activity.user.registerNumber ? `(${activity.user.registerNumber})` : ''}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">completed</span>
                  </div>
                  <div className="font-medium text-blue-600 dark:text-blue-400 mb-2">{activity.quiz.title}</div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={`font-bold ${activity.percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                      Score: {activity.score} ({activity.percentage}%)
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">
                      {new Date(activity.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No recent activity found.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
