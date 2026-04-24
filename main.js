let currentFormat = 'video';
let cardData = [];

function setFormat(btn) {
  document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFormat = btn.dataset.format;
}

function parseUrls(text) {
  return [...new Set(text.split(/[\s,]+/).map(u => u.trim()).filter(u => u.startsWith('http')))];
}

function fmtDur(s) {
  if (!s) return '';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function friendlyError(err) {
  if (err.includes('Unsupported URL')) return 'This URL is not supported';
  if (err.includes('Video unavailable')) return 'Video is unavailable or private';
  if (err.includes('Private video')) return 'This video is private';
  if (err.includes('HTTP Error 403')) return 'Access denied by the platform';
  if (err.includes('HTTP Error 404')) return 'Video not found';
  if (err.includes('copyright')) return 'Video blocked due to copyright';
  if (err.includes('geo')) return 'Video not available in your region';
  if (err.includes('timed out') || err.includes('Timed out')) return 'Request timed out — try again';
  if (err.includes('network') || err.includes('Network')) return 'Network error — check your connection';
  return err.length > 80 ? err.slice(0, 80) + '...' : err;
}


    document.getElementById('urls').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); }
    });

    async function go() {
      const urls = parseUrls(document.getElementById('urls').value);
      if (!urls.length) return;

      const btn = document.getElementById('goBtn');
      const container = document.getElementById('cards');
      btn.disabled = true;
      btn.textContent = 'Loading...';
      container.innerHTML = '';
      cardData = [];

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const idx = cardData.length;
        cardData.push({ url, status: 'loading' });
        renderCard(idx);

        try {
          const res = await fetch('/api/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          const data = await res.json();
          if (data.error) {
            cardData[idx] = { ...cardData[idx], status: 'info-error', error: data.error };
          } else {
            cardData[idx] = {
              ...cardData[idx],
              status: 'ready',
              title: data.title || '',
              thumbnail: data.thumbnail || '',
              duration: data.duration,
              uploader: data.uploader || '',
              formats: data.formats || [],
              selectedFormatId: data.formats?.[0]?.id || null,
            };
          }
        } catch (err) {
          cardData[idx] = { ...cardData[idx], status: 'info-error', error: err.message };
        }
        renderCard(idx);
      }

      if (cardData.filter(c => c.status === 'ready').length > 1) {
        renderDownloadAll();
      }

      btn.disabled = false;
      btn.textContent = 'Fetch';
    }

    function renderCard(idx) {
      const c = cardData[idx];
      let el = document.getElementById(`card-${idx}`);
      if (!el) {
        el = document.createElement('div');
        el.id = `card-${idx}`;
        el.className = 'card';
        document.getElementById('cards').appendChild(el);
      }

      // Loading skeleton
      if (c.status === 'loading') {
        el.className = 'card';
        el.innerHTML = `
          <div class="card-thumb loading"></div>
          <div class="card-body">
            <div class="skeleton-line medium"></div>
            <div class="skeleton-line short"></div>
          </div>
        `;
        return;
      }

      // Error state
      if (c.status === 'info-error') {
        el.className = 'card card-error';
        el.innerHTML = `
          <div class="card-thumb">
            <div class="card-error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
          </div>
          <div class="card-body">
            <div class="card-title" style="color:var(--error)">Could not fetch video</div>
            <div class="card-error-msg">${esc(friendlyError(c.error || ''))}</div>
            <div class="card-error-url">${esc(c.url)}</div>
          </div>
        `;
        return;
      }

      el.className = 'card';
      const isAudio = currentFormat === 'audio';

      let thumbHtml;
      if (isAudio) {
        thumbHtml = `<div class="no-thumb" style="color:var(--accent)"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>`;
      } else if (c.thumbnail) {
        thumbHtml = `<img src="${c.thumbnail}" alt="">`;
      } else {
        thumbHtml = `<div class="no-thumb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>`;
      }

      let qualityChips = '';
      if (!isAudio && c.formats && c.formats.length > 1) {
        qualityChips = c.formats.map(f =>
          `<button class="q-chip${f.id === c.selectedFormatId ? ' active' : ''}" onclick="pickFormat(${idx}, '${f.id}')">${f.label}</button>`
        ).join('');
      }

      let actionHtml = '';
      if (c.status === 'ready') {
        actionHtml = `<button class="card-dl-btn" onclick="dlCard(${idx})">Download</button>${qualityChips}`;
      } else if (c.status === 'downloading') {
        actionHtml = `<span class="card-status downloading"><span class="spin"></span> Downloading...</span>`;
      } else if (c.status === 'done') {
        actionHtml = `<button class="card-dl-btn done" onclick="saveCard(${idx})">Save</button>
          <span class="card-status done">${esc(c.filename || '')}</span>`;
      } else if (c.status === 'error') {
        actionHtml = `<button class="card-dl-btn" onclick="dlCard(${idx})">Retry</button>
          <span class="card-status error">${esc(friendlyError(c.error || 'Download failed'))}</span>`;
      }

      el.innerHTML = `
        <div class="card-thumb">${thumbHtml}</div>
        <div class="card-body">
          <div class="card-title">${esc(c.title || 'Untitled')}</div>
          <div class="card-meta">${esc(c.uploader)}${c.duration ? ' · ' + fmtDur(c.duration) : ''}</div>
          <div class="card-actions">${actionHtml}</div>
        </div>
      `;
    }

    function renderDownloadAll() {
      const existing = document.getElementById('dl-all-bar');
      if (existing) existing.remove();

      const bar = document.createElement('div');
      bar.id = 'dl-all-bar';
      bar.className = 'dl-all-bar';
      bar.innerHTML = `<button class="dl-all-btn" onclick="dlAll()">Download All</button>`;
      document.getElementById('cards').appendChild(bar);
    }

    function pickFormat(idx, formatId) {
      cardData[idx].selectedFormatId = formatId;
      renderCard(idx);
    }

    async function dlCard(idx) {
      const c = cardData[idx];
      c.status = 'downloading';
      c.error = null;
      renderCard(idx);

      try {
        const res = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: c.url,
            format: currentFormat,
            format_id: c.selectedFormatId,
            title: c.title || '',
          }),
        });
        const data = await res.json();
        if (data.error) {
          c.status = 'error';
          c.error = data.error;
          renderCard(idx);
          return;
        }
        c.jobId = data.job_id;
        pollCard(idx);
      } catch (err) {
        c.status = 'error';
        c.error = err.message;
        renderCard(idx);
      }
    }

    function pollCard(idx) {
      const c = cardData[idx];
      const iv = setInterval(async () => {
        try {
          const res = await fetch(`/api/status/${c.jobId}`);
          const data = await res.json();
          if (data.status === 'done') {
            clearInterval(iv);
            c.status = 'done';
            c.filename = data.filename;
            renderCard(idx);
            saveCard(idx);
          } else if (data.status === 'error') {
            clearInterval(iv);
            c.status = 'error';
            c.error = data.error;
            renderCard(idx);
          }
        } catch {
          clearInterval(iv);
          c.status = 'error';
          c.error = 'Lost connection to server';
          renderCard(idx);
        }
      }, 1000);
    }

    function saveCard(idx) {
      const c = cardData[idx];
      if (!c.jobId) return;
      const a = document.createElement('a');
      a.href = `/api/file/${c.jobId}`;
      a.download = c.filename || '';
      a.click();
    }

    async function dlAll() {
      const btn = document.querySelector('.dl-all-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Downloading...'; }

      for (let i = 0; i < cardData.length; i++) {
        if (cardData[i].status === 'ready') {
          await dlCard(i);
        }
      }

      if (btn) { btn.disabled = false; btn.textContent = 'Download All'; }
    }
