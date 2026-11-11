
import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "../services/dashboard.service";

import {
  BookOpen,
  Flame,
  Zap,
  Trophy,
  Sparkles,
  Play,
  Target,
  Lock,
  CheckCircle2,
  Send,
} from "lucide-react";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

import "./Dashboard.css";

const INITIAL_STATS = {
  streak: 0,
  xp: 0,
  nextLevelXp: 2000,
  level: "BEGINNER",
  done: 0,
  total: 0,
};

const skills = [
  { skill: "JavaScript", score: 78 },
  { skill: "React", score: 62 },
  { skill: "Node.js", score: 55 },
  { skill: "SQL", score: 40 },
  { skill: "Git", score: 85 },
  { skill: "APIs", score: 58 },
];

const learningPath = [
  { title: "JS Fundamentals", status: "done" },
  { title: "Async & Promises", status: "done" },
  { title: "Node fs Module", status: "current" },
  { title: "Express APIs", status: "locked" },
  { title: "Prisma & SQL", status: "locked" },
];

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="dashboard-stat-card">
      <div className="dashboard-stat-icon">
        <Icon size={23} />
      </div>

      <div>
        <p className="dashboard-muted">{label}</p>
        <h2>{value}</h2>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  // Dashboard statistics state
  const [stats, setStats] = useState(INITIAL_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  // Other dashboard states
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState("");

  // Fetch latest statistics from backend
  const fetchStats = useCallback(async () => {
    try {
      setStatsError("");

      const data = await dashboardService.getStats();

      if (data.success) {
        setStats((previous) => ({
          ...previous,
          ...data.stats,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      setStatsError("Unable to load your latest statistics.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch statistics when dashboard opens
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Find weakest skill
  const weakest = [...skills].sort(
    (a, b) => a.score - b.score
  )[0];

  // Calculate XP progress
  const xpPct = Math.min(
    100,
    Math.round((stats.xp / stats.nextLevelXp) * 100)
  );

  function handlePractice() {
    setMessage(`Your ${weakest.skill} practice session is ready!`);
  }

  function handleSend() {
    if (!question.trim()) return;

    setMessage(
      "Your question has been received. AI mentor integration will be connected next."
    );

    setQuestion("");
  }

  return (
    <div className="dashboard-container">

      {/* Single Welcome Banner */}
      <section className="dashboard-welcome">
        <div>
          <p className="dashboard-eyebrow">
            YOUR LEARNING OVERVIEW
          </p>

          <h1>Welcome to your Dashboard!</h1>

          <p>
            Keep learning, keep growing. You're making progress.
          </p>
        </div>

        <div className="dashboard-welcome-icon">
          <Sparkles size={35} />
        </div>
      </section>

      {/* Statistics Loading / Error */}
      {statsLoading && (
        <p className="dashboard-muted">
          Loading your learning statistics...
        </p>
      )}

      {statsError && (
        <p className="dashboard-muted" role="alert">
          {statsError}
          <button onClick={fetchStats}> Try again</button>
        </p>
      )}

      {/* Stats */}
      <section className="dashboard-stats-grid">
        <StatCard
          icon={Flame}
          label="Day streak"
          value={`${stats.streak} days`}
          sub="Keep it going!"
        />

        <StatCard
          icon={Zap}
          label="XP earned"
          value={stats.xp.toLocaleString()}
          sub={`${xpPct}% to next level`}
        />

        <StatCard
          icon={Trophy}
          label="Current level"
          value={stats.level}
          sub="Great progress!"
        />

        <StatCard
          icon={BookOpen}
          label="Lessons completed"
          value={`${stats.done} / ${stats.total}`}
          sub="JavaScript Training"
        />
      </section>

      {/* XP Progress */}
      <section className="dashboard-card">
        <div className="dashboard-section-heading">
          <div>
            <h3>Your learning progress</h3>
            <p>Progress towards your next level</p>
          </div>

          <strong>{xpPct}%</strong>
        </div>

        <div className="dashboard-progress-track">
          <div
            className="dashboard-progress-fill"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </section>

      {/* Skills and AI Insight */}
      <div className="dashboard-main-grid">

        <section className="dashboard-card dashboard-skill-card">
          <div className="dashboard-section-heading">
            <div>
              <h3>Your skill map</h3>
              <p>Based on your latest assessment</p>
            </div>

            <Target size={22} />
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skills} outerRadius="72%">
                <PolarGrid stroke="#d5ddd8" />

                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "#4b5a50", fontSize: 12 }}
                />

                <Radar
                  dataKey="score"
                  stroke="#3f7a4f"
                  fill="#6f9a68"
                  fillOpacity={0.45}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <button
            className="dashboard-primary-button"
            onClick={handlePractice}
          >
            <Target size={17} />
            Practice {weakest.skill}
          </button>
        </section>

        <section className="dashboard-insight-card">
          <div className="dashboard-insight-heading">
            <Sparkles size={20} />
            <h3>Weekly AI insight</h3>
          </div>

          <p>
            Git and JavaScript are your strongest skills.
            {` ${weakest.skill} is currently your weakest skill at ${weakest.score}%.`}
            {" "}Spend 15 minutes practising it to improve your performance.
          </p>

          <div className="dashboard-mentor">
            <h4>Ask your AI mentor</h4>

            <div className="dashboard-mentor-input">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Ask a question..."
              />

              <button
                onClick={handleSend}
                aria-label="Send question"
              >
                <Send size={17} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Learning Path */}
      <section className="dashboard-card">
        <div className="dashboard-section-heading">
          <div>
            <h3>Your learning path</h3>
            <p>Follow your personalized learning journey</p>
          </div>

          <BookOpen size={22} />
        </div>

        <div className="dashboard-learning-path">
          {learningPath.map((step, index) => (
            <div className="dashboard-path-item" key={step.title}>
              <div className={`dashboard-path-icon ${step.status}`}>
                {step.status === "done" && <CheckCircle2 size={21} />}
                {step.status === "current" && <Play size={19} />}
                {step.status === "locked" && <Lock size={18} />}
              </div>

              <p>{step.title}</p>

              {index !== learningPath.length - 1 && (
                <div className="dashboard-path-line" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Message */}
      {message && (
        <div className="dashboard-message" role="status">
          {message}

          <button onClick={() => setMessage("")}>
            Dismiss
          </button>
        </div>
      )}

    </div>
  );
}
