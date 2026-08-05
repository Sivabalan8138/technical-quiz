import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '../components/RichTextEditor';

const QuizTakingInterface = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // State for quiz taking
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOptionKey }
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { score, percentage }

  // Fetch quiz and questions
  useEffect(() => {
    const initQuiz = async () => {
      try {
        const [quizRes, qRes] = await Promise.all([
          api.get(`/quiz-detail?id=${quizId}`),
          api.get(`/questions?quizId=${quizId}`)
        ]);
        
        setQuiz(quizRes.data.data);
        
        // Randomize questions
        const shuffledQs = [...qRes.data.data].sort(() => Math.random() - 0.5);
        
        // Randomize options for each question
        const randomizedQs = shuffledQs.map(q => {
          const optionsKeys = ['A', 'B', 'C', 'D'];
          const shuffledKeys = [...optionsKeys].sort(() => Math.random() - 0.5);
          
          const newOptions = {};
          const mapping = {}; // Maps the new key (A, B, C, D) to the original key
          
          shuffledKeys.forEach((origKey, idx) => {
            const newKey = optionsKeys[idx];
            newOptions[newKey] = q.options[origKey];
            mapping[newKey] = origKey;
          });
          
          return { ...q, displayOptions: newOptions, optionMapping: mapping };
        });
        
        setQuestions(randomizedQs);
        
        // Load draft answers from localStorage
        const savedDrafts = localStorage.getItem(`quiz_draft_${quizId}`);
        if (savedDrafts) {
          try {
            setAnswers(JSON.parse(savedDrafts));
          } catch (e) {
            console.error('Failed to parse drafts', e);
          }
        }
        
        // Initialize timer (duration is in minutes)
        setTimeLeft(quizRes.data.data.duration * 60);
      } catch (error) {
        console.error("Error loading quiz", error);
        toast.error("Failed to load quiz.");
        navigate('/');
      }
    };
    initQuiz();
  }, [quizId, navigate]);

  // Auto-save drafts
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`quiz_draft_${quizId}`, JSON.stringify(answers));
    }
  }, [answers, quizId]);

  // Anti-cheat: Disable right click
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error('Right click is disabled during the quiz.');
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Anti-cheat: Warn on tab change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !result) {
        toast.error('WARNING: Tab switching is strictly prohibited! Your quiz may be auto-submitted if you continue.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [result]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      if (quiz && !result && !isSubmitting) {
        handleSubmitQuiz();
      }
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, quiz, result, isSubmitting, handleSubmitQuiz]);

  const handleOptionSelect = (questionId, selectedKeyOrText) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedKeyOrText
    }));
  };

  const toggleReviewMark = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
      } else {
        newSet.add(currentQuestionIndex);
      }
      return newSet;
    });
  };

  const handleSubmitQuiz = useCallback(async () => {
    // Validate Word Limits for Descriptive Quizzes
    if (quiz?.quizType === 'Descriptive' && quiz?.wordLimits) {
      const min = quiz.wordLimits.min || 0;
      for (const q of questions) {
        const answer = answers[q._id] || '';
        const wordCount = answer.trim().split(/\s+/).filter(word => word.length > 0).length;
        if (wordCount < min) {
          toast.error(`Question requires at least ${min} words. Please review your answers.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    
    // Reverse map the selected options back to their original keys (A, B, C, D)
    // so the backend can grade them properly (only for MCQ)
    const mappedAnswers = {};
    if (quiz?.quizType === 'Descriptive') {
      // For descriptive, just pass the raw text HTML
      Object.keys(answers).forEach(qId => {
        mappedAnswers[qId] = answers[qId];
      });
    } else {
      Object.keys(answers).forEach(qId => {
        const question = questions.find(q => q._id === qId);
        if (question) {
          const displayedKey = answers[qId];
          const originalKey = question.optionMapping[displayedKey];
          mappedAnswers[qId] = originalKey;
        }
      });
    }

    const timeTaken = (quiz.duration * 60) - timeLeft;

    try {
      const res = await api.post(`/quiz-submit?id=${quizId}`, { 
        answers: mappedAnswers,
        timeTaken
      });
      
      // Clear drafts on successful submit
      localStorage.removeItem(`quiz_draft_${quizId}`);
      
      toast.success('Your quiz has been submitted successfully.');
      setResult({
        message: res.data.data.message || 'Your quiz has been submitted successfully.',
        score: res.data.data.score,
        percentage: res.data.data.percentage
      });
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, questions, quizId]);

  if (!quiz || questions.length === 0) return <div className="p-8 text-center">Loading quiz interface...</div>;

  // Result View (Post-submission)
  if (result) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center border-t-4 border-green-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-green-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
          <p className="text-lg text-gray-700 font-medium">{result.message}</p>
          <div className="mt-8">
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Quiz View
  const currentQuestion = questions[currentQuestionIndex];
  
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).filter(k => !!answers[k]).length;
  const progressPercent = (answeredCount / questions.length) * 100;

  // Calculate word count for current descriptive question
  const currentAnswer = answers[currentQuestion._id] || '';
  // Strip HTML tags for accurate word count
  const plainText = currentAnswer.replace(/<[^>]+>/g, ' ').trim();
  const currentWordCount = plainText.length > 0 ? plainText.split(/\s+/).length : 0;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col">
      {/* Quiz Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{quiz.title}</h1>
            <div className="w-64 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
          
          <div className={`flex items-center px-4 py-2 rounded-lg font-bold text-lg border-2 ${timeLeft < 300 ? 'border-red-500 text-red-600 bg-red-50 animate-pulse' : 'border-blue-200 text-blue-800 bg-blue-50'}`}>
            <Clock className="mr-2" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex-grow flex flex-col lg:flex-row gap-6 w-full">
        
        {/* Main Question Area */}
        <div className="flex-grow flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 flex-grow">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</h2>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                {currentQuestion.marks} Mark(s)
              </span>
            </div>
            
            <p className="text-xl text-gray-900 font-medium mb-6 leading-relaxed">
              {currentQuestion.text}
            </p>
            
            {currentQuestion.imageUrl && (
              <div className="mb-8 flex justify-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <img 
                  src={currentQuestion.imageUrl} 
                  alt="Question Attachment" 
                  className="max-h-96 object-contain rounded-lg shadow-sm"
                />
              </div>
            )}
            
            {quiz.quizType === 'Descriptive' ? (
              <div className="flex flex-col h-full mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Your Answer:</span>
                  <div className={`text-sm font-medium ${
                    quiz.wordLimits?.min && currentWordCount < quiz.wordLimits.min 
                      ? 'text-red-500' 
                      : quiz.wordLimits?.max && currentWordCount > quiz.wordLimits.max
                      ? 'text-red-500'
                      : 'text-gray-500'
                  }`}>
                    Word Count: {currentWordCount} 
                    {quiz.wordLimits?.min > 0 && ` / Min: ${quiz.wordLimits.min}`}
                    {quiz.wordLimits?.max > 0 && ` / Max: ${quiz.wordLimits.max}`}
                  </div>
                </div>
                <RichTextEditor 
                  value={answers[currentQuestion._id] || ''}
                  onChange={(val) => handleOptionSelect(currentQuestion._id, val)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {['A', 'B', 'C', 'D'].map(key => (
                  <label 
                    key={key}
                    className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[currentQuestion._id] === key 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                        answers[currentQuestion._id] === key ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {answers[currentQuestion._id] === key && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-lg text-gray-800">{currentQuestion.displayOptions[key]}</span>
                    </div>
                    <input 
                      type="radio" 
                      name="option" 
                      className="hidden" 
                      checked={answers[currentQuestion._id] === key}
                      onChange={() => handleOptionSelect(currentQuestion._id, key)}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
          
          {/* Action Bar */}
          <div className="bg-gray-50 p-4 border-t border-gray-200 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-2">
              <button 
                onClick={toggleReviewMark}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  markedForReview.has(currentQuestionIndex) 
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <AlertTriangle size={18} className="mr-2" />
                {markedForReview.has(currentQuestionIndex) ? 'Unmark Review' : 'Mark for Review'}
              </button>
              
              <button 
                onClick={() => {
                  // Simply moving next leaves it unanswered (skipped)
                  if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                  }
                }}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Clear / Skip
              </button>
            </div>
            
            <div className="flex gap-3">
              <button 
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={20} /> Previous
              </button>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <button 
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Next <ChevronRight size={20} />
                </button>
              ) : (
                <button 
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="flex items-center px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md font-bold"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col h-max">
          <h3 className="font-bold text-gray-800 mb-4">Question Palette</h3>
          
          <div className="grid grid-cols-5 gap-2 mb-6">
            {questions.map((q, idx) => {
              let statusClass = "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"; // Unanswered
              
              if (answers[q._id]) {
                statusClass = "bg-green-100 border-green-500 text-green-700"; // Answered
              }
              if (markedForReview.has(idx)) {
                statusClass = answers[q._id] 
                  ? "bg-purple-600 border-purple-700 text-white" // Answered & Marked
                  : "bg-purple-100 border-purple-400 text-purple-700"; // Unanswered & Marked
              }
              
              if (currentQuestionIndex === idx) {
                statusClass += " ring-2 ring-blue-500 ring-offset-2"; // Current
              }
              
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg border font-medium text-sm transition-all ${statusClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          
          <div className="space-y-3 border-t border-gray-100 pt-4 text-sm">
            <div className="flex items-center"><div className="w-4 h-4 bg-green-100 border border-green-500 rounded mr-3"></div> Answered</div>
            <div className="flex items-center"><div className="w-4 h-4 bg-white border border-gray-300 rounded mr-3"></div> Not Answered / Skipped</div>
            <div className="flex items-center"><div className="w-4 h-4 bg-purple-100 border border-purple-400 rounded mr-3"></div> Marked for Review</div>
            <div className="flex items-center"><div className="w-4 h-4 bg-purple-600 border border-purple-700 rounded mr-3"></div> Answered & Marked</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuizTakingInterface;
