/* =====================================================================
   COURSE REGISTRATION — FRONT-END LOGIC  (js/script.js)
   Plain JavaScript. No libraries. No secrets are stored in this file.

   You normally do NOT need to edit this file.
   To change names, course details, contact info or links, edit js/config.js.
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     0. SETTINGS & STATE
     ------------------------------------------------------------------ */
  var CFG = window.SITE_CONFIG || {};
  var COUNTRIES = window.COUNTRIES || [];
  var COURSES = (CFG.COURSES && CFG.COURSES.length) ? CFG.COURSES : [{ name: 'Training' }];
  var TOTAL_STEPS = 3;
  var GENERIC_ERROR = CFG.GENERIC_ERROR_MESSAGE ||
    'We could not complete your registration at this time. Please check your internet connection and try again.';

  var pageLoadedAt = Date.now();
  var state = { step: 1, submitting: false, lastFingerprint: '', submissionId: '', lastResult: null };

  // Which fields belong to which step (used for validation and error routing).
  var STEP_FIELDS = {
    1: ['fullName', 'email', 'phone', 'whatsapp', 'gender', 'country', 'state'],
    2: ['course', 'education', 'occupation', 'referral', 'additional'],
    3: ['consent']
  };

  /* ------------------------------------------------------------------
     1. SMALL HELPERS
     ------------------------------------------------------------------ */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function has(v) { return typeof v === 'string' && v.trim() !== ''; }
  // "Set" = filled in AND not still a YOUR_PLACEHOLDER.
  function isSet(v) { return has(v) && v.indexOf('YOUR_') === -1; }
  function isHttpUrl(v) { return isSet(v) && /^https?:\/\//i.test(v.trim()); }
  function isScriptUrl(v) { return has(v) && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(v.trim()); }
  function digitsOnly(v) { return String(v || '').replace(/\D/g, ''); }

  function make(tag, className, text) {
    var el = document.createElement(tag);
    if (className) { el.className = className; }
    if (text !== undefined && text !== null) { el.textContent = text; }
    return el;
  }

  // Returns an <svg> element that references an icon from the sprite in index.html.
  function iconNode(name) {
    var tmp = document.createElement('span');
    tmp.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
    return tmp.firstChild;
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function scrollToEl(el) {
    if (!el) { return; }
    var top = el.getBoundingClientRect().top + window.pageYOffset - 88;
    window.scrollTo({ top: Math.max(top, 0), behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) { return window.crypto.randomUUID(); }
    var bytes = new Uint8Array(16), out = '', i;
    if (window.crypto && window.crypto.getRandomValues) { window.crypto.getRandomValues(bytes); }
    else { for (i = 0; i < 16; i++) { bytes[i] = Math.floor(Math.random() * 256); } }
    for (i = 0; i < 16; i++) { out += ('0' + bytes[i].toString(16)).slice(-2); }
    return out;
  }

  function isDemo() {
    // Never send applicants to a live backend until every advertised course is configured.
    return !isScriptUrl(CFG.APPS_SCRIPT_URL) || !COURSES.every(function (c) { return isSet(c.name); });
  }

  function homeUrl() {
    return (CFG.LINKS && isHttpUrl(CFG.LINKS.HOMEPAGE)) ? CFG.LINKS.HOMEPAGE : './';
  }

  function waLink(text) {
    var n = digitsOnly(CFG.CONTACT && CFG.CONTACT.WHATSAPP);
    return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  /* ------------------------------------------------------------------
     2. VALIDATION RULES  (the server repeats these checks)
     ------------------------------------------------------------------ */
  var NAME_RE, LOC_RE;
  try {
    NAME_RE = new RegExp("^[\\p{L}\\p{M}][\\p{L}\\p{M}\\s'\u2019.\\-]{1,98}$", 'u');
    LOC_RE = new RegExp("^[\\p{L}\\p{M}\\p{N}\\s'\u2019().,\\-/&]{2,80}$", 'u');
  } catch (e) { // very old browsers without Unicode property escapes
    NAME_RE = /^[A-Za-z][A-Za-z\s'.\-]{1,98}$/;
    LOC_RE = /^[A-Za-z0-9\s'().,\-/&]{2,80}$/;
  }
  var EMAIL_RE = /^[A-Za-z0-9_][A-Za-z0-9._%+\-]{0,63}@[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,24}$/;
  var PHONE_RE = /^\+?[0-9][0-9\s().\-]{5,24}$/;

  function validEmail(v) {
    return v.length <= 254 && EMAIL_RE.test(v) && v.indexOf('..') === -1 && !/\.@/.test(v);
  }
  function validPhone(v) {
    if (!PHONE_RE.test(v)) { return false; }
    var d = digitsOnly(v).length;
    return d >= 7 && d <= 15;
  }

  function messageFor(name, v) {
    switch (name) {
      case 'fullName':
        if (!v) { return 'Please enter your full name.'; }
        if (v.length < 3 || !NAME_RE.test(v)) { return 'Please use letters only for your name (no numbers or special symbols).'; }
        if (v.split(' ').length < 2) { return 'Please enter both your first name and your surname.'; }
        return '';
      case 'email':
        if (!v) { return 'Please enter your email address.'; }
        if (!validEmail(v)) { return 'Please enter a valid email address, for example name@example.com.'; }
        return '';
      case 'phone':
        if (!v) { return 'Please enter your phone number.'; }
        if (!validPhone(v)) { return 'Please enter a valid phone number with your country code, e.g. +44 7911 123456.'; }
        return '';
      case 'whatsapp':
        if (!v) { return ''; }
        if (!validPhone(v)) { return 'Please enter a valid WhatsApp number with your country code, or leave it blank.'; }
        return '';
      case 'gender':
        return v ? '' : 'Please select an option.';
      case 'country':
        return v ? '' : 'Please select your country.';
      case 'state':
        if (!v) { return 'Please enter your state or location.'; }
        if (!LOC_RE.test(v)) { return 'Please enter a valid state or location (letters and numbers only).'; }
        return '';
      case 'course':
        return v ? '' : 'Please select the course you are registering for.';
      case 'education':
        return v ? '' : 'Please select your educational or professional background.';
      case 'occupation':
        if (!v) { return 'Please enter your current occupation.'; }
        if (v.length < 2 || /[<>]/.test(v)) { return 'Please enter a valid occupation.'; }
        return '';
      case 'referral':
        return (v.length > 100 || /[<>]/.test(v)) ? 'Please choose one of the options.' : '';
      case 'additional':
        return v.length > 1000 ? 'Please keep this under 1000 characters.' : '';
      case 'consent':
        return v ? '' : 'Please tick this box to confirm and agree before submitting.';
      default:
        return '';
    }
  }

  /* ------------------------------------------------------------------
     3. READING & CLEANING FIELD VALUES
     ------------------------------------------------------------------ */
  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value).trim().replace(/\s+/g, ' ') : '';
  }
  function radioVal(name) {
    var el = $('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function fieldValue(name) {
    if (name === 'gender') { return radioVal('gender'); }
    if (name === 'consent') { return $('#consent').checked ? 'yes' : ''; }
    if (name === 'additional') { return $('#additional').value.replace(/\r\n/g, '\n').trim(); }
    if (name === 'whatsapp' && $('#sameWhatsapp').checked) { return val('phone'); }
    if (name === 'email') { return val('email').toLowerCase(); }
    return val(name);
  }

  function collect() {
    return {
      fullName: fieldValue('fullName'),
      email: fieldValue('email'),
      phone: fieldValue('phone'),
      whatsapp: fieldValue('whatsapp'),
      gender: fieldValue('gender'),
      country: fieldValue('country'),
      state: fieldValue('state'),
      education: fieldValue('education'),
      occupation: fieldValue('occupation'),
      course: fieldValue('course'),
      referral: fieldValue('referral'),
      additional: fieldValue('additional')
    };
  }

  /* ------------------------------------------------------------------
     4. SHOWING / CLEARING ERRORS
     ------------------------------------------------------------------ */
  function fieldWrap(name) { return $('[data-field="' + name + '"]'); }

  function setError(name, message) {
    var wrap = fieldWrap(name), err = document.getElementById(name + '-error');
    if (!wrap || !err) { return; }
    var controls = $$('input:not([type="checkbox"]), select, textarea, input[type="checkbox"]#consent', wrap);
    if (message) {
      wrap.classList.add('has-error');
      err.textContent = message;
      err.hidden = false;
      controls.forEach(function (c) { c.setAttribute('aria-invalid', 'true'); });
    } else {
      wrap.classList.remove('has-error');
      err.textContent = '';
      err.hidden = true;
      controls.forEach(function (c) { c.removeAttribute('aria-invalid'); });
    }
  }

  function validateField(name) {
    if (name === 'whatsapp' && $('#sameWhatsapp').checked) { setError('whatsapp', ''); return true; }
    var msg = messageFor(name, fieldValue(name));
    setError(name, msg);
    return !msg;
  }

  // Validates every field in a step. Returns the name of the first invalid field, or ''.
  function validateStep(n) {
    var first = '';
    STEP_FIELDS[n].forEach(function (f) { if (!validateField(f) && !first) { first = f; } });
    return first;
  }

  function focusField(name) {
    var wrap = fieldWrap(name);
    if (!wrap) { return; }
    var control = $('input:not([type="hidden"]), select, textarea', wrap);
    scrollToEl(wrap);
    if (control) { try { control.focus({ preventScroll: true }); } catch (e) { control.focus(); } }
  }

  function showAlert(message, scroll) {
    $('#formAlertText').textContent = message;
    $('#formAlert').hidden = false;
    if (scroll !== false) { scrollToEl($('#formCard')); }
  }
  function hideAlert() { $('#formAlert').hidden = true; $('#formAlertText').textContent = ''; }

  /* ------------------------------------------------------------------
     5. PAGE CONTENT FROM CONFIG
     ------------------------------------------------------------------ */
  function applyBranding() {
    var org = CFG.ORGANISATION_NAME || 'Training Registration';
    document.title = 'Course Registration | ' + org;
    $$('[data-org-name]').forEach(function (el) { el.textContent = org; });
    $$('[data-tagline]').forEach(function (el) { el.textContent = CFG.TAGLINE || ''; });
    $('#year').textContent = new Date().getFullYear();

    $$('img[data-logo]').forEach(function (img) {
      img.alt = org + ' logo';
      // If the logo file is missing, show the organisation name instead of a broken image.
      img.addEventListener('error', function () {
        var fallback = make('span', 'logo-fallback', org);
        if (img.parentNode) { img.parentNode.replaceChild(fallback, img); }
      }, { once: true });
      img.src = has(CFG.LOGO) ? CFG.LOGO : img.getAttribute('src');
    });
  }

  function getCourse(name) {
    for (var i = 0; i < COURSES.length; i++) { if (COURSES[i].name === name) { return COURSES[i]; } }
    return COURSES[0];
  }

  function renderCourseInfo(course) {
    $('#heroCourse').textContent = isSet(course.name) ? course.name : "Training for what's next.";
    var desc = $('#heroDesc');
    desc.textContent = isSet(course.description) ? course.description :
      'Practical cybersecurity and technology training for an evolving digital world.';

    var ul = $('#heroFacts');
    ul.innerHTML = '';
    [
      ['calendar', 'Start date', course.startDate],
      ['clock', 'Duration', course.duration],
      ['pin', 'Venue / platform', course.venue],
      ['tag', 'Course fee', course.price]
    ].forEach(function (f) {
      if (!isSet(f[2])) { return; }
      var li = make('li', 'fact');
      var ic = make('span', 'fact-icon');
      ic.appendChild(iconNode(f[0]));
      var box = make('div');
      box.appendChild(make('span', 'fact-label', f[1]));
      box.appendChild(make('span', 'fact-value', f[2]));
      li.appendChild(ic);
      li.appendChild(box);
      ul.appendChild(li);
    });
    $('#courseBrief').hidden = !ul.children.length;
  }

  function fillSelect(select, items) {
    items.forEach(function (item) {
      var o = document.createElement('option');
      o.value = item;
      o.textContent = item;
      select.appendChild(o);
    });
  }

  function populateSelects() {
    fillSelect($('#country'), COUNTRIES);
    fillSelect($('#education'), CFG.EDUCATION_OPTIONS || []);
    fillSelect($('#referral'), CFG.REFERRAL_OPTIONS || []);
    if (has(CFG.DEFAULT_COUNTRY)) { $('#country').value = CFG.DEFAULT_COUNTRY; }

    var courseSelect = $('#course');
    courseSelect.innerHTML = '';
    fillSelect(courseSelect, COURSES.map(function (c) {
      return isSet(c.name) ? c.name : 'Cybersecurity & technology training (preview)';
    }));

    // Optional: index.html?course=Course%20Name pre-selects a course.
    try {
      var wanted = new URLSearchParams(window.location.search).get('course');
      if (wanted) {
        COURSES.forEach(function (c) { if (c.name.toLowerCase() === wanted.toLowerCase()) { courseSelect.value = c.name; } });
      }
    } catch (e) { /* ignore */ }
    renderCourseInfo(getCourse(courseSelect.value));
  }

  function renderContacts() {
    var c = CFG.CONTACT || {};
    var list = $('#asideContact');
    list.innerHTML = '';

    function row(iconName, text, href, external) {
      var li = document.createElement('li');
      var node = href ? make('a') : make('div', 'contact-row');
      if (href) {
        node.href = href;
        if (external) { node.target = '_blank'; node.rel = 'noopener noreferrer'; }
      }
      node.appendChild(iconNode(iconName));
      node.appendChild(make('span', null, text));
      li.appendChild(node);
      list.appendChild(li);
    }

    if (isSet(c.PHONE)) { row('phone', c.PHONE, 'tel:' + c.PHONE.replace(/[^\d+]/g, '')); }
    if (isSet(c.EMAIL)) { row('mail', c.EMAIL, 'mailto:' + c.EMAIL.trim()); }
    if (isSet(c.WHATSAPP) && digitsOnly(c.WHATSAPP).length >= 7) {
      row('whatsapp', 'Chat with us on WhatsApp',
        waLink('Hello, I have a question about the training registration.'), true);
    }
    $('#contact').hidden = !list.children.length;
    $('#headerHelp').hidden = !list.children.length;
  }

  function renderSocial() {
    var ul = $('#footerSocial');
    var links = CFG.LINKS || {};
    ul.innerHTML = '';
    var items = [
      ['globe', 'Website', links.HOMEPAGE],
      ['facebook', 'Facebook', links.FACEBOOK],
      ['instagram', 'Instagram', links.INSTAGRAM],
      ['linkedin', 'LinkedIn', links.LINKEDIN],
      ['twitter', 'X (Twitter)', links.X_TWITTER],
      ['youtube', 'YouTube', links.YOUTUBE]
    ];
    items.forEach(function (it) {
      if (!isHttpUrl(it[2])) { return; }
      var li = document.createElement('li');
      var a = make('a');
      a.setAttribute('aria-label', it[1]);
      a.title = it[1];
      a.href = it[2];
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.appendChild(iconNode(it[0]));
      li.appendChild(a);
      ul.appendChild(li);
    });
    ul.hidden = !ul.children.length;
  }

  function renderPayment(box) {
    var p = CFG.PAYMENT || {};
    box.innerHTML = '';
    box.appendChild(iconNode('info'));
    var body = make('div');
    if (p.ENABLED) {
      body.appendChild(make('strong', null, p.TITLE || 'Payment Information'));
      var lines = (p.DETAILS || []).filter(isSet);
      lines.forEach(function (line) { body.appendChild(make('p', null, line)); });
      if (!lines.length && !isHttpUrl(p.LINK)) {
        body.appendChild(make('p', null, p.PENDING_MESSAGE || 'Payment instructions will be provided after registration.'));
      }
      if (isSet(p.NOTE)) { body.appendChild(make('p', null, p.NOTE)); }
      if (isHttpUrl(p.LINK)) {
        var para = make('p');
        var a = make('a', null, p.LINK_LABEL || 'Pay Online');
        a.href = p.LINK; a.target = '_blank'; a.rel = 'noopener noreferrer';
        para.appendChild(a);
        body.appendChild(para);
      }
    } else {
      body.appendChild(make('strong', null, 'Payment'));
      body.appendChild(make('p', null, p.PENDING_MESSAGE || 'Payment instructions will be provided after registration.'));
    }
    box.appendChild(body);
  }

  /* ------------------------------------------------------------------
     6. STEP NAVIGATION
     ------------------------------------------------------------------ */
  function goToStep(n, focus) {
    state.step = n;
    $$('.step-panel').forEach(function (p) { p.hidden = Number(p.getAttribute('data-step')) !== n; });

    $$('.step').forEach(function (li) {
      var i = Number(li.getAttribute('data-step-indicator'));
      li.classList.toggle('is-active', i === n);
      li.classList.toggle('is-done', i < n);
      var dot = $('.step-dot', li);
      dot.innerHTML = '';
      if (i < n) { dot.appendChild(iconNode('check')); } else { dot.textContent = String(i); }
      if (i === n) { li.setAttribute('aria-current', 'step'); } else { li.removeAttribute('aria-current'); }
    });

    $('#stepMeter').textContent = 'Step ' + n + ' of ' + TOTAL_STEPS;
    $('#progressBar').style.width = (n / TOTAL_STEPS * 100) + '%';
    $('#btnBack').hidden = n === 1;
    $('#btnNext').hidden = n === TOTAL_STEPS;
    $('#btnSubmit').hidden = n !== TOTAL_STEPS;
    $('#secureNote').hidden = n !== TOTAL_STEPS;

    if (n === TOTAL_STEPS) { buildReview(); }
    hideAlert();

    if (focus !== false) {
      scrollToEl($('#formCard'));
      var heading = $('.step-panel[data-step="' + n + '"] h3');
      if (heading) { try { heading.focus({ preventScroll: true }); } catch (e) { heading.focus(); } }
    }
  }

  function next() {
    var bad = validateStep(state.step);
    if (bad) {
      showAlert('Please correct the highlighted fields to continue.', false);
      focusField(bad);
      return;
    }
    goToStep(state.step + 1);
  }

  function fillDl(dl, rows) {
    dl.innerHTML = '';
    rows.forEach(function (r) {
      var row = make('div', 'rv-row');
      row.appendChild(make('dt', null, r[0]));
      row.appendChild(make('dd', null, r[1]));
      dl.appendChild(row);
    });
  }

  function buildReview() {
    var d = collect();
    fillDl($('#reviewPersonal'), [
      ['Full name', d.fullName],
      ['Email address', d.email],
      ['Phone number', d.phone],
      ['WhatsApp number', d.whatsapp || 'Not provided'],
      ['Gender', d.gender],
      ['Country', d.country],
      ['State / location', d.state]
    ]);
    fillDl($('#reviewTraining'), [
      ['Course / training', d.course],
      ['Educational / professional background', d.education],
      ['Current occupation', d.occupation],
      ['How you heard about us', d.referral || 'Not specified'],
      ['Additional information', d.additional || 'None']
    ]);
    renderPayment($('#paymentNotice'));
  }

  /* ------------------------------------------------------------------
     7. SUBMITTING THE REGISTRATION
     ------------------------------------------------------------------ */
  var overlayTimer = null;
  function warnBeforeLeave(e) { e.preventDefault(); e.returnValue = ''; return ''; }

  function setSubmitting(on) {
    state.submitting = on;
    $('#overlay').hidden = !on;
    $('#btnSubmit').disabled = on;
    $('#btnBack').disabled = on;
    $('#btnNext').disabled = on;
    $('#btnSubmitText').textContent = on ? 'Submitting\u2026' : 'Submit Registration';
    $('#regForm').setAttribute('aria-busy', on ? 'true' : 'false');
    try { $('#registerView').inert = on; } catch (e) { /* older browsers */ }
    document.body.style.overflow = on ? 'hidden' : '';

    clearInterval(overlayTimer);
    if (on) {
      var messages = [
        'Validating your details\u2026',
        'Saving your registration\u2026',
        'Sending your confirmation email\u2026',
        'Almost done\u2026'
      ];
      var i = 0;
      $('#overlayMsg').textContent = messages[0];
      overlayTimer = setInterval(function () {
        i = Math.min(i + 1, messages.length - 1);
        $('#overlayMsg').textContent = messages[i];
      }, 2600);
      window.addEventListener('beforeunload', warnBeforeLeave);
    } else {
      window.removeEventListener('beforeunload', warnBeforeLeave);
    }
  }

  // PREVIEW MODE: pretends to be the server so you can test the whole experience.
  // Tip: use an email starting with "duplicate@" or "fail@" to see the error screens.
  function simulate(data) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (/^fail@/i.test(data.email)) { reject(new Error('preview network failure')); return; }
        if (/^duplicate@/i.test(data.email)) {
          resolve({ ok: false, code: 'DUPLICATE', message: 'This email address has already been registered for this training. If you did not receive a confirmation email, please contact us.' });
          return;
        }
        var when;
        try {
          when = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) { when = new Date().toString(); }
        resolve({
          ok: true,
          registrationId: 'PREVIEW-' + new Date().getFullYear() + '-0001',
          fullName: data.fullName, email: data.email, course: data.course,
          registeredAt: when, emailSent: false, demo: true
        });
      }, 3200);
    });
  }

  function send(data) {
    if (isDemo()) { return simulate(data); }
    var controller = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) { controller.abort(); } }, CFG.REQUEST_TIMEOUT_MS || 30000);
    return fetch(CFG.APPS_SCRIPT_URL.trim(), {
      method: 'POST',
      // "text/plain" avoids a CORS pre-flight request, which Google Apps Script cannot answer.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'omit',
      signal: controller ? controller.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) { throw new Error('http'); }
      return r.json();
    }).catch(function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  function submit() {
    hideAlert();

    // Check every step one final time before sending anything.
    for (var s = 1; s <= TOTAL_STEPS; s++) {
      var bad = validateStep(s);
      if (bad) {
        goToStep(s, false);
        showAlert('Please correct the highlighted fields before submitting.', false);
        focusField(bad);
        return;
      }
    }

    var data = collect();
    data.consent = true;
    data.botTrap = $('#botTrap').value;                 // spam trap (must stay empty)
    data.elapsedMs = Date.now() - pageLoadedAt;         // time taken to fill the form (spam check)

    // Same data = same submission ID, so a retry after a dropped connection can never create a duplicate.
    var fingerprint = JSON.stringify([data.fullName, data.email, data.phone, data.whatsapp, data.gender, data.country,
      data.state, data.education, data.occupation, data.course, data.referral, data.additional]);
    if (!state.submissionId || fingerprint !== state.lastFingerprint) {
      state.submissionId = uuid();
      state.lastFingerprint = fingerprint;
    }
    data.submissionId = state.submissionId;

    setSubmitting(true);
    send(data).then(function (res) {
      setSubmitting(false);
      handleResult(res, data);
    }).catch(function () {
      setSubmitting(false);
      showAlert(GENERIC_ERROR);
    });
  }

  function handleResult(res, data) {
    if (res && res.ok === true && typeof res.registrationId === 'string' &&
        /^[A-Za-z0-9_-]{8,80}$/.test(res.registrationId) && res.registrationId !== 'PENDING') {
      showSuccess(res, data); return;
    }

    var code = res && res.code;
    if (code === 'DUPLICATE') {
      var dupMsg = (res.message && String(res.message)) ||
        'This email address has already been registered for this training.';
      goToStep(1, false);
      setError('email', dupMsg);
      showAlert(dupMsg, false);
      focusField('email');
      return;
    }
    if (code === 'VALIDATION' && res.errors && typeof res.errors === 'object') {
      var firstStep = 0, firstField = '';
      for (var s = 1; s <= TOTAL_STEPS; s++) {
        STEP_FIELDS[s].forEach(function (f) {
          if (res.errors[f]) {
            setError(f, String(res.errors[f]));
            if (!firstStep) { firstStep = s; firstField = f; }
          }
        });
      }
      if (firstStep) {
        goToStep(firstStep, false);
        showAlert('Please correct the highlighted fields and try again.', false);
        focusField(firstField);
        return;
      }
    }
    if (code === 'CLOSED') { showClosed(res.message); return; }
    showAlert(GENERIC_ERROR);
  }

  /* ------------------------------------------------------------------
     8. SUCCESS VIEW
     ------------------------------------------------------------------ */
  function showSuccess(res, data) {
    var org = CFG.ORGANISATION_NAME || '';
    var name = res.fullName || data.fullName;
    var course = res.course || data.course;
    var email = res.email || data.email;
    var id = res.registrationId || '\u2014';
    var when = res.registeredAt || '';
    state.lastResult = { id: id };

    var values = { name: name, course: course, id: id, email: email, date: when };
    $$('[data-success]').forEach(function (el) { el.textContent = values[el.getAttribute('data-success')] || ''; });

    $('#successTitle').textContent = res.demo === true ? 'Preview completed' : 'Registration successful!';
    $('#successLeadFirst').textContent = res.demo === true ? 'This is a preview of the registration for ' : 'Thank you for registering for ';
    $('#successLeadSentence').textContent = res.demo === true ? '. No registration has been submitted.' : '. Your registration has been received successfully.';
    $('#successIdLabel').textContent = res.demo === true ? 'Preview ID (not a registration)' : 'Registration ID';
    $('#successEmailLine').textContent = res.demo === true
      ? 'Nothing was saved or emailed.'
      : (res.emailSent === false
        ? 'We could not send your confirmation email right now, but your registration is safely saved. Please keep your Registration ID and contact us if you need any help.'
        : (res.emailSent === null
          ? 'Your registration is saved. Please check your inbox shortly and keep your Registration ID in case you need help.'
          : 'A confirmation email containing your registration details and next steps has been sent to your email address.'));

    var ol = $('#successNext');
    ol.innerHTML = '';
    (res.demo === true
      ? ['Configure your course and deploy Google Apps Script.', 'Paste its Web App URL into js/config.js.',
          'Test a real registration before sharing this page.']
      : (CFG.NEXT_STEPS || [])).forEach(function (t) { ol.appendChild(make('li', null, t)); });
    $('.next-steps').hidden = !ol.children.length;

    renderPayment($('#successPayment'));
    $('#successPayment').hidden = res.demo === true;

    $('#btnHome').href = homeUrl();

    var wa = $('#btnWhatsApp');
    var waNumber = CFG.CONTACT && CFG.CONTACT.WHATSAPP;
    if (res.demo !== true && isSet(waNumber) && digitsOnly(waNumber).length >= 7) {
      wa.href = waLink('Hello ' + org + ', I have just registered for ' + course + '. My name is ' + name +
        ' and my Registration ID is ' + id + '.');
      wa.hidden = false;
    } else { wa.hidden = true; }

    var group = $('#btnGroup');
    if (res.demo !== true && isHttpUrl(CFG.WHATSAPP_GROUP_LINK)) { group.href = CFG.WHATSAPP_GROUP_LINK; group.hidden = false; } else { group.hidden = true; }

    resetForm();                       // wipe personal data from the form fields
    $('#registerView').hidden = true;
    $('#successView').hidden = false;
    document.title = (res.demo === true ? 'Preview Completed' : 'Registration Successful') + ' | ' + org;
    window.scrollTo(0, 0);
    var title = $('#successTitle');
    if (title) { try { title.focus({ preventScroll: true }); } catch (e) { title.focus(); } }
  }

  function showRegister() {
    $('#successView').hidden = true;
    $('#registerView').hidden = false;
    document.title = 'Course Registration | ' + (CFG.ORGANISATION_NAME || '');
    goToStep(1, false);
    window.scrollTo(0, 0);
  }

  function showClosed(message) {
    $('#formCard').hidden = true;
    $('#closedCard').hidden = false;
    $('#closedMessage').textContent = message || CFG.REGISTRATION_CLOSED_MESSAGE || 'Registration is currently closed.';
    $('#heroBadge').textContent = 'Registration Closed';
    $('.eyebrow').classList.add('is-closed');
    $('.hero-action').hidden = true;
    if (state.submitting) { setSubmitting(false); }
    $('#registerView').hidden = false;
    $('#successView').hidden = true;
    window.scrollTo(0, 0);
  }

  function resetForm() {
    $('#regForm').reset();
    $$('[data-field]').forEach(function (w) {
      setError(w.getAttribute('data-field'), '');
      w.removeAttribute('data-touched');
    });
    $('#sameWhatsapp').checked = true;
    syncWhatsapp();
    if (has(CFG.DEFAULT_COUNTRY)) { $('#country').value = CFG.DEFAULT_COUNTRY; }
    $('#additional-count').textContent = '0 / 1000';
    $('#email-suggest').hidden = true;
    renderCourseInfo(getCourse($('#course').value));
    state.submissionId = '';
    state.lastFingerprint = '';
    hideAlert();
  }

  function copyId() {
    var id = state.lastResult && state.lastResult.id;
    if (!id) { return; }
    var btn = $('#btnCopyId');
    function done() {
      btn.classList.add('is-copied');
      btn.innerHTML = '';
      btn.appendChild(iconNode('check'));
      setTimeout(function () {
        btn.classList.remove('is-copied');
        btn.innerHTML = '';
        btn.appendChild(iconNode('copy'));
      }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(done, function () { /* ignore */ });
    } else {
      var t = document.createElement('textarea');
      t.value = id; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
      document.body.removeChild(t);
    }
  }

  /* ------------------------------------------------------------------
     9. EXTRAS: WhatsApp "same as phone", email typo hint, character counter
     ------------------------------------------------------------------ */
  function syncWhatsapp() {
    var same = $('#sameWhatsapp').checked;
    var w = $('#whatsapp');
    if (same) {
      w.value = $('#phone').value;
      w.readOnly = true;
      w.setAttribute('aria-readonly', 'true');
      setError('whatsapp', '');
    } else {
      w.readOnly = false;
      w.removeAttribute('aria-readonly');
    }
  }

  var DOMAIN_FIXES = {
    'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com',
    'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com',
    'yahoo.con': 'yahoo.com', 'hotmial.com': 'hotmail.com', 'hotmail.con': 'hotmail.com',
    'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'icloud.con': 'icloud.com'
  };

  function checkEmailTypo() {
    var box = $('#email-suggest');
    box.hidden = true;
    box.innerHTML = '';
    var v = fieldValue('email');
    var at = v.lastIndexOf('@');
    if (at < 1) { return; }
    var fix = DOMAIN_FIXES[v.slice(at + 1)];
    if (!fix) { return; }
    var suggestion = v.slice(0, at + 1) + fix;
    box.appendChild(document.createTextNode('Did you mean '));
    var b = make('button', null, suggestion);
    b.type = 'button';
    b.addEventListener('click', function () {
      $('#email').value = suggestion;
      box.hidden = true;
      validateField('email');
    });
    box.appendChild(b);
    box.appendChild(document.createTextNode('?'));
    box.hidden = false;
  }

  /* ------------------------------------------------------------------
     10. EVENT WIRING
     ------------------------------------------------------------------ */
  function wireEvents() {
    var form = $('#regForm');

    $('#btnNext').addEventListener('click', next);
    $('#btnBack').addEventListener('click', function () { if (!state.submitting && state.step > 1) { goToStep(state.step - 1); } });
    $$('[data-goto]').forEach(function (b) {
      b.addEventListener('click', function () { if (!state.submitting) { goToStep(Number(b.getAttribute('data-goto'))); } });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (state.submitting) { return; }
      if (state.step < TOTAL_STEPS) { next(); return; }
      submit();
    });

    // Enter key moves to the next step instead of submitting early.
    form.addEventListener('keydown', function (e) {
      var t = e.target;
      if (e.key === 'Enter' && t && t.tagName === 'INPUT' && t.type !== 'checkbox' && t.type !== 'radio' && t.type !== 'submit') {
        e.preventDefault();
        if (!state.submitting && state.step < TOTAL_STEPS) { next(); }
      }
    });

    // Validate a field when the user leaves it, and clear its error as soon as it becomes valid.
    form.addEventListener('focusout', function (e) {
      var t = e.target;
      if (!t || !t.name || t.name === 'botTrap') { return; }
      var wrap = t.closest('[data-field]');
      if (!wrap) { return; }
      var name = wrap.getAttribute('data-field');
      if (t.type === 'radio' || t.type === 'checkbox') { return; } // these validate on "change"
      // Normalise what was typed (trim, collapse spaces, lower-case emails).
      if (t.id === 'email') { t.value = fieldValue('email'); checkEmailTypo(); }
      else if (t.type === 'text' || t.type === 'tel') { t.value = String(t.value).trim().replace(/\s+/g, ' '); }
      // Don't nag people who are just tabbing through an empty field.
      if (t.value === '' && !wrap.classList.contains('has-error') && !wrap.getAttribute('data-touched')) { return; }
      wrap.setAttribute('data-touched', '1');
      validateField(name);
    });
    form.addEventListener('input', function (e) {
      var wrap = e.target && e.target.closest ? e.target.closest('[data-field]') : null;
      if (wrap && wrap.classList.contains('has-error')) { validateField(wrap.getAttribute('data-field')); }
    });
    form.addEventListener('change', function (e) {
      var t = e.target;
      var wrap = t && t.closest ? t.closest('[data-field]') : null;
      if (!wrap) { return; }
      if (t.tagName === 'SELECT' || t.type === 'radio' || t.id === 'consent') { validateField(wrap.getAttribute('data-field')); }
    });

    $('#sameWhatsapp').addEventListener('change', syncWhatsapp);
    $('#phone').addEventListener('input', function () { if ($('#sameWhatsapp').checked) { $('#whatsapp').value = $('#phone').value; } });
    $('#course').addEventListener('change', function () { renderCourseInfo(getCourse($('#course').value)); });
    $('#additional').addEventListener('input', function () {
      $('#additional-count').textContent = $('#additional').value.length + ' / 1000';
    });

    // Success view buttons
    $('#btnPrint').addEventListener('click', function () { window.print(); });
    $('#btnAnother').addEventListener('click', showRegister);
    $('#btnCopyId').addEventListener('click', copyId);
    $('#btnClose').addEventListener('click', function () {
      window.close(); // works only if this tab was opened by a script; otherwise go to the homepage
      setTimeout(function () { window.location.href = homeUrl(); }, 250);
    });
    $('#btnHome').addEventListener('click', function (e) {
      if (homeUrl() === './') { e.preventDefault(); showRegister(); }
    });
  }

  /* ------------------------------------------------------------------
     11. START
     ------------------------------------------------------------------ */
  function init() {
    applyBranding();
    populateSelects();
    renderContacts();
    renderSocial();
    renderPayment($('#paymentNotice'));
    wireEvents();
    syncWhatsapp();
    goToStep(1, false);

    $('#demoBanner').hidden = !isDemo();
    if (isDemo()) { $('#heroBadge').textContent = 'Registration preview'; }
    if (CFG.REGISTRATION_OPEN === false) { showClosed(CFG.REGISTRATION_CLOSED_MESSAGE); }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
