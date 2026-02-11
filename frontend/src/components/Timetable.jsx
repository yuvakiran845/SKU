import React, { useMemo } from 'react';
import './Timetable.css';

// Timetable data based on your image
const timetableData = {
    'MON': [
        { time: '9:30-10:30', subject: 'ML' },
        { time: '10:30-11:30', subject: 'C&NS' },
        { time: '11:30-12:30', subject: 'CC' },
        { time: '1:30-2:30', subject: 'STM' },
        { time: '2:30-3:30', subject: 'EI' },
        { time: '3:30-4:30', subject: 'BDA' },
    ],
    'TUE': [
        { time: '9:30-10:30', subject: 'STM' },
        { time: '10:30-11:30', subject: 'C&NS' },
        { time: '11:30-12:30', subject: 'ML' },
        { time: '1:30-3:30', subject: 'BDA LAB / ML LAB', colspan: 2 },
        { time: '3:30-4:30', subject: 'CC' },
    ],
    'WED': [
        { time: '9:30-11:30', subject: 'BDA LAB / ML LAB', colspan: 2 },
        { time: '11:30-12:30', subject: 'ML' },
        { time: '1:30-2:30', subject: 'STM' },
        { time: '2:30-3:30', subject: 'CC' },
    ],
    'THU': [
        { time: '9:30-10:30', subject: 'C&NS' },
        { time: '10:30-11:30', subject: 'CC' },
        { time: '11:30-12:30', subject: 'EI' },
        { time: '1:30-2:30', subject: 'BDA' },
        { time: '2:30-3:30', subject: 'STM' },
        { time: '3:30-4:30', subject: 'LIBRARY / NCC / SEMINAR' },
    ],
    'FRI': [
        { time: '9:30-10:30', subject: 'EI' },
        { time: '10:30-11:30', subject: 'ML' },
        { time: '11:30-12:30', subject: 'BDA' },
        { time: '1:30-3:30', subject: 'SOC Lab', colspan: 2 },
    ],
    'SAT': [
        { time: '9:30-10:30', subject: 'CC' },
        { time: '10:30-11:30', subject: 'EI' },
        { time: '11:30-12:30', subject: 'BDA' },
        { time: '1:30-2:30', subject: 'C&NS' },
        { time: '2:30-3:30', subject: 'Technical Paper Writing' },
    ],
};

const Timetable = () => {
    // Get current day
    const currentDay = useMemo(() => {
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        return days[new Date().getDay()];
    }, []);

    // Get today's schedule
    const todaySchedule = useMemo(() => {
        return timetableData[currentDay] || [];
    }, [currentDay]);

    return (
        <div className="timetable-section">
            {/* Today's Schedule - Quick View */}
            <div className="today-schedule-card">
                <div className="schedule-header">
                    <div>
                        <h3>Today's Schedule</h3>
                        <p className="schedule-date">{currentDay} - {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="schedule-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                        </svg>
                        {todaySchedule.length} Classes
                    </div>
                </div>

                <div className="today-classes">
                    {todaySchedule.length > 0 ? (
                        todaySchedule.map((period, index) => (
                            <div key={index} className="class-slot">
                                <div className="class-time">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                                    </svg>
                                    {period.time}
                                </div>
                                <div className="class-subject">{period.subject}</div>
                            </div>
                        ))
                    ) : (
                        <div className="no-classes">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                            </svg>
                            <p>No classes scheduled for {currentDay === 'SUN' ? 'Sunday' : 'today'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Full Week Timetable - Table Format */}
            <div className="full-timetable-card">
                <div className="timetable-header">
                    <h3>Weekly Timetable</h3>
                    <p>III Year - II Semester | CSE Department</p>
                </div>

                <div className="timetable-scroll">
                    <table className="timetable-table">
                        <thead>
                            <tr>
                                <th className="day-column">Day</th>
                                <th>9:30-10:30</th>
                                <th>10:30-11:30</th>
                                <th>11:30-12:30</th>
                                <th className="break-column">Break</th>
                                <th>1:30-2:30</th>
                                <th>2:30-3:30</th>
                                <th>3:30-4:30</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(timetableData).map((day) => (
                                <tr key={day} className={day === currentDay ? 'today-row' : ''}>
                                    <td className="day-cell">
                                        {day === currentDay && <span className="today-indicator"></span>}
                                        <strong>{day}</strong>
                                    </td>
                                    {day === 'TUE' ? (
                                        <>
                                            <td className="subject-cell">STM</td>
                                            <td className="subject-cell">C&NS</td>
                                            <td className="subject-cell">ML</td>
                                            <td className="break-cell">🥗</td>
                                            <td className="subject-cell lab-cell" colSpan={2}>BDA LAB / ML LAB</td>
                                            <td className="subject-cell">CC</td>
                                        </>
                                    ) : day === 'WED' ? (
                                        <>
                                            <td className="subject-cell lab-cell" colSpan={2}>BDA LAB / ML LAB</td>
                                            <td className="subject-cell">ML</td>
                                            <td className="break-cell">🥗</td>
                                            <td className="subject-cell">STM</td>
                                            <td className="subject-cell">CC</td>
                                            <td className="subject-cell empty-cell"></td>
                                        </>
                                    ) : day === 'FRI' ? (
                                        <>
                                            <td className="subject-cell">EI</td>
                                            <td className="subject-cell">ML</td>
                                            <td className="subject-cell">BDA</td>
                                            <td className="break-cell">🥗</td>
                                            <td className="subject-cell lab-cell" colSpan={2}>SOC Lab</td>
                                            <td className="subject-cell empty-cell"></td>
                                        </>
                                    ) : (
                                        <>
                                            {timetableData[day].slice(0, 3).map((period, idx) => (
                                                <td key={idx} className="subject-cell">{period.subject}</td>
                                            ))}
                                            <td className="break-cell">🥗</td>
                                            {timetableData[day].slice(3).map((period, idx) => (
                                                <td key={idx} className="subject-cell">{period.subject}</td>
                                            ))}
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="timetable-footer">
                    <div className="legend">
                        <div className="legend-item">
                            <span className="legend-dot blue"></span>
                            <span>Theory</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot purple"></span>
                            <span>Lab</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot green"></span>
                            <span>Current Day</span>
                        </div>
                    </div>
                    <p className="legend-note">Last updated: Feb 2026</p>
                </div>
            </div>
        </div>
    );
};

export default Timetable;
