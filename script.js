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
  const markersLayer = document.getElementById('atlas-markers');
  const popup = document.getElementById('atlas-popup');

  if (mapElement && markersLayer && popup) {
    const bounds = {
      latMin: 41.95,
      latMax: 42.14,
      lonMin: -87.85,
      lonMax: -87.62
    };

    const projectToMap = ([lat, lon]) => {
      const x = ((lon - bounds.lonMin) / (bounds.lonMax - bounds.lonMin)) * 100;
      const y = ((bounds.latMax - lat) / (bounds.latMax - bounds.latMin)) * 100;
      return {
        x: Math.max(7, Math.min(88, x)),
        y: Math.max(12, Math.min(86, y))
      };
    };

    const closePopup = () => {
      popup.classList.remove('is-open');
      popup.setAttribute('aria-hidden', 'true');
      markersLayer.querySelectorAll('.atlas-marker').forEach((marker) => {
        marker.classList.remove('is-active');
        marker.setAttribute('aria-expanded', 'false');
      });
    };

    const openPopup = (rink, marker) => {
      const overall = averageRating(rink);
      popup.innerHTML = `
        <button class="atlas-popup-close" type="button" aria-label="Close rink preview">×</button>
        <span class="atlas-popup-badge">${rink.badge}</span>
        <h3>${rink.name}</h3>
        <p class="atlas-popup-location">${rink.city}, ${rink.state}</p>
        <p class="atlas-popup-quote">“${rink.quickTake}”</p>
        <div class="atlas-popup-scores">
          <div><strong>${overall}</strong><span>Overall</span></div>
          <div><strong>${rink.ratings['Ice Quality']}</strong><span>Ice</span></div>
          <div><strong>${rink.ratings['Practice Space']}</strong><span>Space</span></div>
        </div>
        <div class="atlas-popup-actions">
          <a class="atlas-review-link" href="review.html?id=${encodeURIComponent(rink.id)}">Full review →</a>
          <a class="atlas-google-link" href="${rink.mapUrl}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a>
        </div>
      `;

      markersLayer.querySelectorAll('.atlas-marker').forEach((node) => {
        const selected = node === marker;
        node.classList.toggle('is-active', selected);
        node.setAttribute('aria-expanded', String(selected));
      });

      popup.classList.add('is-open');
      popup.setAttribute('aria-hidden', 'false');
      popup.querySelector('.atlas-popup-close')?.addEventListener('click', closePopup);
    };

    RINKS.forEach((rink) => {
      const point = projectToMap(rink.coordinates);
      const marker = document.createElement('button');
      const labelSide = point.x > 58 ? 'label-left' : 'label-right';
      marker.type = 'button';
      marker.className = `atlas-marker ${rink.isHomeRink ? 'is-home' : ''} ${labelSide}`;
      marker.style.left = `${point.x}%`;
      marker.style.top = `${point.y}%`;
      marker.dataset.rinkId = rink.id;
      marker.setAttribute('aria-label', `Preview ${rink.name}`);
      marker.setAttribute('aria-expanded', 'false');
      marker.innerHTML = `
        <span class="atlas-marker-pulse" aria-hidden="true"></span>
        <span class="atlas-marker-core" aria-hidden="true">✦</span>
        <span class="atlas-marker-label">${rink.shortName}</span>
      `;
      marker.addEventListener('click', (event) => {
        event.stopPropagation();
        if (marker.classList.contains('is-active')) {
          closePopup();
        } else {
          openPopup(rink, marker);
        }
      });
      markersLayer.appendChild(marker);
    });

    mapElement.addEventListener('click', (event) => {
      if (!event.target.closest('.atlas-popup') && !event.target.closest('.atlas-marker')) {
        closePopup();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePopup();
    });
  }
})();
