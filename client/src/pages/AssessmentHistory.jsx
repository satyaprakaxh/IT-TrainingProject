import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { assessmentService } from '../services/assessment.service';

import { List, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

import './Assessment.css';

export default function AssessmentHistory() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assessmentService.getAssessments({ limit: 100 });
      const list = data.assessments || [];
      const attemptPromises = list.map((a) =>
        assessmentService
          .getAttempts(a.id)
          .then((d) =>
            (d.attempts || []).map((att) => ({
              ...att,
              assessmentId: a.id,
              assessmentTitle: a.title,
              courseTitle: a.course && a.course.title ? a.course.title : 'General Course'
            }))
          )
          .catch(() => [])
      );
      const grouped = await Promise.all(attemptPromises);
      setAttempts(grouped.flat());
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = attempts
    .filter((a) => {
      const matchSearch =
        a.assessmentTitle.toLowerCase().includes(search.toLowerCase()) ||
        a.courseTitle.toLowerCase().includes(search.toLowerCase());
      if (filterStatus === 'passed') return a.passed === true;
      if (filterStatus === 'failed') return a.passed === false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.submittedAt || b.startedAt) -
        new Date(a.submittedAt || a.startedAt)
    );

  const totalCount = attempts.length;
  const sum = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
  const avgScore = totalCount > 0 ? Math.round((sum / totalCount) * 100) / 100 : 0;
  const passedCount = attempts.filter((a) => a.passed === true).length;
  const failedCount = attempts.filter((a) => a.passed === false).length;

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return <div className="assess-container">Loading...</div>;
  }

  return (
    <div className="assess-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 27, fontWeight: 800, color: '#202820' }}>Assessment History</h1>
          <p style={{ margin: '4px 0 0', color: '#607066' }}>Review your past attempts and results.</p>
        </div>
        <Link to="/assessment" className="assess-btn-ghost">Back to Assessments</Link>
      </div>

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
            <Clock size={23} />
          </div>
          <div className="assess-stat-body">
            <h3>{avgScore}%</h3>
            <p>Average Score</p>
          </div>
        </div>
      </div>

      <div className="assess-toolbar">
        <div className="assess-search">
          <input
            type="text"
            placeholder="Search by assessment or course…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="assess-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Results</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="assess-section-heading">
        <div>
          <h3>Attempt History</h3>
          <p>Track your assessment progress over time.</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="assess-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <h3>No attempts yet</h3>
          <p>Start an assessment to see your history here.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #e3e6e3' }}>
                <th style={{ padding: '14px 16px', fontSize: 12, color: '#849087', textTransform: 'uppercase', fontWeight: 700 }}>Assessment</th>
                <th style={{ padding: '14px 16px', fontSize: 12, color: '#849087', textTransform: 'uppercase', fontWeight: 700 }}>Course</th>
                <th style={{ padding: '14px 16px', fontSize: 12, color: '#849087', textTransform: 'uppercase', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '14px 16px', fontSize: 12, color: '#849087', textTransform: 'uppercase', fontWeight: 700 }}>Score</th>
                <th style={{ padding: '14px 16px', fontSize: 12, color: '#849087', textTransform: 'uppercase', fontWeight: 700 }}>Result</th>
                <th style={{ padding: '14px 16px', fontSize: 12, color: '#849087', textTransform: 'uppercase', fontWeight: 700 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((attempt) => {
                const passed = attempt.passed === true;
                const date = attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '—';
                return (
                  <tr key={attempt.id} style={{ borderBottom: '1px solid #f1f4f2', background: 'white' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#202820', fontWeight: 600 }}>{attempt.assessmentTitle}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#3a3a3a' }}>{attempt.courseTitle}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#3a3a3a' }}>{date}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#202820', fontWeight: 700 }}>{attempt.score}%</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: 0.4,
                          padding: '4px 10px',
                          borderRadius: 20,
                          background: passed ? '#e4f1e9' : '#fdecec',
                          color: passed ? '#3f7a4f' : '#d64545'
                        }}
                      >
                        {passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button className="assess-btn-ghost" onClick={() => {}} style={{ fontSize: 13, color: '#3f7a4f', fontWeight: 600, padding: '6px 12px' }}>View Result</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
          <button className="assess-btn-ghost" onClick={() => {}} disabled={currentPage === 1} style={{ padding: '8px 14px', fontSize: 13 }}>Prev</button>
          <span style={{ fontSize: 14, color: '#202820', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
          <button className="assess-btn-ghost" onClick={() => {}} disabled={currentPage === totalPages} style={{ padding: '8px 14px', fontSize: 13 }}>Next</button>
        </div>
      )}
    </div>
  );
}
