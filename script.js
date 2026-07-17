(function () {
  const menuButton = document.querySelector('.menu-button');
  const navLinks = document.querySelector('.nav-links');
  const placesToggle = document.querySelector('.nav-dropdown-toggle');
  const placesMenu = document.getElementById('places-menu');

  const closePlacesMenu = () => {
    if (!placesToggle || !placesMenu) return;
    placesMenu.classList.remove('is-open');
    placesToggle.setAttribute('aria-expanded', 'false');
  };

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
      if (!open) closePlacesMenu();
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
        closePlacesMenu();
      });
    });
  }

  const pad = (number) => String(number).padStart(2, '0');
  const pluralize = (count, singular, plural) => count === 1 ? singular : plural;
  const cities = new Set(RINKS.map((rink) => rink.city));
  const states = new Set(RINKS.map((rink) => rink.state));
  const countries = new Set(RINKS.map((rink) => rink.country));

  const updateStat = (countId, labelId, count, singular, plural) => {
    const countNode = document.getElementById(countId);
    const labelNode = document.getElementById(labelId);
    if (countNode) countNode.textContent = pad(count);
    if (labelNode) labelNode.textContent = pluralize(count, singular, plural);
  };

  updateStat('rink-count', 'rink-label', RINKS.length, 'Rink', 'Rinks');
  updateStat('city-count', 'city-label', cities.size, 'City', 'Cities');
  updateStat('state-count', 'state-label', states.size, 'State', 'States');
  updateStat('country-count', 'country-label', countries.size, 'Country', 'Countries');
  document.getElementById('copyright-year').textContent = `© ${new Date().getFullYear()} Subin`;

  if (placesMenu && placesToggle) {
    const placeTree = new Map();

    RINKS.forEach((rink) => {
      if (!placeTree.has(rink.country)) placeTree.set(rink.country, new Map());
      const country = placeTree.get(rink.country);
      if (!country.has(rink.state)) country.set(rink.state, new Map());
      const state = country.get(rink.state);
      if (!state.has(rink.city)) state.set(rink.city, []);
      state.get(rink.city).push(rink);
    });

    placesMenu.innerHTML = `
      <div class="places-menu-heading">Browse the archive</div>
      ${Array.from(placeTree.entries()).map(([countryName, countryStates]) => {
        const countryCount = Array.from(countryStates.values())
          .flatMap((cityMap) => Array.from(cityMap.values()))
          .flat().length;

        return `
          <div class="places-country">
            <a class="places-country-link" href="#archive">
              <span>${countryName}</span><small>${countryCount} ${pluralize(countryCount, 'rink', 'rinks')}</small>
            </a>
            ${Array.from(countryStates.entries()).map(([stateName, stateCities]) => {
              const stateCount = Array.from(stateCities.values()).flat().length;
              return `
                <div class="places-state">
                  <a class="places-state-link" href="#archive">
                    <span>${stateName}</span><small>${stateCount}</small>
                  </a>
                  <div class="places-city-list">
                    ${Array.from(stateCities.entries()).map(([cityName, cityRinks]) => `
                      <div class="places-city-group">
                        <span class="places-city-name">${cityName}</span>
                        ${cityRinks.map((rink) => `
                          <a href="review.html?id=${encodeURIComponent(rink.id)}">
                            <span>${rink.shortName}</span><small>View review →</small>
                          </a>
                        `).join('')}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }).join('')}
    `;

    placesToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = placesMenu.classList.toggle('is-open');
      placesToggle.setAttribute('aria-expanded', String(open));
    });

    placesMenu.addEventListener('click', (event) => event.stopPropagation());
    document.addEventListener('click', closePlacesMenu);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePlacesMenu();
    });
  }

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
