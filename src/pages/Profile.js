// src/pages/Profile.js

import React, { useState, useEffect } from 'react';

// Inline ProgressDashboard component used in Profile.
const ProgressDashboard = ({ progressData, onUploadPhoto }) => {
  return (
    <div
      style={{
        padding: '1rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}
    >
      <h2 style={{ color: '#2ecc71' }}>Your Progress</h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p>
            <strong>Completed Workouts:</strong> {progressData.completedWorkouts} / {progressData.totalWorkouts}
          </p>
        </div>
        <div>
          <p>
            <strong>Total Calories Burned:</strong> {progressData.caloriesBurned} kcal
          </p>
        </div>
        <div>
          <p>
            <strong>Average Duration:</strong> {progressData.averageDuration} mins
          </p>
        </div>
      </div>
      {/* Progress Chart Placeholder */}
      <div style={{ marginTop: '1rem', background: '#f1f1f1', padding: '1rem', borderRadius: '4px' }}>
        Progress Chart (Placeholder)
      </div>
      {/* Picture Upload */}
      <div style={{ marginTop: '1rem' }}>
        <h4>Progress Photos</h4>
        <button
          onClick={onUploadPhoto}
          style={{
            padding: '0.5rem 1rem',
            background: '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Upload Progress Photo
        </button>
      </div>
    </div>
  );
};

const Profile = () => {
  // Profile state holds personal details.
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    weight: '',
    height: '',
    age: '',
    gender: '',
    fitnessGoal: '',
    profilePic: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Workout history state.
  const [workoutHistory, setWorkoutHistory] = useState([]);

  // Dummy progress data for the dashboard (replace with API data later).
  const [progressData, setProgressData] = useState({
    completedWorkouts: 5,
    totalWorkouts: 10,
    caloriesBurned: 2500,
    averageDuration: 45
  });

  // Fetch profile data on mount.
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Example: Fetch from "/api/profile"
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Error fetching profile');
        const data = await res.json();
        // Assuming data.profile contains the profile information.
        setProfile(data.profile);
      } catch (err) {
        console.error(err);
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch workout history.
  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      try {
        // Example: Fetch from "/api/workout-history"
        const res = await fetch('/api/workout-history');
        if (!res.ok) throw new Error('Error fetching workout history.');
        const data = await res.json();
        // Assuming data.history is an array of workout entry objects.
        setWorkoutHistory(data.history);
      } catch (err) {
        console.error('Failed to load workout history.', err);
      }
    };

    fetchWorkoutHistory();
  }, []);

  // Profile form change handler.
  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  // Update profile handler.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Example: PUT request to "/api/profile"
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Profile updated successfully!');
      } else {
        setError('Failed to update profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  // Dummy picture upload handler.
  const handleUploadPhoto = () => {
    alert('Picture upload functionality to be integrated.');
  };

  // Print Profile handler.
  const handlePrintProfile = () => {
    const printContent = document.getElementById('printableProfile').innerHTML;
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Profile</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #34495e; }
            p { margin: 0.5rem 0; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left-Hand Navigation */}
      <nav
        style={{
          width: '250px',
          backgroundColor: '#f7f7f7',
          padding: '1rem',
          borderRight: '1px solid #ddd'
        }}
      >
        <h3 style={{ color: '#34495e' }}>Menu</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '1rem' }}>
            <a href="#profile-info" style={{ textDecoration: 'none', color: '#34495e' }}>Profile Information</a>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <a href="#my-workouts" style={{ textDecoration: 'none', color: '#34495e' }}>My Workouts/Challenges</a>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <a href="#meal-plans" style={{ textDecoration: 'none', color: '#34495e' }}>Meal Plans</a>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <a href="#progress-history" style={{ textDecoration: 'none', color: '#34495e' }}>Progress History/Analytics</a>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <a href="#achievements" style={{ textDecoration: 'none', color: '#34495e' }}>Achievements/Badges</a>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <a href="#settings" style={{ textDecoration: 'none', color: '#34495e' }}>Settings</a>
          </li>
          <li style={{ marginBottom: '1rem' }}>
            <a href="#help-support" style={{ textDecoration: 'none', color: '#34495e' }}>Help & Support</a>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '1rem' }}>
        {/* Progress Dashboard Section */}
        <div style={{ marginBottom: '2rem' }}>
          <ProgressDashboard progressData={progressData} onUploadPhoto={handleUploadPhoto} />
        </div>

        {/* Profile Information Section */}
        <section id="profile-info" style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#34495e' }}>Profile Information</h2>
          {loading && <p>Loading...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label>Weight (kg):</label>
                <input
                  type="number"
                  name="weight"
                  value={profile.weight}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Height (cm):</label>
                <input
                  type="number"
                  name="height"
                  value={profile.height}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label>Age:</label>
                <input
                  type="number"
                  name="age"
                  value={profile.age}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Gender:</label>
                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Fitness Goal:</label>
              <input
                type="text"
                name="fitnessGoal"
                value={profile.fitnessGoal}
                onChange={handleChange}
                placeholder="e.g., Lose weight, Build muscle"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Update Profile
            </button>
          </form>
        </section>

        {/* Workout History Section */}
        <section id="progress-history" style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#34495e' }}>Workout History</h2>
          {workoutHistory.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Date</th>
                  <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Workout</th>
                  <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Duration</th>
                  <th style={{ border: '1px solid #ddd', padding: '0.5rem' }}>Calories Burned</th>
                </tr>
              </thead>
              <tbody>
                {workoutHistory.map((entry, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                      {entry.workoutName}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                      {entry.duration} mins
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
                      {entry.caloriesBurned} kcal
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No workout history available.</p>
          )}
        </section>

        {/* Print Profile Button */}
        <button
          onClick={handlePrintProfile}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#7f8c8d',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Print Profile
        </button>
      </div>

      {/* Hidden Printable Profile Section */}
      <div id="printableProfile" style={{ display: 'none' }}>
        <h1>My Profile</h1>
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Weight:</strong> {profile.weight} kg</p>
        <p><strong>Height:</strong> {profile.height} cm</p>
        <p><strong>Age:</strong> {profile.age}</p>
        <p><strong>Gender:</strong> {profile.gender}</p>
        <p><strong>Fitness Goal:</strong> {profile.fitnessGoal}</p>
      </div>
    </div>
  );
};

export default Profile;
