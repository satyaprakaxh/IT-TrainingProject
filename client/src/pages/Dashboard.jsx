
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardService } from "../services/dashboard.service";
import { coursesService } from "../services/courses.service";

import {
  BookOpen,
  Flame,
  Zap,
  Trophy,
  Sparkles,
  Play,
  Target,
  CheckCircle2,
  Send,
  Lightbulb,
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

const STATUS_ORDER = {
  done: 1,
  current: 2,
  recommended: 3,
};

const DIFFICULTY_ORDER = {
  BEGINNER: 1,
  EASY: 1,
  INTERMEDIATE: 2,
  MEDIUM: 2,
  ADVANCED: 3,
  HARD: 3,
};

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
  const navigate = useNavigate();

  const [stats, setStats] = useState(INITIAL_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [skills, setSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState("");

  const [learningPath, setLearningPath] = useState([]);
  const [pathLoading, setPathLoading] = useState(true);
  const [pathError, setPathError] = useState("");

  const [weeklyInsight, setWeeklyInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const [question, setQuestion] = useState("");
  const [mentorAnswer, setMentorAnswer] = useState("");
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorError, setMentorError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch dashboard statistics
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

  // Fetch skill map
  const fetchSkills = useCallback(async () => {
    try {
      setSkillsError("");

      const data = await dashboardService.getSkillMap();

      if (data.success) {
        const formattedSkills = (data.skills || []).map((item) => ({
          id: item.id,
          skill: item.name,
          score: Number(item.score) || 0,
          level: item.level,
          category: item.category,
        }));

        setSkills(formattedSkills);
      }
    } catch (error) {
      console.error("Failed to fetch skill map:", error);

      setSkillsError(
        error.response?.data?.message ||
          "Unable to load your skill map."
      );
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  // Find strongest and weakest skills
  const strongest =
    skills.length > 0
      ? [...skills].sort((a, b) => b.score - a.score)[0]
      : null;

  const weakest =
    skills.length > 0
      ? [...skills].sort((a, b) => a.score - b.score)[0]
      : null;

  // Build personalized learning path
  const fetchLearningPath = useCallback(async () => {
    try {
      setPathLoading(true);
      setPathError("");

      if (skillsLoading) return;

      const data = await coursesService.getCourses();
      const allCourses = data.courses || [];

      if (allCourses.length === 0) {
        setLearningPath([]);
        return;
      }

      // Find all skills with the lowest score
      const lowestScore =
        skills.length > 0
          ? Math.min(...skills.map((skill) => skill.score))
          : null;

      const weakestSkills =
        lowestScore !== null
          ? skills.filter((skill) => skill.score === lowestScore)
          : [];

      const weakestSkillNames = weakestSkills.map((skill) =>
        skill.skill.toLowerCase().trim()
      );

      // Match courses with weak skills
      const coursesWithMatches = allCourses.map((course) => {
        const courseSkills = course.skills || [];

        const matchedSkills = courseSkills.filter((courseSkill) => {
          const courseSkillName = courseSkill.name
            .toLowerCase()
            .trim();

          return weakestSkillNames.some(
            (weakSkill) =>
              courseSkillName === weakSkill ||
              courseSkillName.includes(weakSkill) ||
              weakSkill.includes(courseSkillName)
          );
        });

        return {
          ...course,
          skills: courseSkills,
          matchedSkills,
          relevanceScore: matchedSkills.length,
        };
      });

      // Prefer courses matching weak skills.
      // If no courses match, show all available courses.
      const matchingCourses = coursesWithMatches.filter(
        (course) => course.relevanceScore > 0
      );

      const recommendedCourses =
        matchingCourses.length > 0
          ? matchingCourses
          : coursesWithMatches;

      // Fetch real progress for enrolled courses
      const coursesWithProgress = await Promise.all(
        recommendedCourses.map(async (course) => {
          let completionPercentage = 0;
          let completedLessons = 0;
          let lessonCount = course.lessonCount || 0;

          if (course.isEnrolled) {
            try {
              const progressData =
                await coursesService.getCourseProgress(course.id);

              const progress =
                progressData.progress || progressData;

              completionPercentage =
                Number(progress.completionPercentage) || 0;

              completedLessons =
                Number(progress.completedLessons) || 0;

              lessonCount =
                Number(progress.lessonCount) || lessonCount;
            } catch (error) {
              console.error(
                `Failed to fetch progress for ${course.title}:`,
                error
              );
            }
          }

          let status = "recommended";

          if (
            completionPercentage >= 100 ||
            course.enrollmentStatus === "COMPLETED"
          ) {
            status = "done";
            completionPercentage = 100;
          } else if (course.isEnrolled) {
            status = "current";
          }

          return {
            id: course.id,
            title: course.title,
            description: course.description || "",
            category: course.category || "",
            difficulty: course.difficulty || "BEGINNER",
            skills: course.skills,
            matchedSkills: course.matchedSkills,
            relevanceScore: course.relevanceScore,
            isEnrolled: course.isEnrolled,
            completionPercentage,
            completedLessons,
            lessonCount,
            status,
          };
        })
      );

      // Sort by enrollment status, skill relevance and difficulty
      coursesWithProgress.sort((a, b) => {
        const statusDifference =
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status];

        if (statusDifference !== 0) {
          return statusDifference;
        }

        const relevanceDifference =
          b.relevanceScore - a.relevanceScore;

        if (relevanceDifference !== 0) {
          return relevanceDifference;
        }

        const difficultyA =
          DIFFICULTY_ORDER[a.difficulty.toUpperCase()] || 2;

        const difficultyB =
          DIFFICULTY_ORDER[b.difficulty.toUpperCase()] || 2;

        return difficultyA - difficultyB;
      });

      setLearningPath(coursesWithProgress.slice(0, 5));
    } catch (error) {
      console.error("Failed to create learning path:", error);

      setPathError(
        error.response?.data?.message ||
          "Unable to load your personalized learning path."
      );
    } finally {
      setPathLoading(false);
    }
  }, [skills, skillsLoading]);

  // Fetch weekly AI insight
  const fetchWeeklyInsight = useCallback(async () => {
    try {
      setInsightLoading(true);
      const data = await dashboardService.getWeeklyInsight();
      if (data.success && data.insight) {
        setWeeklyInsight(data.insight);
      }
    } catch (error) {
      console.warn("Failed to fetch weekly insight:", error);
    } finally {
      setInsightLoading(false);
    }
  }, []);

  // Load dashboard data
  useEffect(() => {
    fetchStats();
    fetchSkills();
    fetchWeeklyInsight();
  }, [fetchStats, fetchSkills, fetchWeeklyInsight]);

  // Build learning path after skills load
  useEffect(() => {
    if (!skillsLoading) {
      fetchLearningPath();
    }
  }, [skillsLoading, fetchLearningPath]);

  // XP progress
  const xpPct =
    stats.nextLevelXp > 0
      ? Math.min(
          100,
          Math.round((stats.xp / stats.nextLevelXp) * 100)
        )
      : 0;

  // Practice weakest skill
  function handlePractice() {
    if (!weakest) {
      setMessage(
        "Complete an assessment to discover your weakest skill."
      );
      return;
    }

    navigate("/assessment", {
      state: {
        practiceSkill: weakest.skill,
      },
    });
  }

  // AI mentor message
  async function handleSend() {
    const q = question.trim();
    if (!q || mentorLoading) return;

    setMentorLoading(true);
    setMentorError("");
    setMentorAnswer("");

    try {
      const data = await dashboardService.chatWithAI(q);
      if (data.success && data.reply) {
        setMentorAnswer(data.reply);
      } else {
        setMentorError(data.message || "No reply from AI mentor.");
      }
      setQuestion("");
    } catch (error) {
      console.error("AI mentor error:", error);
      setMentorError(
        error.response?.data?.message ||
          "AI mentor could not generate a response right now. Please try again."
      );
    } finally {
      setMentorLoading(false);
    }
  }

  // Course-specific explanation
  function getCourseReason(course) {
    if (course.matchedSkills.length > 0) {
      const matchedNames = course.matchedSkills
        .map((skill) => skill.name)
        .join(", ");

      if (
        course.difficulty.toUpperCase() === "BEGINNER" ||
        course.difficulty.toUpperCase() === "EASY"
      ) {
        return `Build your foundation in ${matchedNames} with this beginner-friendly course.`;
      }

      if (
        course.difficulty.toUpperCase() === "INTERMEDIATE" ||
        course.difficulty.toUpperCase() === "MEDIUM"
      ) {
        return `Strengthen your ${matchedNames} knowledge with more practical concepts.`;
      }

      return `Develop advanced knowledge in ${matchedNames}.`;
    }

    return course.description ||
      "Explore this course to develop your technical knowledge.";
  }

  return (
    <div className="dashboard-container">

      {/* Welcome Banner */}
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

      {/* Statistics */}
      {statsLoading && (
        <p className="dashboard-muted">
          Loading your learning statistics...
        </p>
      )}

      {statsError && (
        <p className="dashboard-muted" role="alert">
          {statsError}
          <button onClick={fetchStats}>Try again</button>
        </p>
      )}

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

        {/* Skill Map */}
        <section className="dashboard-card dashboard-skill-card">
          <div className="dashboard-section-heading">
            <div>
              <h3>Your skill map</h3>
              <p>Based on your latest assessment</p>
            </div>

            <Target size={22} />
          </div>

          {skillsLoading && (
            <p className="dashboard-muted">
              Loading your skill data...
            </p>
          )}

          {skillsError && (
            <div>
              <p className="dashboard-muted" role="alert">
                {skillsError}
              </p>

              <button onClick={fetchSkills}>
                Try again
              </button>
            </div>
          )}

          {!skillsLoading &&
            !skillsError &&
            skills.length === 0 && (
              <div className="dashboard-chart">
                <p className="dashboard-muted">
                  No skill data available yet. Complete an assessment
                  to see your skill map.
                </p>
              </div>
            )}

          {!skillsLoading &&
            !skillsError &&
            skills.length > 0 && (
              <>
                <div className="dashboard-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skills} outerRadius="72%">
                      <PolarGrid stroke="#d5ddd8" />

                      <PolarAngleAxis
                        dataKey="skill"
                        tick={{
                          fill: "#4b5a50",
                          fontSize: 12,
                        }}
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
                  Practice {weakest?.skill || "Weakest Skill"}
                </button>
              </>
            )}
        </section>

        {/* AI Insight */}
        <section className="dashboard-insight-card">
          <div className="dashboard-insight-heading">
            <Sparkles size={20} className={insightLoading ? "dashboard-insight-spinner" : ""} />
            <h3>Weekly AI insight</h3>
          </div>

          {weeklyInsight ? (
            <p>{weeklyInsight}</p>
          ) : skills.length > 0 && strongest ? (
            <p>
              {skills.length > 1 && weakest && strongest.skill !== weakest.skill ? (
                <>
                  {strongest.skill} is your strongest skill at{" "}
                  {strongest.score}%.{" "}
                  {weakest.skill} is currently your weakest skill at{" "}
                  {weakest.score}%.{" "}
                  Spend 15 minutes practising it to improve your performance.
                </>
              ) : (
                <>
                  {strongest.skill} is currently your evaluated skill at{" "}
                  {strongest.score}%. Complete assessments in other topics to broaden your skill profile!
                </>
              )}
            </p>
          ) : (
            <p>
              Complete your assessments to discover your strongest
              and weakest skills and receive personalized insights.
            </p>
          )}

          <div className="dashboard-mentor">
            <h4>Ask your AI mentor</h4>

            {mentorAnswer && (
              <div className="dashboard-mentor-reply">
                <div className="dashboard-mentor-reply-header">
                  <span>🤖 AI Mentor</span>
                  <button
                    type="button"
                    className="dashboard-mentor-reply-clear"
                    onClick={() => setMentorAnswer("")}
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
                <p>{mentorAnswer}</p>
              </div>
            )}

            {mentorError && (
              <p className="dashboard-mentor-error">{mentorError}</p>
            )}

            <div className="dashboard-mentor-input">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder={mentorLoading ? "AI is thinking..." : "Ask a question..."}
                disabled={mentorLoading}
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={mentorLoading || !question.trim()}
                aria-label="Send question"
              >
                {mentorLoading ? (
                  <Sparkles size={17} className="dashboard-insight-spinner" />
                ) : (
                  <Send size={17} />
                )}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Personalized Learning Path */}
      <section className="dashboard-card">
        <div className="dashboard-section-heading">
          <div>
            <h3>Your learning path</h3>
            <p>
              A personalized journey based on your assessment results
            </p>
          </div>

          <BookOpen size={22} />
        </div>

        {/* Weakest Skill */}
        {weakest && (
          <div className="dashboard-path-insight">
            <div className="dashboard-insight-heading">
              <Target size={19} />
              <strong>Your focus area</strong>
            </div>

            <h4>{weakest.skill}</h4>

            <p>
              Your current score is{" "}
              <strong>{weakest.score}%</strong>.
              These courses are selected to help strengthen your skills.
            </p>
          </div>
        )}

        {skills.length === 0 && !skillsLoading && (
          <p className="dashboard-muted">
            Complete an assessment to receive skill-based course
            recommendations.
          </p>
        )}

        {pathLoading && (
          <p className="dashboard-muted">
            Creating your personalized learning path...
          </p>
        )}

        {pathError && (
          <div>
            <p className="dashboard-muted" role="alert">
              {pathError}
            </p>

            <button onClick={fetchLearningPath}>
              Try again
            </button>
          </div>
        )}

        {!pathLoading &&
          !pathError &&
          learningPath.length === 0 && (
            <p className="dashboard-muted">
              No published courses are available yet.
            </p>
          )}

        {!pathLoading &&
          !pathError &&
          learningPath.length > 0 && (
            <div className="dashboard-learning-path">
              {learningPath.map((step, index) => (
                <div
                  className="dashboard-path-item"
                  key={step.id}
                >
                  <div
                    className={`dashboard-path-icon ${step.status}`}
                  >
                    {step.status === "done" && (
                      <CheckCircle2 size={21} />
                    )}

                    {step.status === "current" && (
                      <Play size={19} />
                    )}

                    {step.status === "recommended" && (
                      <BookOpen size={19} />
                    )}
                  </div>

                  <div className="dashboard-path-content">
                    <p>{step.title}</p>

                    <small>
                      {step.status === "done" && "Completed"}

                      {step.status === "current" &&
                        `In progress · ${step.completionPercentage}%`}

                      {step.status === "recommended" &&
                        "Recommended for you"}
                    </small>

                    {/* Actual progress */}
                    {step.isEnrolled && (
                      <>
                        <div className="dashboard-progress-track">
                          <div
                            className="dashboard-progress-fill"
                            style={{
                              width: `${step.completionPercentage}%`,
                            }}
                          />
                        </div>

                        <small>
                          {step.completedLessons} of{" "}
                          {step.lessonCount} lessons completed
                        </small>
                      </>
                    )}

                    {/* Individual recommendation explanation */}
                    <div className="dashboard-path-reason">
                      <Lightbulb size={15} />

                      <span>{getCourseReason(step)}</span>
                    </div>

                    {/* Course details */}
                    <small>
                      {step.category} · {step.difficulty}
                    </small>

                    {step.skills.length > 0 && (
                      <small>
                        Course skills:{" "}
                        {step.skills
                          .map((skill) => skill.name)
                          .join(", ")}
                      </small>
                    )}
                  </div>

                  {index !== learningPath.length - 1 && (
                    <div className="dashboard-path-line" />
                  )}
                </div>
              ))}
            </div>
          )}
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
