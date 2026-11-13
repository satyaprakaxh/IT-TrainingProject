
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assessmentService } from '../services/assessment.service';

import {
  CheckCircle2,
  Clock,
  TrendingUp,
  List,
  BookOpen,
  Target,
  ArrowLeft,
  RotateCcw,
  History,
} from 'lucide-react';

import './Assessment.css';

export default function Assessment() {
  const navigate = useNavigate();
  const location = useLocation();

  const practiceSkill = location.state?.practiceSkill || null;

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    averageScore: 0,
  });

  // Fetch assessments and their attempt histories
  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await assessmentService.getAssessments({
        limit: 50,
      });

      const list = data.assessments || [];

      const attemptMapData = await Promise.all(
        list.map(async (assessment) => {
          try {
            const result = await assessmentService.getAttempts(
              assessment.id
            );

            return {
              assessmentId: assessment.id,
              attempts: result.attempts || [],
            };
          } catch (err) {
            console.error(
              `Could not fetch attempts for ${assessment.title}:`,
              err
            );

            return {
              assessmentId: assessment.id,
              attempts: [],
            };
          }
        })
      );

      let completed = 0;
      let totalBestScores = 0;
      let scoredCount = 0;

      const enriched = list.map((assessment) => {
        const attempts =
          attemptMapData.find(
            (item) => item.assessmentId === assessment.id
          )?.attempts || [];

        const evaluatedAttempts = attempts.filter(
          (attempt) => attempt.status === 'EVALUATED'
        );

        const latest = attempts[0] || null;

        const latestCompleted = evaluatedAttempts[0] || null;

        const bestScore =
          evaluatedAttempts.length > 0
            ? Math.max(
                ...evaluatedAttempts.map((attempt) =>
                  Number(attempt.score) || 0
                )
              )
            : null;

        const isCompleted = evaluatedAttempts.length > 0;

        let status = 'Not Started';

        if (isCompleted) {
          status = 'Completed';
          completed += 1;

          totalBestScores += bestScore;
          scoredCount += 1;
        }

        return {
          ...assessment,
          userStatus: status,
          latestAttempt: latest,
          latestCompletedAttempt: latestCompleted,
          attemptsCount: attempts.length,
          bestScore,
        };
      });

      setAssessments(enriched);

      setStats({
        total: list.length,
        completed,
        pending: list.length - completed,
        averageScore:
          scoredCount > 0
            ? Math.round(totalBestScores / scoredCount)
            : 0,
      });
    } catch (err) {
      console.error('Assessment loading error:', err);

      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load assessments'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Filter assessments by selected practice skill
  const skillFiltered = practiceSkill
    ? assessments.filter((assessment) =>
        (assessment.course?.skills || []).some(
          (skill) =>
            skill.name?.toLowerCase() ===
            practiceSkill.toLowerCase()
        )
      )
    : assessments;

  // Search, status filter and sorting
  const filtered = skillFiltered
    .filter((assessment) => {
      const searchText = search.toLowerCase();

      const matchSearch =
        (assessment.title || '')
          .toLowerCase()
          .includes(searchText) ||
        (assessment.course?.title || '')
          .toLowerCase()
          .includes(searchText) ||
        (assessment.description || '')
          .toLowerCase()
          .includes(searchText);

      if (!matchSearch) return false;

      if (filterStatus === 'completed') {
        return assessment.userStatus === 'Completed';
      }

      if (filterStatus === 'pending') {
        return assessment.userStatus !== 'Completed';
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }

      if (sortBy === 'score') {
        return (b.bestScore ?? -1) - (a.bestScore ?? -1);
      }

      return (
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
      );
    });

  // Loading state
  if (loading) {
    return (
      <div className="assess-container">
        <div className="assess-empty">
          <div className="assess-skeleton-text wide" />
          <div
            className="assess-skeleton-text"
            style={{ width: '55%' }}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="assess-container">
        <div className="assess-error">{error}</div>

        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <button
            className="assess-btn-ghost"
            onClick={fetchAssessments}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assess-container">

      {/* Welcome Banner */}
      <section className="assess-welcome">
        <div>
          <p className="assess-eyebrow">
            {practiceSkill
              ? 'PERSONALIZED PRACTICE'
              : 'YOUR ASSESSMENTS'}
          </p>

          <h1>
            {practiceSkill
              ? `Practice ${practiceSkill}`
              : 'Evaluate Your Skills'}
          </h1>

          <p>
            {practiceSkill
              ? `Assessments related to your weakest skill: ${practiceSkill}.`
              : 'Test your knowledge, improve your skills and track your learning progress.'}
          </p>
        </div>

        <div className="assess-welcome-icon">
          <Target size={35} />
        </div>
      </section>

      {/* Back to Dashboard */}
      {practiceSkill && (
        <button
          className="assess-btn-ghost"
          onClick={() => navigate('/dashboard')}
          style={{ marginBottom: 20 }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      )}

      {/* Assessment History Button */}
      {!practiceSkill && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 20,
          }}
        >
          <button
            className="assess-btn-ghost"
            onClick={() => navigate('/assessment/history')}
          >
            <History size={17} />
            Assessment History
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="assess-stats-grid">

        <div className="assess-stat-card">
          <div className="assess-stat-icon">
            <List size={23} />
          </div>

          <div>
            <p className="assess-muted">
              Total Assessments
            </p>
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
            <p className="assess-muted">Average Best Score</p>
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

      {/* Search and Filters */}
      <div className="assess-toolbar">

        <div className="assess-search">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>

          <input
            type="text"
            placeholder="Search assessments..."
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

      {/* Assessment List Heading */}
      <div className="assess-section-heading">
        <div>
          <h3>
            {practiceSkill
              ? `${practiceSkill} Assessments`
              : 'Available Assessments'}
          </h3>

          <p>
            Start an assessment or retake one to improve your score.
          </p>
        </div>
      </div>

      {/* Empty State or Assessment Cards */}
      {filtered.length === 0 ? (
        <div className="assess-empty">
          <Target size={36} />

          <h3>
            {practiceSkill
              ? `No assessments available for ${practiceSkill}`
              : 'No assessments found'}
          </h3>

          <p>
            {practiceSkill
              ? 'Try another skill or return to all assessments.'
              : 'Try adjusting your search or filters.'}
          </p>

          {practiceSkill && (
            <button
              className="assess-btn-primary"
              onClick={() =>
                navigate('/assessment', {
                  replace: true,
                  state: null,
                })
              }
            >
              View All Assessments
            </button>
          )}
        </div>
      ) : (
        <div className="assess-cards-grid">
          {filtered.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onStart={() =>
                navigate(
                  `/assessment/instructions/${assessment.id}`
                )
              }
            />
          ))}
        </div>
      )}

    </div>
  );
}


