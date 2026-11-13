
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assessmentService } from '../services/assessment.service';

import {
  List,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Eye,
  RotateCcw
} from 'lucide-react';

import './Assessment.css';

export default function AssessmentHistory() {
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await assessmentService.getAssessments({
        limit: 100
      });

      const list = data.assessments || [];

      const attemptPromises = list.map(async (assessment) => {
        try {
          const result = await assessmentService.getAttempts(
            assessment.id
          );

          return {
            assessment,
            attempts: result.attempts || []
          };
        } catch (err) {
          console.error(
            `Could not load attempts for ${assessment.title}:`,
            err
          );

          return {
            assessment,
            attempts: []
          };
        }
      });

      const grouped = await Promise.all(attemptPromises);

      const allAttempts = [];

      grouped.forEach(({ assessment, attempts }) => {
        // Oldest first temporarily, to calculate attempt numbers.
        const chronological = [...attempts].sort(
          (a, b) =>
            new Date(a.submittedAt || a.startedAt || 0) -
            new Date(b.submittedAt || b.startedAt || 0)
        );

        chronological.forEach((attempt, index) => {
          allAttempts.push({
            ...attempt,
            assessmentId: assessment.id,
            assessmentTitle: assessment.title,
            courseTitle:
              assessment.course?.title || 'General Course',
            attemptNumber: index + 1
          });
        });
      });

      // Newest attempts first on the page.
      allAttempts.sort(
        (a, b) =>
          new Date(b.submittedAt || b.startedAt || 0) -
          new Date(a.submittedAt || a.startedAt || 0)
      );

      setAttempts(allAttempts);
    } catch (err) {
      console.error('History loading error:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load assessment history.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = attempts.filter((attempt) => {
    const searchTerm = search.toLowerCase();

    const matchSearch =
      (attempt.assessmentTitle || '')
        .toLowerCase()
        .includes(searchTerm) ||
      (attempt.courseTitle || '')
        .toLowerCase()
        .includes(searchTerm);

    if (!matchSearch) return false;

    if (filterStatus === 'passed') {
      return attempt.passed === true;
    }

    if (filterStatus === 'failed') {
      return attempt.passed === false;
    }

    return true;
  });

  const totalCount = attempts.length;

  const scoredAttempts = attempts.filter(
    (attempt) => attempt.status === 'EVALUATED'
  );

  const sum = scoredAttempts.reduce(
    (total, attempt) => total + (Number(attempt.score) || 0),
    0
  );

  const avgScore =
    scoredAttempts.length > 0
      ? Math.round(sum / scoredAttempts.length)
      : 0;

  const passedCount = attempts.filter(
    (attempt) => attempt.passed === true
  ).length;

  const failedCount = attempts.filter(
    (attempt) => attempt.passed === false
  ).length;

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  const currentPage = Math.min(
    Math.max(page, 1),
    totalPages
  );

  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDate = (dateValue) => {
    if (!dateValue) return '—';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString();
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilter = (value) => {
    setFilterStatus(value);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="assess-container">
        <div className="assess-empty">
          <Clock size={30} />
          <h3>Loading your assessment history...</h3>
          <p>Please wait while we retrieve your attempts.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assess-container">
        <div className="assess-error">{error}</div>

        <div style={{ textAlign: 'center', marginTop: 25 }}>
          <button
            className="assess-btn-primary"
            onClick={loadHistory}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assess-container">

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 15,
          marginBottom: 25
        }}
      >
        <div>
          <p className="assess-eyebrow">YOUR LEARNING JOURNEY</p>

          <h1
            style={{
              margin: 0,
              fontSize: 27,
              fontWeight: 800,
              color: '#202820'
            }}
          >
            Assessment History
          </h1>

          <p style={{ margin: '4px 0 0', color: '#607066' }}>
            Review every attempt, track your scores and see your improvement.
          </p>
        </div>

        <Link
          to="/assessment"
          className="assess-btn-ghost"
        >
          Back to Assessments
        </Link>
      </div>

      {/* Statistics */}
      <div className="assess-stats-grid">

        <div className="assess-stat-card">
          <div className="assess-stat-icon">
            <List size={23} />
          </div>

          <div className="assess-stat-body">
            <h3>{totalCount}</h3>
            <p>Total Attempts</p>
          </div>
        </div>

        <div className="assess-stat-card">
          <div className="assess-stat-icon">
            <CheckCircle2 size={23} />
          </div>

          <div className="assess-stat-body">
            <h3>{passedCount}</h3>
            <p>Passed</p>
          </div>
        </div>

        <div className="assess-stat-card">
          <div className="assess-stat-icon">
            <AlertCircle size={23} />
          </div>

          <div className="assess-stat-body">
            <h3>{failedCount}</h3>
            <p>Failed</p>
          </div>
        </div>

        <div className="assess-stat-card">
          <div className="assess-stat-icon">
            <Trophy size={23} />
          </div>

          <div className="assess-stat-body">
            <h3>{avgScore}%</h3>
            <p>Average Score</p>
          </div>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="assess-toolbar">

        <div className="assess-search">
          <input
            type="text"
            placeholder="Search by assessment or course..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <select
          className="assess-select"
          value={filterStatus}
          onChange={(e) => handleFilter(e.target.value)}
        >
          <option value="all">All Results</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>

      </div>

      {/* History Heading */}
      <div className="assess-section-heading">
        <div>
          <h3>All Attempts</h3>
          <p>
            Each retake is saved separately so you can track your progress.
          </p>
        </div>
      </div>

      {/* History Table */}
      {filtered.length === 0 ? (
        <div className="assess-empty">
          <List size={36} />

          <h3>
            {attempts.length === 0
              ? 'No attempts yet'
              : 'No matching attempts found'}
          </h3>

          <p>
            {attempts.length === 0
              ? 'Start an assessment to see your history here.'
              : 'Try changing your search or result filter.'}
          </p>

          {attempts.length === 0 && (
            <Link
              to="/assessment"
              className="assess-btn-primary"
              style={{ display: 'inline-flex', marginTop: 12 }}
            >
              Start an Assessment
            </Link>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 760
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: 'left',
                  borderBottom: '2px solid #e3e6e3'
                }}
              >
                {[
                  'Assessment',
                  'Attempt',
                  'Course',
                  'Date',
                  'Score',
                  'Result',
                  'Action'
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: '14px 16px',
                      fontSize: 12,
                      color: '#849087',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginated.map((attempt) => {
                const passed = attempt.passed === true;
                const evaluated = attempt.status === 'EVALUATED';

                return (
                  <tr
                    key={attempt.id}
                    style={{
                      borderBottom: '1px solid #f1f4f2',
                      background: 'white'
                    }}
                  >
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: 14,
                        color: '#202820',
                        fontWeight: 600
                      }}
                    >
                      {attempt.assessmentTitle}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 9px',
                          borderRadius: 20,
                          background: '#f2eee5',
                          color: '#74613f',
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      >
                        <RotateCcw size={12} />
                        Attempt {attempt.attemptNumber}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: 14,
                        color: '#3a3a3a'
                      }}
                    >
                      {attempt.courseTitle}
                    </td>

                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: 13,
                        color: '#3a3a3a'
                      }}
                    >
                      {formatDate(
                        attempt.submittedAt || attempt.startedAt
                      )}
                    </td>

                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: 14,
                        color: '#202820',
                        fontWeight: 700
                      }}
                    >
                      {evaluated
                        ? `${attempt.score ?? 0}%`
                        : '—'}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: 0.4,
                          padding: '4px 10px',
                          borderRadius: 20,
                          background: !evaluated
                            ? '#f2eee5'
                            : passed
                              ? '#e4f1e9'
                              : '#fdecec',
                          color: !evaluated
                            ? '#74613f'
                            : passed
                              ? '#3f7a4f'
                              : '#d64545'
                        }}
                      >
                        {!evaluated
                          ? 'In Progress'
                          : passed
                            ? 'Passed'
                            : 'Failed'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <button
                        className="assess-btn-ghost"
                        onClick={() =>
                          navigate(
                            `/assessment/result/${attempt.id}`
                          )
                        }
                        disabled={!evaluated}
                        style={{
                          fontSize: 13,
                          color: '#3f7a4f',
                          fontWeight: 600,
                          padding: '6px 12px',
                          opacity: evaluated ? 1 : 0.5,
                          cursor: evaluated ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <Eye size={14} />
                        View Result
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 24
          }}
        >
          <button
            className="assess-btn-ghost"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            Prev
          </button>

          <span
            style={{
              fontSize: 14,
              color: '#202820',
              fontWeight: 600
            }}
          >
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="assess-btn-ghost"
            onClick={() =>
              setPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
}
