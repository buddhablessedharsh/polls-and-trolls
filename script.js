const menuToggle=document.getElementById('menuToggle');const nav=document.getElementById('siteNav');if(menuToggle&&nav){menuToggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');}));}const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();

/* Homepage meme slideshow: uses the images linked to records in archive-data.js. */
(() => {
  const frame = document.getElementById('memeSlideshow');
  if (!frame) return;

  const records = Array.isArray(window.MEME_RECORDS) ? window.MEME_RECORDS : [];
  const seen = new Set();
  const slides = [];
  records.forEach(record => {
    (Array.isArray(record.images) ? record.images : []).forEach(src => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      slides.push({
        src,
        title: record.transcribed_text || record.artifact_id || 'Archived political meme',
        description: [record.country_name || record.country_code, record.election_event, record.rhetorical_frame]
          .filter(Boolean).join(' · '),
        artifact: record.artifact_id || '',
        source: record.source_archive_url || ''
      });
    });
  });

  if (!slides.length) {
    frame.classList.add('slideshow-empty');
    const image = document.getElementById('slideImage');
    if (image) image.alt = 'No meme images are available in the metadata.';
    return;
  }

  const image = document.getElementById('slideImage');
  const imageLink = document.getElementById('slideImageLink');
  const title = document.getElementById('slideTitle');
  const description = document.getElementById('slideDescription');
  const count = document.getElementById('slideCount');
  const dots = document.getElementById('slideDots');
  const previous = document.getElementById('slidePrev');
  const next = document.getElementById('slideNext');
  let active = 0;
  let timer = null;

  const escapeText = value => String(value || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  function showSlide(index) {
    active = (index + slides.length) % slides.length;
    const slide = slides[active];
    image.classList.add('is-changing');
    window.setTimeout(() => {
      image.src = slide.src;
      image.alt = slide.title;
      image.onload = () => image.classList.remove('is-changing');
      if (image.complete) image.classList.remove('is-changing');
    }, 120);
    title.textContent = slide.title;
    description.textContent = slide.description || 'Archived political meme';
    count.textContent = `${slide.artifact || 'ARCHIVE ITEM'} · ${active + 1} / ${slides.length}`;
    if (slide.source) {
      imageLink.href = slide.source;
      imageLink.target = '_blank';
      imageLink.rel = 'noopener noreferrer';
      imageLink.setAttribute('aria-label', 'Open original or archived source for this meme');
    } else {
      imageLink.href = '#collections';
      imageLink.removeAttribute('target');
    }
    Array.from(dots.children).forEach((dot, i) => {
      dot.classList.toggle('active', i === active);
      dot.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
  }

  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slide-dot';
    dot.setAttribute('aria-label', `Show meme ${i + 1}`);
    dot.addEventListener('click', () => { showSlide(i); restart(); });
    dots.appendChild(dot);
  });

  function restart() {
    if (timer) window.clearInterval(timer);
    timer = window.setInterval(() => showSlide(active + 1), 4000);
  }
  previous.addEventListener('click', () => { showSlide(active - 1); restart(); });
  next.addEventListener('click', () => { showSlide(active + 1); restart(); });
  frame.addEventListener('mouseenter', () => { if (timer) window.clearInterval(timer); });
  frame.addEventListener('mouseleave', restart);
  frame.addEventListener('focusin', () => { if (timer) window.clearInterval(timer); });
  frame.addEventListener('focusout', restart);

  showSlide(0);
  restart();
})();

/* Header article-title carousel. It fills the unused space beside the navigation tab. */
(() => {
  const ticker = document.getElementById('articleTicker');
  const link = document.getElementById('articleTickerLink');
  const count = document.getElementById('articleTickerCount');
  if (!ticker || !link) return;

  const articles = [
    { title: 'MAGA memes and the making of “God Emperor” Trump', href: 'us-maga-heroization.html', group: 'us' },
    { title: 'Mocking opponents: Hillary Clinton and the “Basket of Deplorables”', href: 'us-mockery-opponents.html', group: 'us' },
    { title: 'Russian interference and political meme pages on Twitter', href: 'us-russian-interference.html', group: 'us' },
    { title: 'MAGA memes, racism, xenophobia, and religious othering', href: 'us-race-religion.html', group: 'us' },
    { title: 'Pepe the Frog: origin, appropriation, weaponisation, and afterlife', href: 'us-pepe.html', group: 'us' },
    { title: 'Bolsonaro on WhatsApp: the Uncle Sam recruitment meme', href: 'brazil-whatsapp-uncle-sam.html', group: 'brazil' },
    { title: '#EleNão and #EleSim: protest and counter-mobilisation', href: 'brazil-ele-nao-ele-sim.html', group: 'brazil' },
    { title: 'Bolsomito: turning a candidate into a video-game hero', href: 'brazil-bolsomito-game.html', group: 'brazil' }
  ];

  const path = window.location.pathname.toLowerCase();
  let visible = articles;
  if (path.includes('brazil')) visible = articles.filter(article => article.group === 'brazil');
  else if (path.includes('us-') || path.endsWith('/us.html')) visible = articles.filter(article => article.group === 'us');

  let active = Math.max(0, visible.findIndex(article => article.href === path.split('/').pop()));
  function show(index) {
    active = (index + visible.length) % visible.length;
    const article = visible[active];
    link.href = article.href;
    link.textContent = article.title;
    link.setAttribute('aria-label', 'Open entry: ' + article.title);
    if (count) count.textContent = String(active + 1).padStart(2, '0') + ' / ' + String(visible.length).padStart(2, '0');
  }
  show(active);
  if (visible.length > 1) window.setInterval(() => show(active + 1), 3500);
})();


/* Browser-native text-to-speech controls for page content. */
(() => {
  const button = document.getElementById('ttsToggle');
  const status = document.getElementById('ttsStatus');
  if (!button) return;
  const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  if (!supported) {
    button.disabled = true;
    button.textContent = 'Text-to-speech unavailable';
    if (status) status.textContent = 'Try a modern browser with speech support.';
    return;
  }
  let speaking = false;
  function setState(isSpeaking, message) {
    speaking = isSpeaking;
    button.setAttribute('aria-pressed', String(isSpeaking));
    button.innerHTML = isSpeaking ? '<span aria-hidden="true">■</span> Stop reading' : '<span aria-hidden="true">▶</span> Listen to this page';
    if (status) status.textContent = message || (isSpeaking ? 'Reading page content aloud.' : 'Uses your browser’s speech voice.');
  }
  button.addEventListener('click', () => {
    if (speaking || window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setState(false, 'Reading stopped.');
      return;
    }
    const main = document.querySelector('main');
    if (!main) return;
    const clone = main.cloneNode(true);
    clone.querySelectorAll('.tts-controls, button, details, script, style, .meme-images, .menu-toggle').forEach(node => node.remove());
    const text = (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      setState(false, 'No readable text was found on this page.');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setState(true, 'Reading page content aloud.');
    utterance.onend = () => setState(false, 'Finished reading this page.');
    utterance.onerror = () => setState(false, 'Speech stopped or could not continue.');
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setState(true, 'Starting text-to-speech…');
  });
  window.addEventListener('beforeunload', () => window.speechSynthesis.cancel());
})();


/* Click a meme image in an entry to view it at a larger size. */
(() => {
  const images = Array.from(document.querySelectorAll('main .meme-images img'));
  if (!images.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'meme-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Enlarged meme image');
  overlay.hidden = true;
  overlay.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Close enlarged image">×</button>
    <button type="button" class="lightbox-prev" aria-label="Previous meme image">‹</button>
    <figure class="lightbox-figure">
      <img class="lightbox-image" alt="">
      <figcaption class="lightbox-caption"></figcaption>
    </figure>
    <button type="button" class="lightbox-next" aria-label="Next meme image">›</button>
    <p class="lightbox-help">Click outside the image or press Esc to close</p>`;
  document.body.appendChild(overlay);

  const largeImage = overlay.querySelector('.lightbox-image');
  const caption = overlay.querySelector('.lightbox-caption');
  const closeButton = overlay.querySelector('.lightbox-close');
  const prevButton = overlay.querySelector('.lightbox-prev');
  const nextButton = overlay.querySelector('.lightbox-next');
  let activeIndex = 0;
  let lastFocused = null;

  function showImage(index) {
    activeIndex = (index + images.length) % images.length;
    const source = images[activeIndex];
    largeImage.src = source.currentSrc || source.src;
    largeImage.alt = source.alt || 'Enlarged meme image';
    const figcaption = source.closest('figure')?.querySelector('figcaption');
    caption.textContent = figcaption ? figcaption.textContent : (source.alt || '');
    const multiple = images.length > 1;
    prevButton.hidden = !multiple;
    nextButton.hidden = !multiple;
  }
  function openImage(index) {
    lastFocused = document.activeElement;
    showImage(index);
    overlay.hidden = false;
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  }
  function closeImage() {
    overlay.hidden = true;
    document.body.classList.remove('lightbox-open');
    largeImage.removeAttribute('src');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  images.forEach((img, index) => {
    img.classList.add('enlargeable-meme');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', (img.alt || 'Meme image') + ' — click to enlarge');
    img.addEventListener('click', () => openImage(index));
    img.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openImage(index);
      }
    });
  });
  closeButton.addEventListener('click', closeImage);
  prevButton.addEventListener('click', () => showImage(activeIndex - 1));
  nextButton.addEventListener('click', () => showImage(activeIndex + 1));
  overlay.addEventListener('click', event => {
    if (event.target === overlay) closeImage();
  });
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') closeImage();
    if (event.key === 'ArrowLeft') showImage(activeIndex - 1);
    if (event.key === 'ArrowRight') showImage(activeIndex + 1);
  });
})();
