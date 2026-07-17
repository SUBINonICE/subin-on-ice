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
    });

    navLinks.addEventListener('click', (event) => {
      if (event.target.closest('a') && window.innerWidth <= 720) {
        navLinks.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const uniqueCount = (key) => new Set(RINKS.map((rink) => rink[key])).size;
  const updateStat = (countId, labelId, count, singular, plural) => {
    const countNode = document.getElementById(countId);
    const labelNode = document.getElementById(labelId);
    if (countNode) countNode.textContent = String(count).padStart(2, '0');
    if (labelNode) labelNode.textContent = count === 1 ? singular : plural;
  };

  updateStat('rink-count', 'rink-label', RINKS.length, 'Rink', 'Rinks');
  updateStat('city-count', 'city-label', uniqueCount('city'), 'City', 'Cities');
  updateStat('state-count', 'state-label', uniqueCount('state'), 'State', 'States');
  updateStat('country-count', 'country-label', uniqueCount('country'), 'Country', 'Countries');

  const copyright = document.getElementById('copyright-year');
  if (copyright) copyright.textContent = `© ${new Date().getFullYear()} Subin`;

  const groupByPlace = () => {
    const countries = new Map();
    RINKS.forEach((rink) => {
      if (!countries.has(rink.country)) countries.set(rink.country, new Map());
      const states = countries.get(rink.country);
      if (!states.has(rink.state)) states.set(rink.state, new Map());
      const cities = states.get(rink.state);
      if (!cities.has(rink.city)) cities.set(rink.city, []);
      cities.get(rink.city).push(rink);
    });
    return countries;
  };

  if (placesToggle && placesMenu) {
    const countries = groupByPlace();
    placesMenu.innerHTML = `
      <div class="places-menu-heading">Browse the archive</div>
      <p class="places-menu-intro">Open a country, then narrow down by state and city.</p>
      ${Array.from(countries.entries()).map(([countryName, states]) => {
        const countryRinks = Array.from(states.values())
          .flatMap((cities) => Array.from(cities.values()).flat()).length;
        return `
          <details class="place-level place-country">
            <summary>
              <span>${countryName}</span>
              <small>${countryRinks} ${countryRinks === 1 ? 'rink' : 'rinks'}</small>
            </summary>
            <div class="place-children">
              ${Array.from(states.entries()).map(([stateName, cities]) => {
                const stateRinks = Array.from(cities.values()).flat().length;
                return `
                  <details class="place-level place-state">
                    <summary>
                      <span>${stateName}</span>
                      <small>${stateRinks}</small>
                    </summary>
                    <div class="place-children">
                      ${Array.from(cities.entries()).map(([cityName, cityRinks]) => `
                        <details class="place-level place-city">
                          <summary>
                            <span>${cityName}</span>
                            <small>${cityRinks.length}</small>
                          </summary>
                          <div class="place-rink-links">
                            ${cityRinks.map((rink) => `
                              <a href="review.html?id=${encodeURIComponent(rink.id)}">
                                <span>${rink.shortName}</span>
                                <small>View review →</small>
                              </a>
                            `).join('')}
                          </div>
                        </details>
                      `).join('')}
                    </div>
                  </details>
                `;
              }).join('')}
            </div>
          </details>
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
  if (rinkGrid) {
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
            <div class="read-review">View full review <span aria-hidden="true">→</span></div>
          </div>
        </a>
      `;
      rinkGrid.appendChild(card);
    });
  }

  const mapElement = document.getElementById('rink-map');
  if (!mapElement) return;

  if (typeof L === 'undefined') {
    mapElement.innerHTML = '<div class="map-fallback"><strong>The interactive map could not load.</strong><br />You can still open each rink from the archive below.</div>';
    return;
  }

  const map = L.map('rink-map', {
    scrollWheelZoom: false,
    zoomControl: false,
    preferCanvas: true
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);

  let tileErrorCount = 0;
  tileLayer.on('tileerror', () => {
    tileErrorCount += 1;
    if (tileErrorCount === 1) {
      console.warn('A map tile failed to load. The browser may retry automatically.');
    }
  });

  const bounds = [];

  RINKS.forEach((rink) => {
    const icon = L.divIcon({
      className: 'custom-rink-marker-wrap',
      html: `<span class="custom-rink-marker ${rink.isHomeRink ? 'home-marker' : ''}" aria-label="${rink.name}"><i>✦</i></span>`,
      iconSize: [44, 52],
      iconAnchor: [22, 45],
      popupAnchor: [0, -42]
    });

    const marker = L.marker(rink.coordinates, { icon, title: rink.name }).addTo(map);
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
        <a href="review.html?id=${encodeURIComponent(rink.id)}">View full review →</a>
      </article>
    `, { maxWidth: 310 });

    bounds.push(rink.coordinates);
  });

  if (bounds.length === 1) {
    map.setView(bounds[0], 13);
  } else {
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 12 });
  }

  const refreshMap = () => map.invalidateSize({ animate: false });
  window.setTimeout(refreshMap, 100);
  window.setTimeout(refreshMap, 500);
  window.addEventListener('resize', refreshMap);
})();
