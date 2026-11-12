import React, {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentService } from '../services/assessment.service';

export default function AssessmentAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Attempt state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    loadAssessment();
  }, [id]);

  const loadAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getAssessment(id);
      const a = data.assessment || data;
      setAssessment(a);
      setQuestions(a.questions || []);
      if (a.timeLimitMinutes) {
        setTimeLeft(a.timeLimitMinutes * 60);
        setTimerRunning(true);
        startTimeRef.current = Date.now();
      }
    } catch (err) {
      setError(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!timerRunning || timeLeft == null || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setTimerRunning(false);
          handleFinalSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timerRunning, timeLeft]);

  const formatTime = (seconds) => {
    if (seconds == null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id] || null;
  const isFlagged = flagged.has(currentQuestion?.id);

  const answeredCount = questions.reduce(
    (n, q) => (answers[q.id] ? n + 1 : n),
    0
  );
  const flaggedCount = flagged.size;
  const unansweredCount = questions.length - answeredCount;

  const isMCQ = currentQuestion?.type === 'MCQ';
  const isShortAnswer = currentQuestion?.type === 'SHORT_ANSWER';

  const handleOptionSelect = (optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { selectedOptionId: optionId, answerText: null }
    }));
  };

  const handleAnswerChange = (e) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        selectedOptionId: null,
        answerText: e.target.value
      }
    }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const openConfirm = () => setShowConfirm(true);
  const closeConfirm = () => setShowConfirm(false);

  const handleFinalSubmit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const answerList = questions.map((q) => {
        const ans = answers[q.id] || {};
        return {
          questionId: q.id,
          ...(ans.selectedOptionId != null
            ? { selectedOptionId: ans.selectedOptionId }
            : {}),
          ...(ans.answerText != null ? { answerText: ans.answerText } : {})
        };
      });
      const data = await assessmentService.submitAssessment(id, answerList);
      setSubmitResult(data.result || data);
      setSubmitted(true);
      setTimerRunning(false);
      clearInterval(timerRef.current);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    const unanswered = questions.filter((q) => !answers[q.id]).length;
    if (unanswered > 0) {
      setShowConfirm(true);
    } else {
      handleFinalSubmit();
    }
  };

  if (loading) {
    return (
      <div className="assess-page">
        <div className="assess-empty">
          <div className="assess-skeleton-text wide" />
          <div className="assess-skeleton-text" style={{ width: '50%' }} />
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="assess-page">
        <div className="assess-page-header">
          <h1>Assessment</h1>
        </div>
        <div className="assess-error">{error || 'Assessment not found.'}</div>
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <Link to="/assessment" className="assess-btn-ghost">
            Back to Assessments
          </Link>
        </div>
      </div>
    );
  }

  const totalMinutes = assessment.timeLimitMinutes || 0;
  const totalPoints = questions.reduce(
    (sum, q) => sum + (q.points || 0),
    0
  );
  const timeExpired = timerRunning === false && timeLeft == 0 && totalMinutes > 0;

  return (
    <div className="assess-page">
      {/* Confirm dialog */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '28px 32px',
              maxWidth: 420,
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}
          >
            <h2 style={{ margin: '0 0 10px', fontSize: 18, color: '#0b0b0b' }}>
              You have {unansweredCount} unanswered question{
                unansweredCount !== 1 ? 's' : ''
              }.
            </h2>
            <p style={{ color: '#3a3a3a', marginBottom: 22 }}>
              Are you sure you want to submit your assessment?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="assess-btn-ghost"
                onClick={closeConfirm}
              >
                Keep working
              </button>
              <button
                className="assess-btn-danger"
                onClick={() => {
                  closeConfirm();
                  handleFinalSubmit();
                }}
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="assess-page-header">
        <Link to="/assessment" className="assess-btn-ghost">
          ← Back to Assessments
        </Link>
        <div>
          <h1>{assessment.title}</h1>
          <p>
            {assessment.course?.title || 'General Course'} •{' '}
            {assessment.difficulty.charAt(0) +
            assessment.difficulty.slice(1).toLowerCase()}
          </p>
        </div>
      </div>

      {/* Timer + progress bar */}
      <div
        className="assess-card"
        style={{
          padding: '14px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#8a8f8c' }}>Time Remaining</span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: timeLeft != null && timeLeft < 60 ? '#d64545' : '#0b0b0b',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 200, height: 8, background: '#e3e6e3', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width:
                totalMinutes > 0
                  ? Math.max(0, ((timeLeft ?? totalMinutes * 60) / (totalMinutes * 60)) * 100)
                  : 100,
              background: timeLeft != null && timeLeft < 60 ? '#d64545' : '#6f9a68',
              transition: 'width 1s linear'
            }}
          />
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#8a8f8c',
            whiteSpace: 'nowrap'
          }}
        >
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      {/* Status summary */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          marginBottom: 20
        }}
      >
        <StatPill label="Answered" value={answeredCount} color="#6f9a68" />
        <StatPill label="Unanswered" value={unansweredCount} color="#d64545" />
        <StatPill label="For Review" value={flaggedCount} color="#b58900" />
      </div>

      {/* Question card */}
      <div className="assess-card" style={{ minHeight: 320 }}>
        <div style={{ padding: '26px 30px 20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 18
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  color: '#8a8f8c',
                  marginBottom: 4,
                  display: 'block'
                }}
              >
                Question {currentIndex + 1} • {currentQuestion.type}
              </span>
              <h3
                style={{
                  margin: 0,
                  fontSize: 19,
                  fontWeight: 700,
                  color: '#0b0b0b',
                  lineHeight: 1.5
                }}
              >
                {currentQuestion.questionText}
              </h3>
            </div>
            <button
              className="assess-btn-ghost"
              onClick={toggleFlag}
              style={{
                padding: '8px 14px',
                fontSize: 12,
                color: isFlagged ? '#b58900' : '#8a8f8c',
                borderColor: isFlagged ? '#b58900' : '#e3e6e3',
                background: isFlagged ? '#fff3e0' : 'transparent'
              }}
            >
              {isFlagged ? '✓ Flagged' : 'Flag for Review'}
            </button>
          </div>

          <div style={{ marginBottom: 24 }}>
            {isMCQ ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(currentQuestion.options || []).map((option) => {
                  const selected =
                    currentAnswer?.selectedOptionId === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '14px 18px',
                        border: `2px solid ${
                          selected ? '#6f9a68' : '#e3e6e3'
                        }`,
                        borderRadius: 12,
                        background: selected ? '#e8f4ec' : '#fff',
                        color: '#0b0b0b',
                        fontSize: 15,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        width: '100'
                      }}
                      onMouseEnter={() => {}}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: `2px solid ${
                            selected ? '#6f9a68' : '#8a8f8c'
                          }`,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          background: selected ? '#6f9a68' : '#fff',
                          color: selected ? '#fff' : 'transparent',
                          fontWeight: 700,
                          fontSize: 12
                        }}
                      >
                        {selected ? '✓' : ''}
                      </span>
                      {option.optionText}
                    </button>
                  );
                })}
              </div>
            ) : isShortAnswer ? (
              <div>
                <textarea
                  value={currentAnswer?.answerText || ''}
                  onChange={handleAnswerChange}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '1px solid #e3e6e3',
                    borderRadius: 12,
                    fontFamily: 'inherit',
                    fontSize: 15,
                    color: '#0b0b0b',
                    resize: 'vertical'
                  }}
                  placeholder="Type your answer here…"
                />
              </div>
            ) : (
              // TRUE_FALSE
              <div style={{ display: 'flex', gap: 12 }}>
                {['True', 'False'].map((val) => {
                  const selected = currentAnswer?.answerText === val;
                  return (
                    <button
                      key={val}
                      onClick={() => handleAnswerChange({ target: { value: val } })}
                      style={{
                        flex: 1,
                        padding: '14px 18px',
                        border: `2px solid ${
                          selected ? '#6f9a68' : '#e3e6e3'
                        }`,
                        borderRadius: 12,
                        background: selected ? '#e8f4ec' : '#fff',
                        color: '#0b0b0b',
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: '#8a8f8c',
                fontWeight: 600
              }}
            >
              {currentQuestion.points} point{
                currentQuestion.points !== 1 ? 's' : ''
              }
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="assess-btn-ghost"
                onClick={goPrev}
                disabled={currentIndex === 0}
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                ← Previous
              </button>
              <button
                className="assess-btn-primary"
                onClick={goNext}
                disabled={currentIndex === questions.length - 1}
                style={{ padding: '10px 22px', fontSize: 14 }}
              >
                {currentIndex === questions.length - 1 ? 'Finish' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom submit bar */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          background: '#fff',
          padding: '16px 35px',
          borderTop: '1px solid #e3e6e3',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.04)'
        }}
      >
        {timeExpired || submitted ? null : (
          <button
            className="assess-btn-danger"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ padding: '10px 26px', fontSize: 14 }}
          >
            {submitting ? 'Submitting…' : 'Submit Assessment'}
          </button>
        )}
        {submitted && (
            <Link
              to={`/assessment/result/${submitResult?.attemptId}`}
              className="assess-btn-primary"
              style={{ padding: '10px 26px', fontSize: 14, textDecoration: 'none' }}
            >
              View Results
            </Link>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        border: '1px solid #e3e6e3',
        borderRadius: 12,
        background: '#fff',
        flex: 1,
        minWidth: 110
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          flexShrink: 0
        }}
      />
      <div>
        <div style={{ fontSize: 11, color: '#8a8f8c', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0b0b0b' }}>
          {value}
        </div>
      </div>
    </div>
  );
}
