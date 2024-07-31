import React, { useState } from 'react';
import axios from 'axios';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = () => {
    // Validate password requirements
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    if (!newPassword.match(/[A-Z]/)) {
      alert('Password must contain uppercase letters.');
      return;
    }

    if (!newPassword.match(/[a-z]/)) {
      alert('Password must contain lowercase letters.');
      return;
    }

    if (!newPassword.match(/[0-9]/)) {
      alert('Password must contain numbers.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }

    // Send password change request to the backend API
    axios.post('/api/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    })
      .then(response => {
        alert('Password changed successfully!');
        // Reset form fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch(error => {
        console.error('Error changing password:', error);
        alert('Failed to change password. Please try again.');
      });
  };

  return (
    <div>
      <h2>Change Password</h2>
      <input
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={e => setCurrentPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
      />
      <button onClick={handleChangePassword}>Change Password</button>
    </div>
  );
};

export default ChangePassword;