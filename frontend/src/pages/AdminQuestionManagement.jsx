import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Plus, Edit2, Trash2, UploadCloud, ArrowLeft, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const AdminQuestionManagement = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQ, setCurrentQ] = useState({
    text: '', imageUrl: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', rubric: '', marks: 1
  });
  
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchQuizAndQuestions();
  }, [quizId]);

  const fetchQuizAndQuestions = async () => {
    try {
      const [quizRes, qRes] = await Promise.all([
        api.get(`/quizzes/${quizId}`),
        api.get(`/quizzes/${quizId}/questions`)
      ]);
      setQuiz(quizRes.data.data);
      setQuestions(qRes.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/quizzes/${quizId}/questions`);
      setQuestions(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/questions/${currentQ._id}`, currentQ);
        toast.success('Question updated successfully!');
      } else {
        await api.post(`/quizzes/${quizId}/questions`, currentQ);
        toast.success('Question added successfully!');
      }
      setShowModal(false);
      fetchQuestions();
    } catch (error) {
      toast.error('Failed to save question');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await api.delete(`/questions/${id}`);
        toast.success('Question deleted');
        fetchQuestions();
      } catch (error) {
        toast.error('Failed to delete question');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      await api.post(`/quizzes/${quizId}/questions/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Questions uploaded successfully!');
      fetchQuestions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload questions');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    let data;
    let sheetName;

    if (quiz?.quizType === 'Descriptive') {
      sheetName = 'Descriptive Template';
      data = [
        {
          Question: 'Explain the concept of Object-Oriented Programming.',
          'Image URL': '',
          Rubric: 'encapsulation, inheritance, polymorphism, abstraction',
          Marks: 5
        },
        {
          Question: 'What is a binary search tree?',
          'Image URL': '',
          Rubric: 'sorted nodes, left smaller right larger, O(log n) search',
          Marks: 3
        },
        {
          Question: 'Describe the difference between TCP and UDP.',
          'Image URL': '',
          Rubric: 'connection-oriented, reliability, speed, handshake',
          Marks: 5
        }
      ];
    } else {
      sheetName = 'MCQ Template';
      data = [
        {
          Question: 'What does CPU stand for?',
          'Image URL': '',
          OptionA: 'Central Processing Unit',
          OptionB: 'Central Program Utility',
          OptionC: 'Computer Personal Unit',
          OptionD: 'Central Processor Underlay',
          CorrectAnswer: 'A',
          Marks: 1
        },
        {
          Question: 'Which data structure uses LIFO order?',
          'Image URL': '',
          OptionA: 'Queue',
          OptionB: 'Stack',
          OptionC: 'Array',
          OptionD: 'Linked List',
          CorrectAnswer: 'B',
          Marks: 2
        },
        {
          Question: 'What is the time complexity of binary search?',
          'Image URL': 'https://example.com/binary_search_graph.png',
          OptionA: 'O(n)',
          OptionB: 'O(n²)',
          OptionC: 'O(log n)',
          OptionD: 'O(1)',
          CorrectAnswer: 'C',
          Marks: 3
        }
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-fit column widths
    const colWidths = Object.keys(data[0]).map((key) => ({
      wch: Math.max(key.length, ...data.map((row) => String(row[key] ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const quizTitle = quiz?.title?.replace(/[^a-z0-9]/gi, '_') || 'quiz';
    const fileName = `${quizTitle}_bulk_upload_template.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success('Template downloaded!');
  };

  const openNewModal = () => {
    setIsEditing(false);
    setCurrentQ({ text: '', imageUrl: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', rubric: '', marks: 1 });
    setShowModal(true);
  };

  const openEditModal = (q) => {
    setIsEditing(true);
    setCurrentQ(q);
    setShowModal(true);
  };

  if (loading) return <div className="p-8 text-center">Loading questions...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link to="/admin/quizzes" className="text-blue-600 hover:text-blue-800 flex items-center font-medium">
          <ArrowLeft size={16} className="mr-1" /> Back to Quizzes
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Questions</h1>
          <p className="text-gray-600 mt-1">
            {quiz ? `${quiz.title} (${quiz.quizType === 'Descriptive' ? 'Descriptive / Paragraph' : 'Multiple Choice'})` : 'Loading...'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadTemplate}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm"
          >
            <Download size={20} className="mr-2" /> Download Template
          </button>
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" />
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm disabled:opacity-50"
            >
              <UploadCloud size={20} className="mr-2" /> {uploading ? 'Uploading...' : 'Bulk Upload'}
            </button>
          </div>
          <button 
            onClick={openNewModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm"
          >
            <Plus size={20} className="mr-2" /> Add Manually
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {questions.map((q, idx) => (
            <div key={q._id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-grow pr-4">
                  <div className="flex items-center mb-2">
                    <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded mr-3">Q{idx + 1}</span>
                    <span className="ml-1 text-sm text-gray-500 font-medium">{q.marks} Mark(s)</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {q.text}
                    {q.imageUrl && (
                      <a href={q.imageUrl} target="_blank" rel="noreferrer" className="inline-block ml-2 text-blue-500 hover:text-blue-700" title="View Image">
                        🖼️
                      </a>
                    )}
                  </h3>
                  
                  {quiz?.quizType === 'Descriptive' ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                      <span className="font-semibold block mb-1">AI Evaluation Rubric / Keywords:</span>
                      {q.rubric || <span className="text-gray-400 italic">No rubric provided</span>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className={`p-3 rounded-lg border ${q.correctAnswer === opt ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                          <span className={`font-bold mr-2 ${q.correctAnswer === opt ? 'text-green-700' : 'text-gray-500'}`}>{opt}.</span>
                          <span className={q.correctAnswer === opt ? 'text-green-900 font-medium' : 'text-gray-700'}>{q.options?.[opt]}</span>
                          {q.correctAnswer === opt && <span className="ml-2 text-xs font-bold text-green-600 bg-green-200 px-2 py-0.5 rounded uppercase">Correct</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <button onClick={() => openEditModal(q)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(q._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="p-12 text-center text-gray-500">No questions found. Add manually or upload via CSV/Excel.</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Question' : 'Add Question'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                  <textarea required rows="3" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQ.text} onChange={e => setCurrentQ({...currentQ, text: e.target.value})}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                  <input type="url" placeholder="https://..." className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQ.imageUrl || ''} onChange={e => setCurrentQ({...currentQ, imageUrl: e.target.value})} />
                </div>
                
                {quiz?.quizType === 'Descriptive' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AI Evaluation Rubric / Keywords (Optional)</label>
                    <textarea rows="3" placeholder="Enter keywords or guidelines that the AI should look for when evaluating this answer..." className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQ.rubric} onChange={e => setCurrentQ({...currentQ, rubric: e.target.value})}></textarea>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className="flex items-center">
                          <span className="font-bold text-gray-500 w-8">{opt}.</span>
                          <input type="text" required className="flex-grow border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQ.options?.[opt] || ''} onChange={e => setCurrentQ({...currentQ, options: {...currentQ.options, [opt]: e.target.value}})} />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                        <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white" value={currentQ.correctAnswer} onChange={e => setCurrentQ({...currentQ, correctAnswer: e.target.value})}>
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                        <input type="number" required min="1" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQ.marks} onChange={e => setCurrentQ({...currentQ, marks: e.target.value})} />
                      </div>
                    </div>
                  </>
                )}

                {quiz?.quizType === 'Descriptive' && (
                  <div className="border-t border-gray-100 pt-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                      <input type="number" required min="1" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500" value={currentQ.marks} onChange={e => setCurrentQ({...currentQ, marks: e.target.value})} />
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Question</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestionManagement;
