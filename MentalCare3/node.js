// ตัวอย่าง API endpoints สำหรับระบบนับผู้เข้าชม
// ใช้กับ Node.js + Express + Database (MongoDB/MySQL/PostgreSQL)

const express = require('express');
const app = express();

// กำหนด storage สำหรับเก็บข้อมูล (ใช้ในหน่วยความจำสำหรับตัวอย่าง)
// ในการใช้งานจริงควรใช้ Database
let visitors = new Map(); // เก็บข้อมูล visitor
let activeSessions = new Map(); // เก็บ session ที่ active
let dailyStats = new Map(); // เก็บสถิติรายวัน

// Middleware
app.use(express.json());

// ฟังก์ชันช่วยเหลือ
function getDateKey(date = new Date()) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getWeekKey(date = new Date()) {
    const week = Math.ceil((date.getDate() - date.getDay()) / 7);
    return `${date.getFullYear()}-W${week}`;
}

// API: ติดตามผู้เข้าชม
app.post('/api/track-visitor', (req, res) => {
    try {
        const {
            visitorID,
            sessionID,
            timestamp,
            isNewSession,
            isNewVisit,
            userAgent,
            language,
            screen,
            referrer,
            page
        } = req.body;

        const today = getDateKey();
        const now = new Date();

        // บันทึกข้อมูล visitor
        if (!visitors.has(visitorID)) {
            visitors.set(visitorID, {
                firstVisit: timestamp,
                totalVisits: 0,
                totalSessions: 0,
                lastVisit: timestamp,
                userAgent,
                language,
                screen
            });
        }

        const visitor = visitors.get(visitorID);

        if (isNewVisit) {
            visitor.totalVisits += 1;
            visitor.lastVisit = timestamp;
        }

        if (isNewSession) {
            visitor.totalSessions += 1;

            // เพิ่ม active session
            activeSessions.set(sessionID, {
                visitorID,
                startTime: now,
                lastHeartbeat: now,
                page
            });
        }

        // อัปเดตสถิติรายวัน
        if (!dailyStats.has(today)) {
            dailyStats.set(today, {
                uniqueVisitors: new Set(),
                totalVisits: 0,
                totalSessions: 0
            });
        }

        const todayStats = dailyStats.get(today);
        todayStats.uniqueVisitors.add(visitorID);

        if (isNewVisit) {
            todayStats.totalVisits += 1;
        }

        if (isNewSession) {
            todayStats.totalSessions += 1;
        }

        res.json({ success: true, visitorID, sessionID });
    } catch (error) {
        console.error('Track visitor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API: Heartbeat - อัปเดตสถานะ online
app.post('/api/visitor-heartbeat', (req, res) => {
    try {
        const { visitorID, sessionID, timestamp } = req.body;

        if (activeSessions.has(sessionID)) {
            activeSessions.get(sessionID).lastHeartbeat = new Date();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API: ออกจากเว็บไซต์
app.post('/api/visitor-exit', (req, res) => {
    try {
        const { sessionID } = req.body;

        if (activeSessions.has(sessionID)) {
            activeSessions.delete(sessionID);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Visitor exit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API: ดึงสถิติผู้เข้าชม
app.get('/api/visitor-stats', (req, res) => {
    try {
        const today = getDateKey();
        const yesterday = getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

        // ทำความสะอาด session ที่ไม่ active (เก่ากว่า 5 นาที)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        for (const [sessionID, session] of activeSessions.entries()) {
            if (session.lastHeartbeat < fiveMinutesAgo) {
                activeSessions.delete(sessionID);
            }
        }

        // คำนวณสถิติ
        const todayStats = dailyStats.get(today) || { uniqueVisitors: new Set(), totalVisits: 0 };
        const yesterdayStats = dailyStats.get(yesterday) || { uniqueVisitors: new Set(), totalVisits: 0 };

        // สถิติสัปดาห์นี้ (คำนวณจาก 7 วันล่าสุด)
        let weeklyUniqueVisitors = new Set();
        let weeklyTotalVisits = 0;

        for (let i = 0; i < 7; i++) {
            const date = getDateKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
            const dayStats = dailyStats.get(date);
            if (dayStats) {
                dayStats.uniqueVisitors.forEach(id => weeklyUniqueVisitors.add(id));
                weeklyTotalVisits += dayStats.totalVisits;
            }
        }

        const stats = {
            today: todayStats.uniqueVisitors.size,
            yesterday: yesterdayStats.uniqueVisitors.size,
            thisWeek: weeklyUniqueVisitors.size,
            total: visitors.size,
            currentOnline: activeSessions.size,
            todayVisits: todayStats.totalVisits,
            totalVisits: Array.from(visitors.values()).reduce((sum, v) => sum + v.totalVisits, 0)
        };

        res.json(stats);
    } catch (error) {
        console.error('Get visitor stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API: ดึงจำนวนคนออนไลน์ในขณะนี้
app.get('/api/visitor-stats/online', (req, res) => {
    try {
        // ทำความสะอาด session ที่ไม่ active
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        for (const [sessionID, session] of activeSessions.entries()) {
            if (session.lastHeartbeat < fiveMinutesAgo) {
                activeSessions.delete(sessionID);
            }
        }

        res.json({ currentOnline: activeSessions.size });
    } catch (error) {
        console.error('Get online stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API: ดึงรายละเอียดผู้เข้าชม (สำหรับ admin)
app.get('/api/visitor-details', (req, res) => {
    try {
        const visitorDetails = Array.from(visitors.entries()).map(([id, data]) => ({
            id,
            ...data,
            isOnline: Array.from(activeSessions.values()).some(session => session.visitorID === id)
        }));

        res.json({
            visitors: visitorDetails,
            activeSessions: Array.from(activeSessions.entries()).map(([sessionID, data]) => ({
                sessionID,
                ...data
            }))
        });
    } catch (error) {
        console.error('Get visitor details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ทำความสะอาดข้อมูลเก่าทุก ๆ 10 นาที
setInterval(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // ลบ session ที่ไม่ active
    for (const [sessionID, session] of activeSessions.entries()) {
        if (session.lastHeartbeat < fiveMinutesAgo) {
            activeSessions.delete(sessionID);
        }
    }

    // ลบสถิติรายวันที่เก่ากว่า 30 วัน
    const thirtyDaysAgo = getDateKey(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    for (const [dateKey] of dailyStats.entries()) {
        if (dateKey < thirtyDaysAgo) {
            dailyStats.delete(dateKey);
        }
    }
}, 10 * 60 * 1000);