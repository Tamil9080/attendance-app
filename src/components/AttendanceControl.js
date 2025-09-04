import React from 'react';

const AttendanceControl = ({ studentId, day, status, handleAttendanceChange, showMessage, isLocked }) => {
  const toggleAttendance = () => {
    if (isLocked) {
      showMessage("Day is locked. Click Edit to make changes.");
      return;
    }

    let newStatus;
    let statusMessage;

    if (status === true) {
      newStatus = false;
      statusMessage = "Marked as Absent";
    } else if (status === false) {
      newStatus = null;
      statusMessage = "Attendance cleared";
    } else {
      newStatus = true;
      statusMessage = "Marked as Present";
    }

    handleAttendanceChange(studentId, day, newStatus);
    showMessage(statusMessage);
  };

  let controlContent;
  let className = "attendance-control";

  if (status === true) {
    controlContent = <span>✓</span>;
    className += " present";
  } else if (status === false) {
    controlContent = <span>×</span>;
    className += " absent";
  } else {
    controlContent = <div></div>;
    className += " neutral";
  }

  if (isLocked) {
    className += " locked";
  }

  return (
    <div 
      onClick={toggleAttendance} 
      className={className}
      style={{
        opacity: isLocked ? 0.6 : 1,
        cursor: isLocked ? 'not-allowed' : 'pointer'
      }}
    >
      {controlContent}
    </div>
  );
};

export default AttendanceControl;