// Individual Assessment Card
function AssessmentCard({ assessment, onStart }) {
  const courseTitle =
    assessment.course?.title || 'General Course';

  const difficulty = assessment.difficulty || 'BEGINNER';

  const difficultyLabel =
    difficulty.charAt(0) +
    difficulty.slice(1).toLowerCase();

  const totalMinutes = assessment.timeLimitMinutes || 0;

  const durationText =
    totalMinutes > 0
      ? `${totalMinutes} min`
      : 'No time limit';

  const isCompleted =
    assessment.userStatus === 'Completed';

  return (
    <div className="assess-card">

      <div className="assess-card-header">

        <div className="assess-card-meta">
          <h3 className="assess-card-title">
            {assessment.title}
          </h3>

          <span
            className={`assess-card-badge ${
              assessment.userStatus.toLowerCase().replace(' ', '-')
            }`}
          >
            {assessment.userStatus}
          </span>
        </div>

        <p className="assess-card-description">
          {assessment.description ||
            'No description provided.'}
        </p>

        <div className="assess-card-details">

          <span className="assess-card-detail">
            <BookOpen size={14} />
            {courseTitle}
          </span>

          <span className="assess-card-detail">
            <Target size={14} />
            {difficultyLabel}
          </span>

          <span className="assess-card-detail">
            <Clock size={14} />
            {assessment.questionCount || 0} questions
          </span>

          <span className="assess-card-detail">
            {durationText}
          </span>

          {assessment.passingScore != null && (
            <span className="assess-card-detail">
              {assessment.passingScore}% to pass
            </span>
          )}

        </div>

        {/* Previous Attempt Information */}
        {isCompleted && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(120, 100, 160, 0.08)',
            }}
          >
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <CheckCircle2
                size={15}
                style={{
                  display: 'inline',
                  verticalAlign: 'middle',
                  marginRight: 6,
                }}
              />
              Previous attempt completed
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 14,
                fontSize: 13,
              }}
            >
              <span>
                Best score:{' '}
                <strong>{assessment.bestScore}%</strong>
              </span>

              <span>
                Attempts:{' '}
                <strong>{assessment.attemptsCount}</strong>
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Start / Retake Button */}
      <div className="assess-card-footer">
        <button
          className="assess-btn-primary"
          onClick={onStart}
        >
          {isCompleted ? (
            <>
              <RotateCcw
                size={16}
                style={{
                  display: 'inline',
                  verticalAlign: 'middle',
                  marginRight: 7,
                }}
              />
              Retake Assessment
            </>
          ) : (
            'Start Assessment'
          )}
        </button>
      </div>

    </div>
  );
}
