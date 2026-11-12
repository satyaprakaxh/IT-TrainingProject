import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentService } from '../services/assessment.service';

export default function AssessmentInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAssessment();
  }, [id]);

  const loadAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getAssessment(id);
      setAssessment(data.assessment || data);
    } catch (err) {
      setError(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="assess-page">
        <div className="assess-empty">
          <div className="assess-skeleton-text wide" />
          <div className="assess-skeleton-text" style={{ width: '60%' }} />
          <div className="assess-skeleton-text" style={{ width: '40%' }} />
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
  const durationText =
    totalMinutes > 0 ? `${totalMinutes} minutes` : 'No time limit';
  const questions = assessment.questions || [];
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <div className="assess-page">
      <div className="assess-page-header">
        <Link to="/assessment" className="assess-btn-ghost">
          ← Back to Assessments
        </Link>
        <div>
          <h1>{assessment.title}</h1>
          <p>{assessment.description || 'No description provided.'}</p>
        </div>
      </div>

      <div className="assess-card" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ padding: '30px 34px 24px' }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <span className="assess-card-detail">
              📚 {assessment.course?.title || 'General Course'}
            </span>
            <span className="assess-card-detail">
              ⚡ {assessment.difficulty.charAt(0) + assessment.difficulty.slice(1).toLowerCase()}
            </span>
            <span className="assess-card-detail">
              ❓ {questions.length} questions
            </span>
            <span className="assess-card-detail">
              ⏱️ {durationText}
            </span>
            <span className="assess-card-detail">
              💯 {totalPoints} total marks
            </span>
            <span className="assess-card-detail">
              ✅ {assessment.passingScore}% to pass
            </span>
          </div>

          <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#0b0b0b' }}>
            Instructions & Rules
          </h3>
          <ul style={{ color: '#3a3a3a', lineHeight: 1.8, marginBottom: 24 }}>
            <li>
              Read each question carefully before selecting your answer.
            </li>
            <li>
              You can navigate between questions using Previous / Next or the
              question panel.
            </li>
            <li>
              Mark questions for review and return to them before submitting.
            </li>
            <li>
              Your answers are saved automatically as you move between
              questions.
            </li>
            <li>
              {totalMinutes > 0
                ? `A countdown timer of ${totalMinutes} minutes will run. The assessment auto-submits when time expires.`
                : 'There is no time limit for this assessment.'}
            </li>
            <li>
              Correct answers and explanations are shown only after you submit.
            </li>
          </ul>

          <div
            style={{
              background: '#e8f4ec',
              border: '1px solid #c9e6d6',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: 24
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#3f7a4f', fontWeight: 600 }}>
              Ready to begin?
            </p>
            <p style={{ margin: 0, fontSize: 14, color: '#3a3a3a' }}>
              Click "Start Assessment" to begin your attempt. Once started, the
              timer (if any) will begin immediately.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Link to="/assessment" className="assess-btn-ghost">
              Cancel
            </Link>
            <button
              className="assess-btn-primary"
              onClick={() => navigate(`/assessment/attempt/${assessment.id}`)}
            >
              Start Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
