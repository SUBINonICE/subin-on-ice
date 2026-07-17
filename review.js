(function () {
  const root = document.getElementById('review-root');
  const params = new URLSearchParams(window.location.search);
  const rinkId = params.get('id');
  const rink = RINKS.find((item) => item.id === rinkId) || RINKS[0];

  document.title = `${rink.name} Review — Subin on Ice`;
  document.getElementById('copyright-year').textContent = `© ${new Date().getFullYear()} Subin`;

  const average = (
    Object.values(rink.ratings).reduce((sum, value) => sum + value, 0) /
    Object.values(rink.ratings).length
  ).toFixed(1);

  const ratingRows = Object.entries(rink.ratings).map(([label, value]) => {
    const note = rink.ratingNotes[label];
    const fillWidth = `${(value / 5) * 100}%`;
    return `
      <article class="review-rating-item">
        <div class="review-rating-heading">
          <h3>${label}</h3>
          <strong>${value}<span>/5</span></strong>
        </div>
        <div class="score-track" aria-label="${label}: ${value} out of 5"><i style="width:${fillWidth}"></i></div>
        <p>${note}</p>
        ${label === 'Practice Space' ? '<div class="practice-space-note">A higher score means more usable room for practice, not a higher crowd level.</div>' : ''}
      </article>
    `;
  }).join('');

  root.innerHTML = `
    <section class="review-hero review-hero-${rink.accent}">
      <div class="review-hero-art" aria-label="Photo placeholder">
        <span>${rink.badge}</span>
        <div>PHOTO<br />COMING SOON</div>
      </div>
      <div class="review-hero-copy">
        <div class="eyebrow">${rink.city.toUpperCase()}, ${rink.stateCode}</div>
        <h1>${rink.name}</h1>
        <blockquote>“${rink.quickTake}”</blockquote>
        <div class="review-meta">
          <div><span>Sessions skated</span><strong>${rink.sessions.join(' · ')}</strong></div>
          <div><span>Overall rating</span><strong>${average} / 5</strong></div>
          <div><span>Reviewed</span><strong>2026</strong></div>
        </div>
        <div class="review-actions">
          <a class="primary-button" href="${rink.mapUrl}" target="_blank" rel="noopener">Open in Google Maps</a>
          <a class="text-link" href="${rink.officialUrl}" target="_blank" rel="noopener">Official rink page ↗</a>
        </div>
      </div>
    </section>

    <section class="review-content section-shell">
      <div class="review-main">
        <div class="review-section-heading">
          <div class="eyebrow">THE SCORECARD</div>
          <h2>How it skates</h2>
        </div>
        <div class="review-rating-list">${ratingRows}</div>
      </div>

      <aside class="review-sidebar">
        <div class="sidebar-card">
          <span class="sidebar-label">Address</span>
          <p>${rink.address}</p>
        </div>
        <div class="sidebar-card">
          <span class="sidebar-label">What I loved</span>
          <p>${rink.loved}</p>
        </div>
        <div class="sidebar-card">
          <span class="sidebar-label">What could be better</span>
          <p>${rink.couldBeBetter}</p>
        </div>
        <div class="sidebar-card verdict-card">
          <span class="sidebar-label">Would I skate here again?</span>
          <p>${rink.returnVerdict}</p>
        </div>
      </aside>
    </section>

    <section class="next-rink-section section-shell">
      <a href="index.html#archive">← Browse every rink in the archive</a>
    </section>
  `;
})();
