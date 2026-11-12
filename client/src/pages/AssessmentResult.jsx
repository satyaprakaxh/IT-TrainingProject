import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentService } from '../services/assessment.service';

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
      <div className="assess-page">
        <div className="assess-empty">
          <div className="assess-skeleton-text wide" />
          <div className="assess-skeleton-text" style={{ width: '55%' }} />
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="assess-page">
        <div className="assess-page-header">
          <h1>Result</h1>
        </div>
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
    <div className="assess-page">
      <div className="assess-page-header">
        <Link to="/assessment" className="assess-btn-ghost">
          ← Back to Assessments
        </Link>
        <div>
          <h1>Assessment Result</h1>
          <p>{attempt.assessment?.title || 'Assessment'}</p>
        </div>
      </div>

      <div className="assess-card" style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ padding: '30px 34px' }}>
          {/* Result banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '22px 26px',
              borderRadius: 16,
              background: passed ? '#e8f5e9' : '#fdecec',
              border: `1px solid ${passed ? '#c9e6d6' : '#f5bcbc'}`,
              marginBottom: 26
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: passed ? '#6f9a68' : '#d64545',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
                flexShrink: 0
              }}
            >
              {passed ? '✓' : '✗'}
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
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>
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
              color="#6f9a68"
              bg="#e8f5e9"
            />
            <BreakdownCard
              label="Incorrect"
              value={incorrectCount}
              color="#d64545"
              bg="#fdecec"
            />
            <BreakdownCard
              label="Unanswered"
              value={unansweredCount}
              color="#b58900"
              bg="#fff3e0"
            />
          </div>

          {/* Detailed review */}
          <h3
            style={{
              margin: '0 0 14px',
              fontSize: 17,
              fontWeight: 700,
              color: '#0b0b0b'
            }}
          >
            Question Review
          </h3>
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
              onClick={() =>
                navigate(`/assessment/instructions/${attempt.assessment?.id}`)
              }
              disabled={!attempt.assessment?.id}
            >
              Retake Assessment
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
        borderRadius: 12,
        background: '#fff'
      }}
    >
      <div style={{ fontSize: 11, color: '#8a8f8c', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0b0b0b' }}>
        {value}
      </div>
    </div>
  );
}

function BreakdownCard({ label, value, color, bg }) {
  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 12,
        background: bg,
        border: `1px solid ${color === '#6f9a68' ? '#c9e6d6' : color === '#d64545' ? '#f5bcbc' : '#ffe0b2'}`
      }}
    >
      <div style={{ fontSize: 11, color: color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0b0b0b' }}>
        {value}
      </div>
    </div>
  );
}

function ReviewItem({ response, index }) {
  const isCorrect = response.isCorrect;
  const q = response.question || {};
  const selectedOption = response.selectedOption;
  const selectedText =
    selectedOption?.optionText ||
    response.answerText ||
    'Not answered';

  return (
    <div
      style={{
        padding: '14px 18px',
        border: '1px solid #e3e6e3',
        borderRadius: 12,
        background: '#fff',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: isCorrect ? '#e8f5e9' : '#fdecec',
          color: isCorrect ? '#6f9a68' : '#d64545',
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
        <div style={{ fontSize: 12, color: '#8a8f8c', marginBottom: 4 }}>
          Question {index} • {q.type}
        </div>
        <div style={{ fontSize: 14, color: '#0b0b0b', fontWeight: 600, marginBottom: 6 }}>
          {q.questionText}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#3a3a3a' }}>
          <span>Your answer:</span>
          <span
            style={{
              fontWeight: 600,
              color: isCorrect ? '#6f9a68' : '#d64545'
            }}
          >
            {selectedText}
          </span>
          {isCorrect === false && response.pointsAwarded == null ? (
            <span style={{ color: '#8a8f8c', fontSize: 11 }}>0 pts</span>
          ) : (
            <span style={{ color: '#6f9a68', fontSize: 11, fontWeight: 700 }}>
              {response.pointsAwarded} pts
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
