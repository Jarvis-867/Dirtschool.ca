/* Dirt School Practice Test Engine
   Drop this in alongside practice-test.css.
   Each test page defines a TEST_CONFIG object with title, questions, etc.
   Engine handles UI, scoring, timer, review, persistence (sessionStorage). */

(function() {
  'use strict';

  if (typeof TEST_CONFIG === 'undefined') {
    console.error('TEST_CONFIG not defined on this page');
    return;
  }

  const config = TEST_CONFIG;
  const state = {
    currentQ: 0,
    answers: {},
    startTime: null,
    timerInterval: null,
    timeLeft: (config.timeLimitMin || 0) * 60,
  };

  // -------- Render helpers --------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function fmtTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // -------- Start screen --------
  function renderStart() {
    const startEl = $('#start-screen');
    startEl.innerHTML = `
      <h2>${config.title}</h2>
      <p style="color: var(--text-muted); margin-bottom: 10px;">${config.description || ''}</p>
      <div class="test-info">
        <div class="info-card">
          <div class="label">Questions</div>
          <div class="value">${config.questions.length}</div>
        </div>
        <div class="info-card">
          <div class="label">Time Limit</div>
          <div class="value">${config.timeLimitMin ? config.timeLimitMin + ' min' : 'None'}</div>
        </div>
        <div class="info-card">
          <div class="label">Pass Mark</div>
          <div class="value">${config.passMark || 70}%</div>
        </div>
      </div>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin: 20px 0;">
        ${config.instructions || 'Read each question carefully. You can go back and change answers before submitting.'}
      </p>
      <button class="btn" id="start-btn">Start Test</button>
      <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 15px;">
        Free • No signup • Real exam-style questions
      </p>
    `;
    $('#start-btn').addEventListener('click', startTest);
  }

  // -------- Test screen --------
  function startTest() {
    state.startTime = Date.now();
    if (config.shuffle) {
      config.questions = shuffleArray(config.questions);
    }
    $('#start-screen').style.display = 'none';
    $('#test-screen').style.display = 'block';

    if (config.timeLimitMin) {
      state.timerInterval = setInterval(tick, 1000);
    }
    renderQuestion();
  }

  function tick() {
    state.timeLeft--;
    const t = $('#timer');
    if (t) {
      t.textContent = fmtTime(state.timeLeft);
      if (state.timeLeft <= 60) t.classList.add('warning');
    }
    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      submitTest();
    }
  }

  function renderQuestion() {
    const q = config.questions[state.currentQ];
    const total = config.questions.length;
    const progress = ((state.currentQ + 1) / total) * 100;

    const optionLetters = ['A', 'B', 'C', 'D', 'E'];

    $('#test-screen').innerHTML = `
      <div class="progress-bar">
        <div class="progress-text"><strong>${state.currentQ + 1}</strong> / ${total}</div>
        <div class="progress-fill-wrap">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        ${config.timeLimitMin ? `<div class="timer" id="timer">${fmtTime(state.timeLeft)}</div>` : ''}
      </div>
      <div class="question-card">
        ${q.category ? `<div class="question-meta">${q.category}</div>` : ''}
        <div class="question-text">${q.q}</div>
        <ul class="options">
          ${q.options.map((opt, i) => `
            <li class="option ${state.answers[state.currentQ] === i ? 'selected' : ''}" data-idx="${i}">
              <span class="option-letter">${optionLetters[i]}</span>
              <span class="option-text">${opt}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      <div class="nav-buttons">
        <button class="btn btn-secondary" id="prev-btn" ${state.currentQ === 0 ? 'disabled' : ''}>← Previous</button>
        ${state.currentQ === total - 1
          ? `<button class="btn" id="submit-btn">Submit Test</button>`
          : `<button class="btn" id="next-btn">Next →</button>`
        }
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <button class="btn btn-secondary" id="finish-early-btn" style="font-size: 0.85rem; padding: 8px 16px;">
          Finish & See Score
        </button>
      </div>
    `;

    // Wire up options
    $$('.option').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx);
        state.answers[state.currentQ] = idx;
        $$('.option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
      });
    });

    // Wire up nav
    const prev = $('#prev-btn');
    const next = $('#next-btn');
    const sub = $('#submit-btn');
    const finish = $('#finish-early-btn');
    if (prev) prev.addEventListener('click', () => { state.currentQ--; renderQuestion(); });
    if (next) next.addEventListener('click', () => { state.currentQ++; renderQuestion(); });
    if (sub) sub.addEventListener('click', submitTest);
    if (finish) finish.addEventListener('click', () => {
      if (confirm('Finish test now and see your score?')) submitTest();
    });
  }

  // -------- Results screen --------
  function submitTest() {
    if (state.timerInterval) clearInterval(state.timerInterval);

    let correct = 0;
    config.questions.forEach((q, i) => {
      if (state.answers[i] === q.answer) correct++;
    });
    const total = config.questions.length;
    const pct = Math.round((correct / total) * 100);
    const passed = pct >= (config.passMark || 70);
    const optionLetters = ['A', 'B', 'C', 'D', 'E'];

    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const elapsedStr = `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

    $('#test-screen').style.display = 'none';
    $('#results-screen').style.display = 'block';

    $('#results-screen').innerHTML = `
      <div class="score-card">
        <div style="color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.85rem;">Your Score</div>
        <div class="score-big ${passed ? 'pass' : 'fail'}">${pct}%</div>
        <div class="score-detail">
          ${correct} of ${total} correct • Time: ${elapsedStr}
        </div>
        <div class="pass-fail-msg">
          <strong>${passed ? '✓ PASS' : '✗ NOT YET'}</strong> — 
          ${passed
            ? `You scored above the ${config.passMark || 70}% pass mark. Good work. Now run the full guide and write the real test.`
            : `You're below the ${config.passMark || 70}% pass mark. Don't write the real test yet. Review what you missed below, then study before booking.`
          }
        </div>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <button class="btn" id="retake-btn">Retake Test</button>
          <button class="btn btn-secondary" id="review-btn">Review Answers</button>
        </div>
      </div>
      <div class="cta-box">
        <h3>Ready for the full study guide?</h3>
        <p>This is just a sample. The full ${config.guideName || 'Dirt School'} guide has more questions, full study plan, 10-minute cram sheet, and breakdowns of every exam trap.</p>
        <a class="btn" href="${config.guideUrl || 'https://dirtschool.gumroad.com'}" target="_blank" rel="noopener">Get the Full Guide — $9.99 →</a>
      </div>
      <div class="review-section" id="review-section" style="display: none;">
        <h3>Answer Review</h3>
        ${config.questions.map((q, i) => {
          const userAns = state.answers[i];
          const isRight = userAns === q.answer;
          return `
            <div class="review-question ${isRight ? '' : 'wrong'}">
              <div class="review-q-text">${i + 1}. ${q.q}</div>
              <div class="review-a your-answer">
                Your answer: ${userAns !== undefined ? optionLetters[userAns] + ') ' + q.options[userAns] : '<em>Not answered</em>'}
              </div>
              ${!isRight ? `
                <div class="review-a correct">
                  Correct answer: ${optionLetters[q.answer]}) ${q.options[q.answer]}
                </div>
              ` : ''}
              ${q.explanation ? `<div class="review-explanation"><strong>Why:</strong> ${q.explanation}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    $('#retake-btn').addEventListener('click', () => location.reload());
    $('#review-btn').addEventListener('click', () => {
      const r = $('#review-section');
      r.style.display = r.style.display === 'none' ? 'block' : 'none';
      if (r.style.display === 'block') r.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // -------- Init --------
  document.addEventListener('DOMContentLoaded', renderStart);
})();
