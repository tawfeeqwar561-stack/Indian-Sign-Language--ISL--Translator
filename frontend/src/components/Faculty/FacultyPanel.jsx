import React from 'react';
import './FacultyPanel.css';

const FacultyPanel = () => {
  const students = [
    { id: 1, name: 'Rahul Sharma', progress: 85, lastActive: '2 hours ago' },
    { id: 2, name: 'Anjali Gupta', progress: 42, lastActive: '5 mins ago' },
    { id: 3, name: 'Suresh Kumar', progress: 12, lastActive: 'Yesterday' },
  ];

  return (
    <div className="faculty-container animate-fade-in">
      <div className="faculty-grid">
        {/* Stats Section */}
        <div className="faculty-stats">
          <div className="stat-card glass-card">
            <span className="stat-value">24</span>
            <span className="stat-label">Active Students</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-value">12</span>
            <span className="stat-label">Courses Published</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-value">4.8</span>
            <span className="stat-label">Average Rating</span>
          </div>
        </div>

        {/* Students Table */}
        <div className="faculty-main glass-card">
          <div className="card-header">
            <span className="card-title">Student Progress Tracking</span>
          </div>
          <div className="card-body">
            <table className="faculty-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Course Progress</th>
                  <th>Last Active</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${s.progress}%` }} />
                        <span className="progress-text">{s.progress}%</span>
                      </div>
                    </td>
                    <td>{s.lastActive}</td>
                    <td>
                      <button className="btn btn-ghost btn-xs">Message</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="faculty-sidebar glass-card">
          <div className="card-header">
            <span className="card-title">Quick Actions</span>
          </div>
          <div className="card-body faculty-actions">
            <button className="btn btn-primary w-full">Create New Lesson</button>
            <button className="btn btn-ghost w-full">Schedule Group Call</button>
            <button className="btn btn-ghost w-full">Resource Management</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyPanel;
