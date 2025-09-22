
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require('fs').promises;
const path = require('path');

const PORT = process.env.PORT || 5000;

app.use(express.static("public"));
app.use(express.json());

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("ผู้ใช้ใหม่เชื่อมต่อ:", socket.id);

  if (waitingUser) {
    const roomId = `${waitingUser.id}#${socket.id}`;
    socket.join(roomId);
    waitingUser.join(roomId);

    socket.roomId = roomId;
    waitingUser.roomId = roomId;

    io.to(roomId).emit("startChat");
    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit("waiting");
  }

  socket.on("message", (msg) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit("message", msg);
    }
  });

  socket.on("disconnect", () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit("end");
    } else if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

// GET feedback data
app.get('/api/feedback', async (req, res) => {
  try {
    const feedbackFile = path.join(__dirname, 'feedback.json');
    const data = await fs.readFile(feedbackFile, 'utf8');
    const feedbacks = JSON.parse(data);

    // คำนวณสถิติ
    const stats = {
      total: feedbacks.length,
      averageRating: feedbacks.length > 0 ? 
        (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1) : 0,
      ratingDistribution: {
        1: feedbacks.filter(f => f.rating === 1).length,
        2: feedbacks.filter(f => f.rating === 2).length,
        3: feedbacks.filter(f => f.rating === 3).length,
        4: feedbacks.filter(f => f.rating === 4).length,
        5: feedbacks.filter(f => f.rating === 5).length,
      }
    };

    res.json({
      stats,
      feedbacks: feedbacks.slice(-50) // ส่งแค่ 50 รายการล่าสุด
    });

  } catch (error) {
    res.json({ stats: { total: 0, averageRating: 0 }, feedbacks: [] });
  }
});

// POST feedback data (ส่งข้อมูล feedback ใหม่)
app.post('/api/feedback', async (req, res) => {
  try {
    const { rating, comment, timestamp, userAgent } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'กรุณาให้คะแนนระหว่าง 1-5' });
    }

    const feedbackFile = path.join(__dirname, 'feedback.json');
    let feedbacks = [];

    try {
      const data = await fs.readFile(feedbackFile, 'utf8');
      feedbacks = JSON.parse(data);
    } catch (error) {
      // ถ้าไฟล์ไม่มีหรือไม่สามารถอ่านได้ ให้เริ่มต้นด้วย array ว่าง
      feedbacks = [];
    }

    // สร้างข้อมูล feedback ใหม่
    const newFeedback = {
      id: Date.now().toString(),
      rating: parseInt(rating),
      comment: comment || '',
      created: new Date().toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: timestamp || new Date().toISOString(),
      userAgent: userAgent || 'Unknown'
    };

    // เพิ่มข้อมูลใหม่
    feedbacks.push(newFeedback);

    // บันทึกกลับไปในไฟล์
    await fs.writeFile(feedbackFile, JSON.stringify(feedbacks, null, 2), 'utf8');

    console.log('ได้รับ feedback ใหม่:', newFeedback);

    res.json({ 
      success: true, 
      message: 'ขอบคุณสำหรับความคิดเห็น!',
      feedback: newFeedback 
    });

  } catch (error) {
    console.error('ข้อผิดพลาดในการบันทึก feedback:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
});

http.listen(PORT, "0.0.0.0", () => {
  console.log("เซิร์ฟเวอร์เริ่มที่พอร์ต " + PORT);
});
