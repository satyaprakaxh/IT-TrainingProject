import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentService } from '../services/assessment.service';

import { CheckCircle2, AlertCircle, Clock, Play, List } from 'lucide-react';

import './Assessment.css';

export default function AssessmentResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  const loadAttempt = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getAttempt(attemptId);
      setAttempt(data.attempt || data);
    } catch (err) {
      setError(err.message || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="assess-container">
        <div className="assess-empty">
          <div className="assess-skeleton-text wide" />
          <div className="assess-skeleton-text" style={{ width: '55%' }} />
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="assess-container">
        <div className="assess-error">{error || 'Result not found.'}</div>
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <Link to="/assessment" className="assess-btn-ghost">
            Back to Assessments
          </Link>
        </div>
      </div>
    );
  }

  const responses = attempt.responses || [];
  const correctCount = responses.filter((r) => r.isCorrect).length;
  const incorrectCount = responses.filter((r) => r.isCorrect === false).length;
  const unansweredCount = responses.filter(
    (r) => r.isCorrect == null && !r.selectedOptionId && !r.answerText
  ).length;
  const percentage = attempt.score != null ? attempt.score : 0;
  const passed = attempt.passed;
  const totalMinutes =
    attempt.durationSeconds != null
      ? Math.round(attempt.durationSeconds / 60)
      : 0;

  const submittedAt = attempt.submittedAt
    ? new Date(attempt.submittedAt).toLocaleString()
    : '—';

  return (
    <div className="assess-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Link to="/assessment" className="assess-btn-ghost">
          ← Back to Assessments
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 800, color: '#202820' }}>{attempt.assessment?.title || 'Assessment Result'}</h1>
          <p style={{ margin: '4px 0 0', color: '#607066' }}>{attempt.assessment?.title || 'Assessment'}</p>
        </div>
      </div>

      <div className="assess-card" style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ padding: '22px' }}>
          {/* Result banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '22px 26px',
              borderRadius: 16,
              background: passed ? '#e4f1e9' : '#fdecec',
              border: `1px solid ${passed ? '#c9e6d6' : '#f5bcbc'}`,
              marginBottom: 26
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: passed ? '#3f7a4f' : '#d64545',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
                flexShrink: 0
              }}
            >
              {passed ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            </span>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: passed ? '#3f7a4f' : '#d64545'
                }}
              >
                {passed ? 'You Passed!' : 'You Did Not Pass'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#607066' }}>
                Keep practicing to improve your score.
              </p>
            </div>
          </div>

          {/* Score summary */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>
            <ResultPill label="Score" value={`${attempt.earnedPoints} / ${attempt.totalPoints}`} />
            <ResultPill label="Percentage" value={`${percentage}%`} />
            <ResultPill label="Passing Mark" value={`${attempt.assessment?.passingScore ?? 60}%`} />
            <ResultPill label="Time Taken" value={`${totalMinutes} min`} />
          </div>

          {/* Breakdown */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              marginBottom: 26
            }}
          >
            <BreakdownCard
              label="Correct"
              value={correctCount}
              color="#3f7a4f"
              bg="#e4f1e9"
              borderColor="#c9e6d6"
            />
            <BreakdownCard
              label="Incorrect"
              value={incorrectCount}
              color="#d64545"
              bg="#fdecec"
              borderColor="#f5bcbc"
            />
            <BreakdownCard
              label="Unanswered"
              value={unansweredCount}
              color="#b58900"
              bg="#fff3e0"
              borderColor="#ffe0b2"
            />
          </div>

          {/* Detailed review */}
          <div className="assess-section-heading">
            <div>
              <h3>Question Review</h3>
              <p>Review your answers below.</p>
            </div>
            <List size={22} />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxHeight: 420,
              overflowY: 'auto',
              paddingRight: 4
            }}
          >
            {responses.map((r) => (
              <ReviewItem
                key={r.id}
                response={r}
                index={responses.indexOf(r) + 1}
              />
            ))}
          </div>

          <div
            style={{
              marginTop: 26,
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}
          >
            <Link to="/assessment" className="assess-btn-ghost">
              Back to Assessments
            </Link>
            <button
              className="assess-btn-primary"
              onClick={() => {
                const retakeUrl = `/assessment/instructions/${attempt.assessment?.id}`;
                navigate(retakeUrl);
              }}
              disabled={!attempt.assessment?.id}
            >
              <Play size={17} /> Retake Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultPill({ label, value }) {
  return (
    <div
      style={{
        flex: 1,
        padding: '16px 18px',
        border: '1px solid #e3e6e3',
        borderRadius: 14,
        background: 'white'
      }}
    >
      <div style={{ fontSize: 11, color: '#849087', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#202820' }}>
        {value}
      </div>
    </div>
  );
}

function BreakdownCard({ label, value, color, bg, borderColor }) {
  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 14,
        background: bg,
        border: `1px solid ${borderColor}`
      }}
    >
      <div style={{ fontSize: 11, color: color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#202820' }}>
        {value}
      </div>
    </div>
  );
}

function ReviewItem({ response, index }) {
  const isCorrect = response.isCorrect;
  const q = response.question || {};
  const selectedOption = response.selectedOption;
  const correctAnswer = q.correctAnswer || '';
  const acceptedAnswers = q.acceptedAnswers || [];
  const explanation = q.explanation || '';

  const selectedText =
    selectedOption?.optionText ||
    response.answerText ||
    'Not answered';

  // Determine correct answer text for display
  let correctDisplayText = '';
  if (q.type === 'MCQ') {
    correctDisplayText = selectedOption?.isCorrect
      ? selectedOption.optionText
      : (q.options || []).find((o) => o.isCorrect)?.optionText || correctAnswer;
  } else if (q.type === 'TRUE_FALSE') {
    correctDisplayText = correctAnswer || 'True/False';
  } else {
    // SHORT_ANSWER - show all accepted answers
    const allAnswers = [correctAnswer, ...acceptedAnswers].filter(Boolean);
    correctDisplayText = allAnswers.join(' / ');
  }

  return (
    <div
      style={{
        padding: '16px 20px',
        border: `1px solid ${isCorrect ? '#c9e6d6' : '#f5bcbc'}`,
        borderRadius: 14,
        background: isCorrect ? '#e4f1e9' : '#fff',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 0
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: isCorrect ? '#3f7a4f' : '#d64545',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontSize: 13,
          fontWeight: 800,
          flexShrink: 0
        }}
      >
        {isCorrect ? '✓' : '✗'}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: '#849087', marginBottom: 4 }}>
          Question {index} • {q.type}
        </div>
        <div style={{ fontSize: 14, color: '#202820', fontWeight: 600, marginBottom: 8 }}>
          {q.questionText}
        </div>

        {/* Your answer */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#849087', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
            Your Answer
          </div>
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: isCorrect ? '#e4f1e9' : '#fdecec',
              border: `1px solid ${isCorrect ? '#c9e6d6' : '#f5bcbc'}`,
              color: '#202820',
              fontSize: 13
            }}
          >
            {selectedText}
          </div>
        </div>

        {/* Correct answer */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#849087', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
            Correct Answer
          </div>
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: '#e8f5e9',
              border: '1px solid #c9e6d6',
              color: '#3f7a4f',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            {correctDisplayText || '—'}
          </div>
        </div>

        {/* Marks */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#849087', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
            Marks Obtained
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: isCorrect ? '#3f7a4f' : '#d64545'
            }}
          >
            {response.pointsAwarded} / {q.points} pts
          </div>
        </div>

        {/* Explanation */}
        {explanation && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#849087', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
              Explanation
            </div>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: '#fdecec',
                border: '1px solid #f5bcbc',
                color: '#d64545',
                fontSize: 13,
                fontStyle: 'italic'
              }}
            >
              {explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
