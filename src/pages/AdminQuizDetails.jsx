import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Download, BarChart2, Users, ArrowLeft, Award, Clock, AlertCircle } from 'lucide-react';

const AdminQuizDetails = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('results'); // 'results' or 'analytics'
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    fetchData();
  }, [quizId]);

  const fetchData = async () => {
    try {
      const [quizRes, resData, anData] = await Promise.all([
        api.get(`/quiz-detail?id=${quizId}`),
        api.get(`/admin?action=quiz-results&quizId=${quizId}`),
        api.get(`/admin?action=quiz-analytics&quizId=${quizId}`)
      ]);
      setQuiz(quizRes.data.data);
      setResults(resData.data.data);
      setAnalytics(anData.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (results.length === 0) return alert('No results to export.');

    const exportData = results.map((r, idx) => ({
      'S.No': idx + 1,
      'Name': r.user.name,
      'Register Number': r.user.registerNumber || 'N/A',
      'Year': r.user.year || 'N/A',
      'Department': r.user.department || 'N/A',
      'Mark Scored': r.score
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Auto-fit column widths
    const colWidths = Object.keys(exportData[0]).map((key) => ({
      wch: Math.max(key.length, ...exportData.map((row) => String(row[key] ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    const quizTitle = quiz?.title?.replace(/[^a-z0-9]/gi, '_') || 'quiz';
    XLSX.writeFile(workbook, `${quizTitle}_Results.xlsx`);
  };

  const exportToPDF = () => {
    if (results.length === 0) return alert('No results to export.');

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${quiz?.title || 'Quiz'} - Results Report`, 14, 15);

    const tableColumn = ['S.No', 'Name', 'Register Number', 'Year', 'Department', 'Mark Scored'];
    const tableRows = results.map((r, idx) => [
      idx + 1,
      r.user.name,
      r.user.registerNumber || 'N/A',
      r.user.year || 'N/A',
      r.user.department || 'N/A',
      r.score
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 22,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    const quizTitle = quiz?.title?.replace(/[^a-z0-9]/gi, '_') || 'quiz';
    doc.save(`${quizTitle}_Results.pdf`);
  };

  if (loading) return <div className="p-8 text-center">Loading details...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/admin/quizzes" className="text-blue-600 hover:text-blue-800 flex items-center font-medium">
          <ArrowLeft size={16} className="mr-1" /> Back to Quizzes
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Analytics & Results</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{quiz ? quiz.title : 'Loading...'}</p>
        </div>
        <div className="flex space-x-3 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setView('results')}
            className={`px-4 py-2 rounded-md font-medium flex items-center transition-colors ${view === 'results' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <Users size={18} className="mr-2" /> Results Table
          </button>
          <button 
            onClick={() => setView('analytics')}
            className={`px-4 py-2 rounded-md font-medium flex items-center transition-colors ${view === 'analytics' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-100' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <BarChart2 size={18} className="mr-2" /> Analytics
          </button>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Registrations</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics.totalRegistrations || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Completed Tests</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.totalSubmissions || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Average Score</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{analytics.averageScore || 0}</p>
          </div>
        </div>
      )}

      {view === 'results' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h2 className="font-bold text-gray-800 dark:text-white">Student Submissions ({results.length})</h2>
            <div className="flex space-x-2">
              <button onClick={exportToExcel} className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors">
                <Download size={14} className="mr-1" /> Excel
              </button>
              <button onClick={exportToPDF} className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors">
                <Download size={14} className="mr-1" /> PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reg No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dept</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Score</th>
                  {quiz?.quizType === 'MCQ' && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Correct/Wrong</th>
                  )}
                  {quiz?.quizType === 'Descriptive' && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">AI Feedback</th>
                  )}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 font-bold">
                        #{r.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{r.user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{r.user.registerNumber || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{r.user.year || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{r.user.department || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="font-bold text-gray-900 dark:text-white">{r.score}</div>
                      <div className={`text-xs font-medium ${r.percentage >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{r.percentage}%</div>
                    </td>
                    {quiz?.quizType === 'MCQ' && (
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <span className="text-green-600 dark:text-green-400 font-medium">{r.correctAnswers}</span> / <span className="text-red-600 dark:text-red-400 font-medium">{r.wrongAnswers}</span>
                      </td>
                    )}
                    {quiz?.quizType === 'Descriptive' && (
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {r.aiFeedback ? (
                          <button onClick={() => setSelectedFeedback({ user: r.user.name, feedback: r.aiFeedback })} className="text-blue-600 dark:text-blue-400 hover:underline">
                            View Report
                          </button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                      <Clock size={14} className="mr-1" /> {Math.floor(r.timeTaken/60)}m {r.timeTaken%60}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(r.completedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No submissions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center">
              <Award className="text-yellow-500 mb-2" size={32} />
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-medium">Highest Score</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.highestScore || 0}</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center">
              <BarChart2 className="text-blue-500 mb-2" size={32} />
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-medium">Average Score</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.averageScore || 0}</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center">
              <AlertCircle className="text-red-500 mb-2" size={32} />
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-medium">Lowest Score</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.lowestScore || 0}</h3>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Question-wise Analysis</h3>
            {analytics.questionStats && Object.keys(analytics.questionStats).length > 0 ? (
              <div className="space-y-4">
                {Object.keys(analytics.questionStats).map((qId, index) => {
                  const stat = analytics.questionStats[qId];
                  const total = stat.correct + stat.wrong;
                  const correctPct = Math.round((stat.correct / total) * 100) || 0;
                  return (
                    <div key={qId} className="flex flex-col">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Question {index + 1}</span>
                        <span>{correctPct}% Correct</span>
                      </div>
                      <div className="w-full h-3 flex rounded-full overflow-hidden">
                        <div style={{ width: `${correctPct}%` }} className="bg-green-500"></div>
                        <div style={{ width: `${100 - correctPct}%` }} className="bg-red-500"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No analysis data available yet.</p>
            )}
          </div>
        </div>
      )}

      {/* AI Feedback Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Report: {selectedFeedback.user}</h2>
              <button onClick={() => setSelectedFeedback(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Concept</div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedFeedback.feedback.conceptUnderstanding}/10</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Technical</div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedFeedback.feedback.technicalAccuracy}/10</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Logic</div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedFeedback.feedback.logicalExplanation}/10</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Grammar</div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedFeedback.feedback.grammar}/10</div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-green-700 dark:text-green-400 mb-2 border-b border-green-100 dark:border-gray-700 pb-1">Strengths</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {selectedFeedback.feedback.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-orange-700 dark:text-orange-400 mb-2 border-b border-orange-100 dark:border-gray-700 pb-1">Areas for Improvement</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {selectedFeedback.feedback.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizDetails;
