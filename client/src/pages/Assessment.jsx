import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { assessmentService } from '../services/assessment.service';

import {
  CheckCircle2,
  Clock,
  TrendingUp,
  List,
  Play,
  BookOpen,
  Target,
} from 'lucide-react';

import './Assessment.css';

export default function Assessment() {
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  // Computed stats + status per assessment
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    averageScore: 0
  });

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getAssessments({ limit: 50 });
      const list = data.assessments || [];

      // Build a map of assessmentId -> latest attempt for stats
      const attemptPromises = list.map((a) =>
        assessmentService
          .getAttempts(a.id)
          .then((d) => ({ assessmentId: a.id, attempts: d.attempts || [] }))
          .catch(() => ({ assessmentId: a.id, attempts: [] }))
      );
      const attemptMapData = await Promise.all(attemptPromises);

      let completed = 0;
      let totalScores = 0;
      let scoredCount = 0;

      const enriched = list.map((a) => {
        const attempts = attemptMapData.find(
          (m) => m.assessmentId === a.id
        )?.attempts || [];
        const latest = attempts[0] || null;
        const best = attempts.reduce(
          (max, att) => (att.score > max ? att.score : max),
          -1
        );

        let status = 'Not Started';
        if (latest && latest.status === 'EVALUATED') {
          status = latest.passed ? 'Completed' : 'Completed';
          completed += 1;
          totalScores += best;
          scoredCount += 1;
        }

        return {
          ...a,
          userStatus: status,
          latestAttempt: latest,
          bestScore: best >= 0 ? best : null
        };
      });

      setAssessments(enriched);
      setStats({
        total: list.length,
        completed,
        pending: list.length - completed,
        averageScore:
          scoredCount > 0
            ? Math.round((totalScores / scoredCount) * 100) / 100
            : 0
      });
    } catch (err) {
      setError(err.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Filtered / sorted list
  const filtered = assessments
    .filter((a) => {
      const matchSearch =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.course?.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.description || '').toLowerCase().includes(search.toLowerCase());
      if (filterStatus === 'completed') return a.userStatus === 'Completed';
      if (filterStatus === 'pending') return a.userStatus !== 'Completed';
      return matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'score') {
        return (b.bestScore || 0) - (a.bestScore || 0);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

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

  if (error) {
    return (
      <div className="assess-container">
        <div className="assess-error">{error}</div>
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <Link to="/dashboard" className="assess-btn-ghost">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="assess-container">
      {/* Welcome Banner */}
      <section className="assess-welcome">
        <div>
          <p className="assess-eyebrow">YOUR ASSESSMENTS</p>
          <h1>Evaluate Your Skills</h1>
          <p>
            Test your knowledge and track your learning progress.
          </p>
        </div>
        <div className="assess-welcome-icon">
          <Target size={35} />
        </div>
      </section>

      {/* Stats */}
      <section className="assess-stats-grid">
        <div className="assess-stat-card">
          <div className="assess-stat-icon">
            <List size={23} />
          </div>
          <div>
            <p className="assess-muted">Total Assessments</p>
            <h2>{stats.total}</h2>
          </div>
        </div>

        <div className="assess-stat-card">
          <div className="assess-stat-icon">
            <CheckCircle2 size={23} />
          </div>
          <div>
            <p className="assess-muted">Completed</p>
            <h2>{stats.completed}</h2>
          </div>
        </div>

        <div className="assess-stat-card">
          <div className="assess-stat-icon">
            <TrendingUp size={23} />
          </div>
          <div>
            <p className="assess-muted">Average Score</p>
            <h2>{stats.averageScore}%</h2>
          </div>
        </div>

        <div className="assess-stat-card">
          <div className="assess-stat-icon">
            <Clock size={23} />
          </div>
          <div>
            <p className="assess-muted">Pending</p>
            <h2>{stats.pending}</h2>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="assess-toolbar">
        <div className="assess-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search assessments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="assess-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Available</option>
          <option value="completed">Completed</option>
        </select>
        <select
          className="assess-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="createdAt">Newest First</option>
          <option value="title">A–Z</option>
          <option value="score">Best Score</option>
        </select>
      </div>

      <div className="assess-section-heading">
        <div>
          <h3>Available Assessments</h3>
          <p>Select an assessment to begin.</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="assess-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <h3>No assessments found</h3>
          <p>
            {filtered.length === 0 && assessments.length > 0
              ? 'Try adjusting your search or filters.'
              : 'No assessments are available yet.'}
          </p>
        </div>
      ) : (
        <div className="assess-cards-grid">
          {filtered.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onStart={() =>
                navigate(`/assessment/instructions/${assessment.id}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssessmentCard({ assessment, onStart }) {
  const courseTitle =
    assessment.course?.title || 'General Course';
  const difficultyLabel =
    assessment.difficulty.charAt(0) +
    assessment.difficulty.slice(1).toLowerCase();
  const totalMinutes = assessment.timeLimitMinutes || 0;
  const durationText =
    totalMinutes > 0
      ? `${totalMinutes} min`
      : 'No time limit';

  return (
    <div className="assess-card">
      <div className="assess-card-header">
        <div className="assess-card-meta">
          <h3 className="assess-card-title">{assessment.title}</h3>
          <span
            className={`assess-card-badge ${
              assessment.userStatus.toLowerCase()
            }`}
          >
            {assessment.userStatus}
          </span>
        </div>
        <p className="assess-card-description">
          {assessment.description || 'No description provided.'}
        </p>
        <div className="assess-card-details">
          <span className="assess-card-detail">
            <BookOpen size={14} /> {courseTitle}
          </span>
          <span className="assess-card-detail">
            <Target size={14} /> {difficultyLabel}
          </span>
          <span className="assess-card-detail">
            <Clock size={14} /> {assessment.questionCount} questions
          </span>
          <span className="assess-card-detail">
            {durationText}
          </span>
          {assessment.passingScore != null && (
            <span className="assess-card-detail">
              ✅ {assessment.passingScore}% to pass
            </span>
          )}
        </div>
      </div>
      <div className="assess-card-footer">
        <button
          className="assess-btn-primary"
          onClick={onStart}
          disabled={assessment.userStatus === 'Completed'}
        >
          {assessment.userStatus === 'Completed'
            ? 'Completed'
            : 'Start Assessment'}
        </button>
      </div>
    </div>
  );
}
