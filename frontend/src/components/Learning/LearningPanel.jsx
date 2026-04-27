import React, { useState, useEffect } from 'react';
import { PDF_CATALOG, generateAndDownloadPdf } from './pdfGenerator';
import './LearningPanel.css';

/* ─── SVG Icons ──────────────────────────────────────────── */
const I = {
  book: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>,
  edit: (s=32) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  hash: (s=32) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  hand: (s=32) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.82-2.82L7 15"/></svg>,
  layers: (s=32) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  star: (s=32) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  pdf: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  download: (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  eye: (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  arrowL: (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  check: (s=48) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  clock: (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

/* ─── Course data (Beginner → Advanced) ──────────────────── */
const COURSES = [
  { id:1, title:'The ISL Alphabet', level:'Beginner', icon:I.edit(), desc:'Master the 26 hand shapes of the ISL alphabet for finger-spelling.', lessons:26, duration:'1.5 hours', progress:0, targets:['A','B','C','D','E'], pdfId:'isl_alphabet_beginner' },
  { id:2, title:'Numbers & Counting', level:'Beginner', icon:I.hash(), desc:'Learn to sign numbers 1-100 and basic mathematical concepts.', lessons:10, duration:'1 hour', progress:0, targets:['1','2','3','4','5'], pdfId:'isl_numbers_beginner' },
  { id:3, title:'Essential Greetings', level:'Intermediate', icon:I.hand(), desc:'Common phrases like Hello, Thank You, and Good Morning.', lessons:15, duration:'2 hours', progress:0, targets:['HELLO','THANKS','NAMASTE'], pdfId:'isl_phrases_intermediate' },
  { id:4, title:'Grammar & Sentence Structure', level:'Intermediate', icon:I.layers(), desc:'Learn ISL word order, verb types, negation, and classifiers.', lessons:12, duration:'2.5 hours', progress:0, targets:['HELLO','THANKS','NAMASTE'], pdfId:'isl_grammar_intermediate' },
  { id:5, title:'Advanced Conversation', level:'Advanced', icon:I.star(), desc:'Master role shifting, discourse strategies, and professional signing.', lessons:20, duration:'4 hours', progress:0, targets:['HELLO','THANKS','NAMASTE'], pdfId:'isl_advanced_conversation' },
];

/* ═══════════════════════════════════════════════════════════ */
const LearningPanel = ({ lastResult }) => {
  const [activeSection, setActiveSection] = useState('courses');
  const [activeCourse, setActiveCourse] = useState(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceSuccess, setPracticeSuccess] = useState(false);
  const [filterLevel, setFilterLevel] = useState('All');
  const [busyId, setBusyId] = useState(null);

  /* ── PDF actions (client-side) ── */
  const handlePdf = async (pdfId, mode) => {
    setBusyId(pdfId + mode);
    try { await generateAndDownloadPdf(pdfId, mode); }
    catch (e) { alert('PDF generation failed: ' + e.message); }
    setTimeout(() => setBusyId(null), 600);
  };

  /* ── Course helpers ── */
  const handleStartCourse = (c) => { setActiveCourse(c); setIsPracticing(false); };
  const startPractice = () => { setIsPracticing(true); setPracticeIndex(0); setPracticeSuccess(false); };

  // Real-time practice validation
  useEffect(() => {
    if (isPracticing && activeCourse) {
      const target = activeCourse.targets[practiceIndex];
      const detected = lastResult?.gesture?.sign?.toUpperCase();
      const ok = lastResult?.gesture?.confidence > 0.7 && detected === target;
      if (ok) {
        setPracticeSuccess(true);
        const t = setTimeout(() => {
          if (practiceIndex < activeCourse.targets.length - 1) {
            setPracticeIndex(i => i + 1);
            setPracticeSuccess(false);
          }
        }, 2000);
        return () => clearTimeout(t);
      }
    }
  }, [lastResult, isPracticing, practiceIndex, activeCourse]);

  /* ── Filtered resources ── */
  const resources = PDF_CATALOG.filter(r => filterLevel === 'All' || r.level === filterLevel);

  /* ═══════════ Course Detail ═══════════ */
  if (activeCourse) {
    const target = activeCourse.targets[practiceIndex];
    return (
      <div className="learning-container">
        <div className="course-view glass-card animate-fade-in">
          <div className="card-header">
            <span className="card-title">
              <button className="btn btn-ghost btn-xs" onClick={() => setActiveCourse(null)} style={{marginRight:12}}>{I.arrowL()}</button>
              {activeCourse.title}
            </span>
            <div className="learning-tabs">
              <button className={`btn btn-sm ${!isPracticing ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setIsPracticing(false)}>Lesson</button>
              <button className={`btn btn-sm ${isPracticing ? 'btn-primary' : 'btn-ghost'}`} onClick={startPractice}>AI Practice</button>
              <button className="btn btn-sm btn-accent" onClick={() => handlePdf(activeCourse.pdfId, 'download')}>{I.download(14)} PDF</button>
            </div>
          </div>

          <div className="card-body">
            {!isPracticing ? (
              <div className="lesson-content animate-fade-in">
                <div className="lesson-video-placeholder">
                  <div className="dataset-animation" style={{width:'100%',height:'100%',borderRadius:'inherit'}}>
                    <div className="simulation-overlay">Tutorial Video: Hand Shapes</div>
                  </div>
                </div>
                <div className="lesson-text">
                  <h3>Overview of {activeCourse.title}</h3>
                  <p>{activeCourse.desc}</p>
                  <div className="curriculum-list">
                    {activeCourse.targets.map((t, i) => (
                      <div key={i} className="curriculum-item">
                        <span className="item-num">{i+1}</span>
                        <span className="item-label">Introduction to sign "{t}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="practice-view animate-fade-in">
                <div className="practice-header">
                  <div className="target-card">
                    <span className="target-label">Practice Sign</span>
                    <h2 className="target-word">{target}</h2>
                  </div>
                  <div className="practice-progress">Step {practiceIndex+1} of {activeCourse.targets.length}</div>
                </div>
                <div className="practice-layout">
                  <div className="camera-practice-box">
                    <div className={`practice-status-overlay ${practiceSuccess ? 'success' : ''}`}>
                      {practiceSuccess ? (
                        <div className="success-anim">{I.check()}<span>Correct!</span></div>
                      ) : (
                        <div className="waiting-anim"><div className="pulse-ring"/><span>Show the sign "{target}"</span></div>
                      )}
                    </div>
                    <div className="practice-hint-text">AI is watching... Position your hand in view.</div>
                  </div>
                  <div className="reference-box">
                    <div className="reference-label">Correct Form</div>
                    <div className="reference-animation">
                      <video key={target} src={`http://localhost:5000/api/dataset/${target.toLowerCase()}/0.mp4`} autoPlay loop muted playsInline className="reference-video"/>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ Main Dashboard ═══════════ */
  return (
    <div className="learning-container">
      <div className="learning-panel glass-card">
        <div className="card-header">
          <span className="card-title">{I.book(20)}<span style={{marginLeft:10}}>Learning Platform</span></span>
          <div className="learning-tabs">
            <button className={`btn btn-sm ${activeSection==='courses' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSection('courses')}>Courses</button>
            <button className={`btn btn-sm ${activeSection==='resources' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSection('resources')}>Resources & PDFs</button>
          </div>
        </div>

        <div className="card-body">
          {/* ── Courses ── */}
          {activeSection === 'courses' && (
            <div className="courses-section animate-fade-in">
              {['Beginner','Intermediate','Advanced'].map(level => {
                const list = COURSES.filter(c => c.level === level);
                if (!list.length) return null;
                return (
                  <div className="level-section" key={level}>
                    <div className="level-header-row">
                      <span className={`level-header-badge ${level.toLowerCase()}`}>
                        {level === 'Beginner' ? '🟢' : level === 'Intermediate' ? '🟡' : '🔴'} {level}
                      </span>
                    </div>
                    <div className="courses-grid">
                      {list.map(course => (
                        <div key={course.id} className="course-card" id={`course-${course.id}`}>
                          <div className="course-icon-container">{course.icon}</div>
                          <div className="course-info">
                            <h3 className="course-title">{course.title}</h3>
                            <span className={`level-badge level-${course.level.toLowerCase()}`}>{course.level}</span>
                            <p className="course-desc">{course.desc}</p>
                            <div className="course-meta">
                              <span>{I.book(12)} {course.lessons} lessons</span>
                              <span>{I.clock()} {course.duration}</span>
                            </div>
                          </div>
                          <button className="btn btn-primary btn-sm course-start-btn" onClick={() => handleStartCourse(course)}>Start Learning</button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Resources & PDFs ── */}
          {activeSection === 'resources' && (
            <div className="resources-section animate-fade-in">
              <div className="resources-toolbar">
                <div className="filter-pills">
                  {['All','Beginner','Intermediate','Advanced','All Levels'].map(lv => (
                    <button key={lv} className={`pill ${filterLevel===lv ? 'active' : ''}`} onClick={() => setFilterLevel(lv)}>{lv}</button>
                  ))}
                </div>
              </div>

              <div className="resources-list">
                {resources.map(res => (
                  <div key={res.id} className="resource-item">
                    <div className="resource-icon-container">{I.pdf()}</div>
                    <div className="resource-info">
                      <span className="resource-title">{res.title}</span>
                      <span className="resource-meta">
                        PDF · Generated instantly in browser
                        <span className={`resource-level-tag ${res.level.toLowerCase().replace(' ','-')}`}>{res.level}</span>
                      </span>
                    </div>
                    <div className="resource-actions">
                      <button
                        className={`btn btn-ghost btn-sm ${busyId===res.id+'view' ? 'btn-loading' : ''}`}
                        onClick={() => handlePdf(res.id, 'view')}
                        disabled={!!busyId}
                      >
                        {I.eye()} View
                      </button>
                      <button
                        className={`btn btn-primary btn-sm ${busyId===res.id+'download' ? 'btn-loading' : ''}`}
                        onClick={() => handlePdf(res.id, 'download')}
                        disabled={!!busyId}
                      >
                        {busyId===res.id+'download' ? 'Downloading…' : <>{I.download()} Download</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="resources-info-box">
                <strong>📚 About ISL Learning PDFs</strong>
                <p>
                  These PDFs cover Indian Sign Language from beginner to advanced level,
                  including the ISL alphabet, numbers, common phrases, grammar, advanced
                  conversation techniques, a reference dictionary, and practice exercises.
                  Click <strong>Download</strong> to save or <strong>View</strong> to read inline. PDFs are generated instantly in your browser.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPanel;
