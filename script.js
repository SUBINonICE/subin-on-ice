(function () {
  const menuButton = document.querySelector('.menu-button');
  const navLinks = document.querySelector('.nav-links');

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const pad = (number) => String(number).padStart(2, '0');
  const cities = new Set(RINKS.map((rink) => rink.city));
  const states = new Set(RINKS.map((rink) => rink.state));

  document.getElementById('rink-count').textContent = pad(RINKS.length);
  document.getElementById('city-count').textContent = pad(cities.size);
  document.getElementById('state-count').textContent = pad(states.size);
  document.getElementById('copyright-year').textContent = `© ${new Date().getFullYear()} Subin`;

  const averageRating = (rink) => {
    const values = Object.values(rink.ratings);
    return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
  };

  const rinkGrid = document.getElementById('rink-grid');
  RINKS.forEach((rink, index) => {
    const card = document.createElement('article');
    card.className = `rink-card rink-card-${rink.accent}`;
    card.innerHTML = `
      <a class="rink-card-link" href="review.html?id=${encodeURIComponent(rink.id)}" aria-label="Read the ${rink.name} review">
        <div class="rink-visual">
          <div class="rink-number">${String(index + 1).padStart(2, '0')}</div>
          <span class="rink-badge">${rink.badge}</span>
          <div class="rink-placeholder-copy">PHOTO<br />COMING SOON</div>
          <div class="rink-scratch" aria-hidden="true"></div>
        </div>
        <div class="rink-card-body">
          <div class="location-line">${rink.city}, ${rink.stateCode}</div>
          <h3>${rink.name}</h3>
          <p>“${rink.quickTake}”</p>
          <div class="card-score-row">
            <div><strong>${averageRating(rink)}</strong><span>Overall</span></div>
            <div><strong>${rink.ratings['Ice Quality']}</strong><span>Ice</span></div>
            <div><strong>${rink.ratings['Practice Space']}</strong><span>Space</span></div>
          </div>
          <div class="read-review">Read full review <span aria-hidden="true">→</span></div>
        </div>
      </a>
    `;
    rinkGrid.appendChild(card);
  });

  const mapElement = document.getElementById('rink-map');
  if (!mapElement) return;

  if (typeof L === 'undefined') {
    mapElement.innerHTML = '<p class="map-fallback">The map could not load. Please use the rink cards below.</p>';
    return;
  }

  const map = L.map('rink-map', {
    scrollWheelZoom: false,
    zoomControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const bounds = [];

  RINKS.forEach((rink) => {
    const icon = L.divIcon({
      className: 'custom-rink-marker-wrap',
      html: `<button class="custom-rink-marker ${rink.isHomeRink ? 'home-marker' : ''}" aria-label="${rink.name}"><span>✦</span></button>`,
      iconSize: [44, 52],
      iconAnchor: [22, 45],
      popupAnchor: [0, -42]
    });

    const marker = L.marker(rink.coordinates, { icon }).addTo(map);
    const overall = averageRating(rink);

    marker.bindPopup(`
      <article class="map-popup-card">
        <span class="map-popup-badge">${rink.badge}</span>
        <h3>${rink.name}</h3>
        <p>${rink.city}, ${rink.state}</p>
        <div class="map-popup-scores">
          <span><strong>${overall}</strong> overall</span>
          <span><strong>${rink.ratings['Ice Quality']}</strong> ice</span>
        </div>
        <a href="review.html?id=${encodeURIComponent(rink.id)}">Read the full review →</a>
      </article>
    `, { maxWidth: 290 });

    bounds.push(rink.coordinates);
  });

  if (bounds.length === 1) {
    map.setView(bounds[0], 13);
  } else {
    map.fitBounds(bounds, { padding: [70, 70], maxZoom: 12 });
  }

  window.setTimeout(() => map.invalidateSize(), 200);
})();
