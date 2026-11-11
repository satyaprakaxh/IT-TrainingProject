
import { useState, useEffect } from 'react';
import { coursesService } from '../services/courses.service';
import { dashboardService } from '../services/dashboard.service';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Play,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import './Courses.css';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await coursesService.getCourses();

      if (data.success) {
        setCourses(data.courses);
      }
    } catch (err) {
      console.error('Courses loading error:', err);
      setError('Unable to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      setBusyId(courseId);
      setMessage('');

      await coursesService.enrollCourse(courseId);
      await fetchCourses();

      setExpandedCourse(courseId);
      setMessage('Successfully enrolled! Start your first lesson.');
    } catch (err) {
      console.error('Enrollment error:', err);
      setMessage(
        err.response?.data?.message || 'Unable to enroll. Please try again.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleCompleteLesson = async (courseId, lessonId) => {
    try {
      setBusyId(lessonId);
      setMessage('');

      const result = await dashboardService.completeLesson(lessonId);

      setCourses((previousCourses) =>
        previousCourses.map((course) => {
          if (course.id !== courseId) return course;

          const updatedLessons = course.lessons.map((lesson) =>
            lesson.id === lessonId
              ? { ...lesson, status: 'COMPLETED' }
              : lesson
          );

          return {
            ...course,
            lessons: updatedLessons,
            completedLessons: updatedLessons.filter(
              (lesson) => lesson.status === 'COMPLETED'
            ).length
          };
        })
      );

      window.dispatchEvent(new Event('dashboardStatsUpdated'));

      setMessage(
        result.xpEarned > 0
          ? `Lesson completed! You earned ${result.xpEarned} XP.`
          : 'This lesson is already completed.'
      );
    } catch (err) {
      console.error('Lesson completion error:', err);
      setMessage(
        err.response?.data?.message || 'Unable to complete lesson.'
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="courses-loading">
        <RefreshCw className="courses-spinner" size={25} />
        <p>Loading your courses...</p>
      </div>
    );
  }

  return (
    <div className="courses-container">
      <section className="courses-welcome">
        <div>
          <p className="courses-eyebrow">YOUR LEARNING JOURNEY</p>
          <h1>Explore Courses</h1>
          <p>
            Discover new skills, learn at your own pace, and track your progress.
          </p>
        </div>
        <div className="courses-welcome-icon">
          <GraduationCap size={38} />
        </div>
      </section>

      {message && (
        <div className="courses-message" role="status">
          {message}
          <button onClick={() => setMessage('')}>Dismiss</button>
        </div>
      )}

      {error && (
        <div className="courses-error" role="alert">
          {error}
          <button onClick={fetchCourses}>Try again</button>
        </div>
      )}

      <div className="courses-heading">
        <div>
          <h2>Available courses</h2>
          <p>{courses.length} courses available</p>
        </div>
        <BookOpen size={25} />
      </div>

      {courses.length === 0 && !error ? (
        <div className="courses-empty">
          <BookOpen size={42} />
          <h3>No courses available yet</h3>
          <p>
            Published training courses will appear here when they are added.
          </p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => {
            const isExpanded = expandedCourse === course.id;
            const isCompleted =
              course.totalLessons > 0 &&
              course.completedLessons === course.totalLessons;

            return (
              <article className="course-card" key={course.id}>
                <div className="course-card-top">
                  <span className="course-category">
                    {course.category}
                  </span>
                  <span className={`course-difficulty ${course.difficulty?.toLowerCase()}`}>
                    {course.difficulty}
                  </span>
                </div>

                <div className="course-card-icon">
                  <GraduationCap size={27} />
                </div>

                <h3>{course.title}</h3>
                <p className="course-description">
                  {course.description || 'Explore this training course and build your skills.'}
                </p>

                <div className="course-meta">
                  <span>
                    <BookOpen size={16} />
                    {course.totalLessons} lessons
                  </span>
                  <span>
                    <Clock size={16} />
                    {course.estimatedDurationMinutes || 0} min
                  </span>
                </div>

                {course.isEnrolled && (
                  <div className="course-progress">
                    <div className="course-progress-label">
                      <span>Course progress</span>
                      <strong>
                        {course.completedLessons}/{course.totalLessons}
                      </strong>
                    </div>
                    <div className="course-progress-track">
                      <div
                        className="course-progress-fill"
                        style={{
                          width: `${
                            course.totalLessons
                              ? (course.completedLessons / course.totalLessons) * 100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {!course.isEnrolled ? (
                  <button
                    className="course-primary-button"
                    onClick={() => handleEnroll(course.id)}
                    disabled={busyId === course.id}
                  >
                    {busyId === course.id ? 'Enrolling...' : 'Enroll now'}
                    <GraduationCap size={18} />
                  </button>
                ) : (
                  <button
                    className="course-primary-button"
                    onClick={() =>
                      setExpandedCourse(isExpanded ? null : course.id)
                    }
                  >
                    {isCompleted ? 'Review lessons' : 'Continue learning'}
                    {isExpanded ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                )}

                {isExpanded && course.isEnrolled && (
                  <div className="course-lessons">
                    <h4>Course lessons</h4>

                    {course.lessons.length === 0 ? (
                      <p>No lessons have been added to this course yet.</p>
                    ) : (
                      course.lessons.map((lesson) => (
                        <div className="course-lesson" key={lesson.id}>
                          <div className="course-lesson-info">
                            {lesson.status === 'COMPLETED' ? (
                              <CheckCircle2 size={19} />
                            ) : (
                              <Play size={18} />
                            )}
                            <div>
                              <strong>{lesson.title}</strong>
                              <small>
                                {lesson.durationMinutes || 0} minutes
                              </small>
                            </div>
                          </div>

                          {lesson.status === 'COMPLETED' ? (
                            <span className="lesson-completed">
                              Completed
                            </span>
                          ) : (
                            <button
                              className="lesson-complete-button"
                              onClick={() =>
                                handleCompleteLesson(course.id, lesson.id)
                              }
                              disabled={busyId === lesson.id}
                            >
                              {busyId === lesson.id
                                ? 'Saving...'
                                : 'Complete'}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
