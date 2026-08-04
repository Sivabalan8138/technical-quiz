import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Plus, Edit2, Trash2, Settings, BookOpen, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Loader } from '../components/Loader';

const AdminQuizManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState({
    title: '', description: '', duration: 30, totalMarks: 100, category: '',
    quizType: 'MCQ', aiEvaluationEnabled: false, wordLimits: { min: 0, max: 1000 }
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await api.get('/quizzes');
      setQuizzes(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Ensure numeric fields are actually numbers
    const payload = {
      ...currentQuiz,
      duration: parseInt(currentQuiz.duration) || 0,
      totalMarks: parseInt(currentQuiz.totalMarks) || 0,
    };

    try {
      if (isEditing) {
        await api.put(`/quizzes/${currentQuiz._id}`, payload);
        toast.success('Quiz updated successfully');
      } else {
        await api.post('/quizzes', payload);
        toast.success('Quiz created successfully');
      }
      setShowModal(false);
      fetchQuizzes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save quiz');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await api.delete(`/quizzes/${id}`);
        toast.success('Quiz deleted successfully');
        fetchQuizzes();
      } catch (error) {
        toast.error('Failed to delete quiz');
      }
    }
  };

  const openNewModal = () => {
    setIsEditing(false);
    setCurrentQuiz({ title: '', description: '', duration: 30, totalMarks: 100, category: '', quizType: 'MCQ', aiEvaluationEnabled: false, wordLimits: { min: 0, max: 1000 } });
    setShowModal(true);
  };

  const openEditModal = (quiz) => {
    setIsEditing(true);
    setCurrentQuiz(quiz);
    setShowModal(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage your quizzes</p>
        </div>
        <button 
          onClick={openNewModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm"
        >
          <Plus size={20} className="mr-2" /> Create New Quiz
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quiz Info</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Settings</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {quizzes.map((quiz) => (
              <tr key={quiz._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900">{quiz.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{quiz.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 mr-2">
                    {quiz.category}
                  </span>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${quiz.quizType === 'Descriptive' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                    {quiz.quizType || 'MCQ'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-col">
                    <span>{quiz.duration} mins</span>
                    <span className="text-xs">Total: {quiz.totalMarks} marks</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <Link to={`/admin/quizzes/${quiz._id}/results`} className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-lg" title="View Results & Analytics">
                      <BarChart2 size={18} />
                    </Link>
                    <Link to={`/admin/quizzes/${quiz._id}/questions`} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-lg" title="Manage Questions">
                      <Settings size={18} />
                    </Link>
                    <button onClick={() => openEditModal(quiz)} className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-lg" title="Edit Quiz">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(quiz._id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg" title="Delete Quiz">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {quizzes.length === 0 && (
              <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No quizzes found. Create one to get started!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Quiz' : 'Create New Quiz'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quiz Title</label>
                  <input type="text" required className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQuiz.title} onChange={e => setCurrentQuiz({...currentQuiz, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea required rows="3" className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQuiz.description} onChange={e => setCurrentQuiz({...currentQuiz, description: e.target.value})}></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <input type="text" required className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQuiz.category} onChange={e => setCurrentQuiz({...currentQuiz, category: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes)</label>
                    <input type="number" required min="1" className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQuiz.duration} onChange={e => setCurrentQuiz({...currentQuiz, duration: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Marks</label>
                    <input type="number" required min="1" className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQuiz.totalMarks} onChange={e => setCurrentQuiz({...currentQuiz, totalMarks: e.target.value})} />
                  </div>

                </div>
                
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                  <h3 className="text-md font-bold text-gray-900 dark:text-white mb-3">Advanced Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quiz Type</label>
                      <select 
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" 
                        value={currentQuiz.quizType} 
                        onChange={e => setCurrentQuiz({...currentQuiz, quizType: e.target.value})}
                      >
                        <option value="MCQ">Multiple Choice (MCQ)</option>
                        <option value="Descriptive">Descriptive / Paragraph</option>
                      </select>
                    </div>
                    {currentQuiz.quizType === 'Descriptive' && (
                      <div className="flex items-center mt-6">
                        <input 
                          type="checkbox" 
                          id="aiEval" 
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={currentQuiz.aiEvaluationEnabled}
                          onChange={e => setCurrentQuiz({...currentQuiz, aiEvaluationEnabled: e.target.checked})}
                        />
                        <label htmlFor="aiEval" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Enable AI Evaluation</label>
                      </div>
                    )}
                  </div>

                  {currentQuiz.quizType === 'Descriptive' && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Words per Question</label>
                        <input type="number" min="0" className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQuiz.wordLimits?.min || 0} onChange={e => setCurrentQuiz({...currentQuiz, wordLimits: {...currentQuiz.wordLimits, min: parseInt(e.target.value)}})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Words per Question</label>
                        <input type="number" min="1" className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQuiz.wordLimits?.max || 1000} onChange={e => setCurrentQuiz({...currentQuiz, wordLimits: {...currentQuiz.wordLimits, max: parseInt(e.target.value)}})} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Quiz</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizManagement;
