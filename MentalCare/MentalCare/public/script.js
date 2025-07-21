<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>แบบประเมินภาวะซึมเศร้า</title>
  <link rel="stylesheet" href="style.css">
  <style>
    body {
      font-family: 'Prompt', sans-serif;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #2d3748;
      padding: 20px;
    }

    .quiz-container {
      max-width: 800px;
      margin: auto;
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    h1 {
      text-align: center;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .question {
      margin-bottom: 20px;
    }

    .question h3 {
      margin-bottom: 10px;
      font-weight: 500;
    }

    .options label {
      display: block;
      margin: 4px 0;
      cursor: pointer;
    }

    .submit-btn {
      display: block;
      width: 100%;
      background: #667eea;
      color: white;
      padding: 15px;
      border: none;
      font-size: 1rem;
      border-radius: 10px;
      cursor: pointer;
      margin-top: 20px;
      transition: background 0.3s;
    }

    .submit-btn:hover {
      background: #5a67d8;
    }

    .result {
      margin-top: 30px;
      text-align: center;
      font-size: 1.2rem;
      font-weight: 500;
    }

    .back-btn {
      margin-top: 20px;
      display: inline-block;
      text-align: center;
      padding: 10px 20px;
      background: #edf2f7;
      border-radius: 10px;
      color: #333;
      text-decoration: none;
      transition: background 0.3s;
    }

    .back-btn:hover {
      background: #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="quiz-container">
    <h1>แบบประเมินอารมณ์</h1>
    <form id="quizForm"></form>
    <button type="submit" class="submit-btn" onclick="calculateScore()">ส่งคำตอบ</button>
    <div id="result" class="result"></div>
    <a class="back-btn" href="index.html">← กลับหน้าแรก</a>
  </div>

  <script>
    const questionTexts = [
      "รู้สึกเบื่อหน่าย", 
      "ไม่มีความสุขกับสิ่งที่เคยชอบ",
      "นอนไม่หลับหรือหลับมากไป",
      "รู้สึกผิดหรือไร้ค่า",
      "รู้สึกเหนื่อยง่าย",
      "รู้สึกไร้ประโยชน์",
      "ไม่มีสมาธิ",
      "เคลื่อนไหวช้าลงหรือกระวนกระวาย",
      "มีความคิดทำร้ายตัวเอง",
      "วิตกกังวลตลอดเวลา",
      "รู้สึกตื่นตระหนก",
      "หายใจเร็วหรือหายใจไม่ออก",
      "มือสั่น ใจสั่น",
      "รู้สึกร้อนวูบวาบ เหงื่อออก",
      "ปวดหัว เจ็บหน้าอก",
      "รู้สึกสิ้นหวัง",
      "รู้สึกโดดเดี่ยว",
      "ไม่อยากคุยกับใคร",
      "มีปัญหากับคนรอบตัว",
      "รู้สึกว่าควบคุมชีวิตตัวเองไม่ได้",
      "กลัวการออกไปข้างนอก",
      "ระแวงคนอื่น",
      "โกรธง่าย",
      "หงุดหงิดบ่อย",
      "ร้องไห้โดยไม่มีสาเหตุ",
      "รู้สึกชีวิตไม่มีเป้าหมาย",
      "นึกถึงความผิดพลาดในอดีตตลอด",
      "กลัวอนาคต",
      "ไม่มีแรงบันดาลใจ",
      "หมดศรัทธาในตัวเอง",
      "รู้สึกไม่มีใครเข้าใจ",
      "ไม่อยากกินข้าว หรือกินมากเกินไป",
      "น้ำหนักลดลงหรือเพิ่มขึ้นผิดปกติ",
      "ฝันร้ายหรือสะดุ้งกลางคืน",
      "คิดวนในหัวไม่หยุด",
      "เจ็บป่วยบ่อย",
      "เบื่องานหรือการเรียน",
      "มีพฤติกรรมหลีกเลี่ยงความจริง",
      "รู้สึกช้า อืดอาด",
      "อยากหนีไปที่ไหนสักแห่ง",
      "เปรียบเทียบตัวเองกับคนอื่น",
      "โทษตัวเองเสมอ",
      "คิดว่าไม่มีทางออก",
      "รู้สึกไม่มั่นคงในชีวิต",
      "ไม่อยากตื่นนอน"
    ];

    const questions = questionTexts.map((text, i) => ({
      text: `ข้อที่ ${i + 1}: ${text}`,
      options: [
        { text: 'ไม่เลย', score: 0 },
        { text: 'บางวัน', score: 1 },
        { text: 'บ่อยครั้ง', score: 2 },
        { text: 'แทบทุกวัน', score: 3 }
      ]
    }));


    const quizForm = document.getElementById('quizForm');

    questions.forEach((q, index) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'question';
      qDiv.innerHTML = `<h3>${q.text}</h3>`;
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'options';

      q.options.forEach((opt, i) => {
        const id = `q${index}_${i}`;
        optionsDiv.innerHTML += `
          <label>
            <input type="radio" name="q${index}" value="${opt.score}" required> ${opt.text}
          </label>
        `;
      });

      qDiv.appendChild(optionsDiv);
      quizForm.appendChild(qDiv);
    });

    function calculateScore() {
      let score = 0;
      for (let i = 0; i < questions.length; i++) {
        const radios = document.getElementsByName(`q${i}`);
        for (const radio of radios) {
          if (radio.checked) {
            score += parseInt(radio.value);
          }
        }
      }

      const result = document.getElementById('result');
      let level = '';
      if (score < 10) level = 'ไม่มีแนวโน้มซึมเศร้า';
      else if (score < 20) level = 'แนวโน้มน้อย';
      else if (score < 30) level = 'แนวโน้มปานกลาง';
      else level = 'แนวโน้มสูง ควรปรึกษาผู้เชี่ยวชาญ';

      result.innerHTML = `คะแนนรวม: ${score} / 135<br>ผลประเมิน: <strong>${level}</strong>`;
    }
  </script>
</body>
</html>
