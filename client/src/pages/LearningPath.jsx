import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  learningPathService,
  assessmentService
} from '../services/index';

import {
  Play,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Layers,
  BookOpen,
  ChevronRight,
  X,
  Plus,
  Trash2
} from 'lucide-react';

import '../pages/LearningPath.css';

export default function LearningPath() {
  const navigate = useNavigate();

  // State
  const [path, setPath] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showEmpty, setShowEmpty] = useState(false);

  // Derived state
  const pathCompletion = path?.pathCompletion || 0;
  const completedItems = path?.completedItems || 0;
  const totalItems = path?.totalItems || 0;
  const items = path?.items || [];

  useEffect(() => {
    loadPath();
  }, []);

  const loadPath = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await learningPathService.getLearningPath();
      setPath(data.learningPath || data);
      setSkillGap(data.skillGapAnalysis || null);
    } catch (err) {
      // 404 means no path exists - that's OK, show empty state
      if (err.response?.status === 404) {
        setShowEmpty(true);
      } else {
        setError(err.message || 'Failed to load learning path');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = await learningPathService.generateLearningPath();
      setPath(data.learningPath || data);
      setSkillGap(data.skillGapAnalysis || null);
      setShowEmpty(false);
    } catch (err) {
      setError(err.message || 'Failed to generate learning path');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = await learningPathService.regenerateLearningPath();
      setPath(data.learningPath || data);
      setSkillGap(data.skillGapAnalysis || null);
      setShowEmpty(false);
    } catch (err) {
      setError(err.message || 'Failed to regenerate learning path');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProgress = async (item, completed) => {
    const pathId = path.id;
    const courseId = item.courseId;
    try {
      await learningPathService.updateItemProgress(
        pathId,
        courseId,
        !completed
      );
      // Reload to reflect progress
      loadPath();
    } catch (err) {
      setError(err.message || 'Failed to update progress');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this learning path?')) return;
    setSaving(true);
    try {
      await learningPathService.deleteLearningPath(path.id);
      setPath(null);
      setShowEmpty(true);
    } catch (err) {
      setError(err.message || 'Failed to delete learning path');
    } finally {
      setSaving(false);
    }
  };

  // Skill gap stats
  const gaps = skillGap?.gaps || [];
  const highPriority = gaps.filter((g) => g.priority === 'high').length;
  const mediumPriority = gaps.filter((g) => g.priority === 'medium').length;
  const strengths = skillGap?.strengths || [];
  const weaknesses = skillGap?.weaknesses || [];

  if (loading) {
    return (
      <div className="lp-page">
        <div className="lp-header">
          <h1>My Learning Path</h1>
          <p>Generating your personalized journey…</p>
        </div>
        <div className="lp-empty">
          <div className="lp-skeleton wide" />
          <div className="lp-skeleton" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  if (error && !showEmpty) {
    return (
      <div className="lp-page">
        <div className="lp-header">
          <Link to="/dashboard" className="lp-back">
            ← Back to Dashboard
          </Link>
          <div>
            <h1>My Learning Path</h1>
          </div>
        </div>
        <div className="lp-error">{error}</div>
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <button
            className="lp-btn-primary"
            onClick={handleGenerate}
            disabled={saving}
          >
            {saving ? 'Generating…' : 'Generate Learning Path'}
          </button>
        </div>
      </div>
    );
  }

  if (showEmpty || (!path && !skillGap)) {
    return (
      <div className="lp-page">
        <div className="lp-header">
          <Link to="/dashboard" className="lp-back">
            ← Back to Dashboard
          </Link>
          <div>
            <h1>My Learning Path</h1>
            <p>
              Your personalized AI-powered learning journey starts here.
            </p>
          </div>
        </div>

        <div className="lp-card">
          <div className="lp-empty">
            <Target size={48} className="lp-empty-icon" />
            <h3>No Learning Path Yet</h3>
            <p>
              Complete an assessment to identify your skill gaps, then generate
              a personalized learning path tailored to you.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/assessment" className="lp-btn-ghost">
              Take Assessment
            </Link>
            <button
              className="lp-btn-primary"
              onClick={handleGenerate}
              disabled={saving}
            >
              {saving ? 'Generating…' : 'Generate Path'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lp-page">
      <div className="lp-header">
        <div>
          <h1>My Learning Path</h1>
          <p>
            {pathCompletion}% complete &bull; {totalItems} steps &bull;{' '}
            {Math.round((path?.totalDurationMinutes || 0) / 60)}h estimated
          </p>
        </div>
        <div className="lp-actions">
          <button
            className="lp-btn-ghost"
            onClick={handleRegenerate}
            disabled={saving}
          >
            <RefreshCw size={16} /> Regenerate
          </button>
          <button
            className="lp-btn-ghost lp-btn-delete"
            onClick={handleDelete}
            disabled={saving}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {error && <div className="lp-error">{error}</div>}

      {/* Skill Gap Summary */}
      {skillGap && (
        <div className="lp-stats-grid">
          <div className="lp-stat-card">
            <div className="lp-stat-icon">
              <Target size={22} />
            </div>
            <div>
              <p className="lp-muted">Skill Gaps Identified</p>
              <h3>{gaps.length}</h3>
            </div>
          </div>
          <div className="lp-stat-card">
            <div className="lp-stat-icon">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="lp-muted">High Priority</p>
              <h3>{highPriority}</h3>
            </div>
          </div>
          <div className="lp-stat-card">
            <div className="lp-stat-icon">
              <Clock size={22} />
            </div>
            <div>
              <p className="lp-muted">Estimated Duration</p>
              <h3>
                {Math.round((path?.totalDurationMinutes || 0) / 60)}h{' '}
                {Math.round(
                  path?.totalDurationMinutes || 0
                ) % 60}m
              </h3>
            </div>
          </div>
          <div className="lp-stat-card">
            <div className="lp-stat-icon">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="lp-muted">Steps Completed</p>
              <h3>
                {completedItems} / {totalItems}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Learning Path Roadmap */}
      <div className="lp-section">
        <div className="lp-section-header">
          <h2>Your Learning Roadmap</h2>
          <p>
            Follow the steps in order. Each step builds on the previous one.
          </p>
        </div>

        <div className="lp-roadmap">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`lp-step ${
                item.isCompleted ? 'completed' : ''
              } ${index === 0 ? 'first' : ''} ${
                index === items.length - 1 ? 'last' : ''
              }`}
            >
              {/* Connector line */}
              {index > 0 && (
                <div className="lp-connector">
                  <div className="lp-line" />
                </div>
              )}

              <div className="lp-step-content">
                {/* Step number badge */}
                <div className="lp-step-badge">
                  {item.isCompleted ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    index + 1
                  )}
                </div>

                <div className="lp-step-details">
                  <div className="lp-step-header">
                    <h3>{item.course.title}</h3>
                    <span
                      className={`lp-difficulty ${item.course.difficulty.toLowerCase()}`}
                    >
                      {item.course.difficulty}
                    </span>
                  </div>
                  <p className="lp-step-desc">
                    {item.course.description ||
                    'No description available.'}
                  </p>

                  {/* Skill gap focus */}
                  {item.skillGap && (
                    <div className="lp-skill-focus">
                      <span className="lp-focus-label">Focus:</span>
                      <span className="lp-focus-skill">{item.skillGap}</span>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="lp-step-stats">
                    <span className="lp-stat">
                      {item.course._count?.lessons || 0} lessons
                    </span>
                    <span className="lp-stat">
                      {item.course.estimatedDurationMinutes || 0} min
                    </span>
                    <span className="lp-stat lp-progress">
                      {item.completionPercentage || 0}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="lp-progress-bar">
                    <div
                      className="lp-progress-fill"
                      style={{
                        width: `${item.completionPercentage || 0}%`,
                        background: item.isCompleted
                          ? '#3f7a4f'
                          : '#6f9a68'
                      }}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="lp-step-actions">
                    <Link
                      to={`/courses`}
                      className="lp-btn-view"
                      title="View Course"
                    >
                      <Layers size={16} />
                    </Link>
                    <button
                      className={`lp-btn-toggle ${
                        item.isCompleted ? 'completed' : ''
                      }`}
                      onClick={() =>
                        handleToggleProgress(item, item.isCompleted)
                      }
                      title={item.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {item.isCompleted ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Plus size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="lp-section">
          <div className="lp-section-header">
            <h2>Skill Assessment</h2>
            <p>Based on your latest assessment results.</p>
          </div>
          <div className="lp-skill-analysis">
            {strengths.length > 0 && (
              <div className="lp-skill-group lp-strengths">
                <h3>
                  <CheckCircle2 size={16} /> Strengths
                </h3>
                <div className="lp-skill-tags">
                  {strengths.map((s) => (
                    <span
                      key={s.name}
                      className="lp-skill-tag lp-tag-strong"
                    >
                      {s.name} ({s.score}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
            {weaknesses.length > 0 && (
              <div className="lp-skill-group lp-weaknesses">
                <h3>
                  <AlertCircle size={16} /> Areas for Improvement
                </h3>
                <div className="lp-skill-tags">
                  {weaknesses.map((s) => (
                    <span
                      key={s.name}
                      className="lp-skill-tag lp-tag-weak"
                    >
                      {s.name} ({s.score}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <Link to="/dashboard" className="lp-btn-ghost">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
