import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, BrainCircuit, Trophy, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { Loader } from '../components/Loader';

const Home = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await api.get('/quizzes');
        setQuizzes(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch quizzes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 pb-20">
      
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center space-y-8 pt-20 pb-12">
        <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-sm mb-4 animate-bounce">
          The ultimate technical assessment platform
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Master Your Skills with <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Technical Quiz
          </span>
        </h1>
        
        <p className="text-xl text-slate-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Challenge yourself with high-quality technical quizzes, track your progress, and prove your expertise in various domains.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link to="/admin/login" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 font-semibold rounded-xl border border-slate-200 dark:border-gray-700 transition-all shadow-sm">
            Admin Portal
          </Link>
        </div>
      </div>

      {/* Available Quizzes Section */}
      <div className="max-w-6xl mx-auto w-full pt-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Available Quizzes</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Select a quiz below to enter your details and begin.</p>
        </div>

        {loading ? (
          <Loader />
        ) : quizzes.length === 0 ? (
          <div className="text-center p-12 glass-effect rounded-2xl">
            <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400">No active quizzes found.</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="glass-effect rounded-2xl p-6 flex flex-col h-full transform hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">{quiz.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    quiz.quizType === 'Descriptive' 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {quiz.quizType}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-grow line-clamp-3">
                  {quiz.description || "Test your knowledge in this comprehensive quiz."}
                </p>
                
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center"><BrainCircuit className="w-4 h-4 mr-1"/> {quiz.totalMarks} Marks</span>
                    <span className="flex items-center"><Trophy className="w-4 h-4 mr-1"/> {quiz.duration} mins</span>
                  </div>
                  
                  <Link 
                    to={`/quiz/${quiz._id}/register`}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-center font-semibold transition-colors flex justify-center items-center group"
                  >
                    Start Test
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
