(() => {
  'use strict';

  const DEFAULT_SITE = {
    brand: 'KINETIC', address: 'Studio address to be confirmed', hours: 'Opening hours to be confirmed',
    equipment: 'Equipment list to be confirmed', classes: 'Class offerings, times, and coaching availability to be confirmed.',
    memberships: [
      { name: 'The Essential', label: 'A steady start', price: 'Price to be confirmed', description: 'Membership details and benefits to be confirmed.' },
      { name: 'The Unlimited', label: 'For your everyday', price: 'Price to be confirmed', description: 'Membership details and benefits to be confirmed.' },
      { name: 'The Guided', label: 'A little more support', price: 'Price to be confirmed', description: 'Membership details and benefits to be confirmed.' }
    ],
    trial: { name: 'Your first session', price: 'Intro offer to be confirmed', description: 'A friendly first visit, designed around you. Final inclusions and price to be confirmed.' },
    products: [
      { id: 'bottle', name: 'Everyday bottle', category: 'Training essentials', price: 'Price to be confirmed', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=82', tag: 'Studio favourite' },
      { id: 'tote', name: 'Kinetic carryall', category: 'Carry it with you', price: 'Price to be confirmed', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=82', tag: 'Made for movement' },
      { id: 'mat', name: 'Recovery mat', category: 'Move & restore', price: 'Price to be confirmed', image: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=900&q=82', tag: 'Coming soon' }
    ]
  };
  const read = (key, fallback) => { try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) : fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { showToast('Could not save in this browser.'); } };
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  let site = { ...DEFAULT_SITE, ...read('kinetic-site', {}) };
  let cart = read('kinetic-cart', []);
  let bookingMode = 'visit';
  let previousFocus = null;
  let toastTimer;
  let activeStaffTab = 'overview';
  const guidance = {};
  const byId = (id) => document.getElementById(id);

  function saveSite() { write('kinetic-site', site); }
  function saveCart() { write('kinetic-cart', cart); }
  function applySite() {
    document.querySelectorAll('.brand > span:last-child').forEach((element) => { if (element.firstChild) element.firstChild.textContent = site.brand; });
    document.querySelectorAll('.footer-bottom > span:first-child').forEach((element) => { element.innerHTML = `© <span>${new Date().getFullYear()}</span> ${escapeHtml(site.brand)}. A place to move well.`; });
    byId('address-copy').textContent = site.address;
    byId('hours-copy').textContent = site.hours;
    byId('equipment-copy').textContent = site.equipment;
    byId('classes-copy').textContent = site.classes;
    byId('trial-title').innerHTML = `${escapeHtml(site.trial.name)}<br><em>starts here.</em>`;
    byId('trial-price').textContent = site.trial.price;
    byId('trial-description').textContent = site.trial.description;
    renderMemberships();
    renderProducts();
    updateCartCount();
  }
  function renderMemberships() {
    byId('membership-grid').innerHTML = site.memberships.map((item, index) => `<article class="member-card ${index === 1 ? 'member-card--featured' : ''}">${index === 1 ? '<span class="card-ribbon">MEMBER FAVOURITE</span>' : ''}<span class="eyebrow">${escapeHtml(item.label)}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p><div class="member-price">${escapeHtml(item.price)}</div><div class="card-divider"></div><ul class="benefit-list"><li><span aria-hidden="true">✓</span> Details to be confirmed with the client</li><li><span aria-hidden="true">✓</span> Your routine, your way</li></ul><button class="button ${index === 1 ? 'button--primary' : 'button--outline'} button--full" data-membership="${escapeHtml(item.name)}">Ask about ${escapeHtml(item.name)} <span aria-hidden="true">↗</span></button></article>`).join('');
  }
  function renderProducts() {
    byId('product-grid').innerHTML = site.products.map((item) => `<article class="product-card"><div class="product-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy"><span>${escapeHtml(item.tag || 'Kinetic edit')}</span><button class="add-product" data-add="${escapeHtml(item.id)}" aria-label="Add ${escapeHtml(item.name)} to bag"><span aria-hidden="true">＋</span></button></div><div class="product-meta"><div><small>${escapeHtml(item.category)}</small><h3>${escapeHtml(item.name)}</h3></div><strong>${escapeHtml(item.price)}</strong></div></article>`).join('') || '<p class="shop-note">The product list is waiting for the client.</p>';
  }
  function updateCartCount() { byId('cart-count').textContent = cart.reduce((sum, item) => sum + item.quantity, 0); }
  function showToast(message) {
    byId('toast-message').textContent = message;
    byId('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { byId('toast').hidden = true; }, 2800);
  }
  function openDialog(id) {
    const dialog = byId(`${id}-dialog`);
    if (!dialog) return;
    previousFocus = document.activeElement;
    dialog.hidden = false;
    document.body.classList.add('dialog-open');
    if (id === 'cart') renderCart();
    if (id === 'staff') { activeStaffTab = 'overview'; renderStaff(); }
    requestAnimationFrame(() => dialog.querySelector('button, input, select, textarea')?.focus());
  }
  function closeDialog(dialog) {
    if (!dialog) return;
    dialog.hidden = true;
    if (!document.querySelector('.dialog-backdrop:not([hidden])')) document.body.classList.remove('dialog-open');
    previousFocus?.focus?.();
  }
  function openBooking(mode = 'visit') {
    bookingMode = mode;
    const quiet = mode === 'quiet';
    byId('booking-title').textContent = quiet ? 'Request a quiet-hour slot' : 'Plan your first visit';
    byId('booking-intro').textContent = quiet ? 'Choose a preferred date and start time. This is a request; the team will confirm availability and session details.' : 'Share a few details and the team can help you plan a relaxed first visit.';
    byId('booking-time-wrap').hidden = !quiet;
    byId('booking-interest-wrap').hidden = quiet;
    byId('quiet-note').hidden = !quiet;
    byId('booking-time').required = quiet;
    byId('booking-errors').hidden = true;
    byId('booking-success').hidden = true;
    byId('booking-form').hidden = false;
    byId('booking-form').reset();
    byId('booking-interest').value = quiet ? 'Quiet-hour gym slot' : 'First visit';
    const now = new Date();
    byId('booking-date').min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    openDialog('booking');
  }
  function addToCart(id) {
    const product = site.products.find((item) => item.id === id);
    if (!product) return;
    const current = cart.find((item) => item.id === id);
    cart = current ? cart.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item) : [...cart, { ...product, quantity: 1 }];
    saveCart(); updateCartCount(); showToast(`${product.name} added to your bag.`);
  }
  function renderCart() {
    const mount = byId('cart-content');
    if (!cart.length) {
      mount.innerHTML = '<div class="empty-bag"><span class="empty-bag-icon" aria-hidden="true">▱</span><h3>Your bag is taking shape.</h3><p>Add a product from the Kinetic edit and it’ll show up here.</p><button class="button button--primary" data-cart-shop>Explore the shop <span aria-hidden="true">↗</span></button></div>';
      return;
    }
    mount.innerHTML = `<div class="cart-content"><div class="cart-items">${cart.map((item) => `<div class="cart-item"><img src="${escapeHtml(item.image)}" alt=""><div class="cart-item__body"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.price)}</small><div class="quantity-control"><button aria-label="Remove one ${escapeHtml(item.name)}" data-quantity="${escapeHtml(item.id)}" data-change="-1">−</button><span>${item.quantity}</span><button aria-label="Add one ${escapeHtml(item.name)}" data-quantity="${escapeHtml(item.id)}" data-change="1">+</button></div></div></div>`).join('')}</div><div class="info-note"><span aria-hidden="true">✳</span><span>All prices are placeholders. Checkout here is a local demo.</span></div><button class="button button--primary button--full" data-checkout>Continue to checkout <span aria-hidden="true">↗</span></button></div>`;
  }
  function renderCheckout() {
    byId('cart-title').textContent = 'Checkout preview';
    byId('cart-content').innerHTML = `<form class="form-stack checkout-form" id="checkout-form"><p class="form-intro">This is a preview checkout. No payment is processed and no order reaches staff yet.</p><div class="checkout-summary">${cart.map((item) => `<div><span>${escapeHtml(item.name)} × ${item.quantity}</span><strong>${escapeHtml(item.price)}</strong></div>`).join('')}</div><div class="field"><label for="checkout-name">Your name</label><input id="checkout-name" name="name" autocomplete="name" required></div><div class="field"><label for="checkout-email">Email address</label><input id="checkout-email" name="email" type="email" autocomplete="email" required></div><div class="info-note"><span aria-hidden="true">✳</span><span>Shipping, taxes, stock, prices, and payment provider are still to be confirmed.</span></div><button class="button button--primary button--full" type="submit">Complete demo checkout <span aria-hidden="true">↗</span></button><button class="text-button" type="button" data-back-to-cart>Back to bag</button></form>`;
  }
  function renderStaff() {
    document.querySelectorAll('[data-staff-tab]').forEach((button) => { button.classList.toggle('is-active', button.dataset.staffTab === activeStaffTab); button.setAttribute('aria-selected', button.dataset.staffTab === activeStaffTab ? 'true' : 'false'); });
    const mount = byId('staff-content');
    if (activeStaffTab === 'overview') {
      mount.innerHTML = `<form class="staff-form" id="site-form"><div><span class="eyebrow">SITE BASICS</span><h3>Keep the front door up to date.</h3><p class="staff-help">Replace these placeholders when the client confirms the details.</p></div><div class="field"><label for="admin-brand">Gym name</label><input id="admin-brand" name="brand" value="${escapeHtml(site.brand)}" required></div><div class="field"><label for="admin-address">Location / address</label><input id="admin-address" name="address" value="${escapeHtml(site.address)}"></div><div class="field"><label for="admin-hours">Opening hours</label><input id="admin-hours" name="hours" value="${escapeHtml(site.hours)}"></div><div class="field"><label for="admin-equipment">Equipment overview</label><textarea id="admin-equipment" name="equipment" rows="3">${escapeHtml(site.equipment)}</textarea></div><div class="field"><label for="admin-classes">Class schedule</label><textarea id="admin-classes" name="classes" rows="3">${escapeHtml(site.classes)}</textarea></div><button class="button button--primary" type="submit">Save site details <span aria-hidden="true">✓</span></button><div class="staff-notice" id="staff-notice" hidden role="status"></div></form>`;
    } else if (activeStaffTab === 'memberships') {
      mount.innerHTML = `<form class="staff-form" id="offers-form"><div><span class="eyebrow">MEMBERSHIPS &amp; FIRST VISIT</span><h3>Shape the offer.</h3><p class="staff-help">Set prices and benefits when the client confirms them.</p></div>${site.memberships.map((item, index) => `<div class="admin-card"><div class="admin-card__heading"><strong>Plan ${String(index + 1).padStart(2, '0')}</strong><span>Membership</span></div><div class="field"><label for="plan-name-${index}">Plan name</label><input id="plan-name-${index}" name="name-${index}" value="${escapeHtml(item.name)}"></div><div class="field"><label for="plan-price-${index}">Price / billing</label><input id="plan-price-${index}" name="price-${index}" value="${escapeHtml(item.price)}"></div><div class="field"><label for="plan-desc-${index}">Benefits and notes</label><textarea id="plan-desc-${index}" name="description-${index}" rows="2">${escapeHtml(item.description)}</textarea></div></div>`).join('')}<div class="admin-card"><div class="admin-card__heading"><strong>First visit</strong><span>Intro offer</span></div><div class="field"><label for="trial-price-admin">Intro offer</label><input id="trial-price-admin" name="trialPrice" value="${escapeHtml(site.trial.price)}"></div><div class="field"><label for="trial-description-admin">Offer details</label><textarea id="trial-description-admin" name="trialDescription" rows="2">${escapeHtml(site.trial.description)}</textarea></div></div><button class="button button--primary" type="submit">Save offers <span aria-hidden="true">✓</span></button><div class="staff-notice" id="staff-notice" hidden role="status"></div></form>`;
    } else if (activeStaffTab === 'shop') {
      mount.innerHTML = `<div class="staff-form"><div><span class="eyebrow">ONLINE STORE</span><h3>Update the product shelf.</h3><p class="staff-help">Checkout is a front-end demo; connect inventory and payments before launch.</p></div>${site.products.map((item) => `<form class="admin-card product-admin" data-product-form="${escapeHtml(item.id)}"><div class="admin-card__heading"><strong>${escapeHtml(item.name)}</strong><button class="remove-button" type="button" data-remove-product="${escapeHtml(item.id)}">Remove</button></div><div class="field"><label>Product name<input name="name" value="${escapeHtml(item.name)}" required></label></div><div class="form-grid"><div class="field"><label>Category<input name="category" value="${escapeHtml(item.category)}"></label></div><div class="field"><label>Price<input name="price" value="${escapeHtml(item.price)}"></label></div></div><div class="field"><label>Image URL<input name="image" value="${escapeHtml(item.image)}"></label></div><button class="button button--outline" type="submit">Save product</button></form>`).join('')}<form class="admin-card" id="new-product-form"><div class="admin-card__heading"><strong>Add a product</strong><span>New listing</span></div><div class="field"><label for="new-name">Product name</label><input id="new-name" name="name" required></div><div class="form-grid"><div class="field"><label for="new-category">Category</label><input id="new-category" name="category"></div><div class="field"><label for="new-price">Price</label><input id="new-price" name="price" value="Price to be confirmed"></div></div><div class="field"><label for="new-image">Image URL (optional)</label><input id="new-image" name="image"></div><button class="button button--primary" type="submit">Add product <span aria-hidden="true">＋</span></button></form></div>`;
    } else {
      const bookings = read('kinetic-bookings', []).sort((a, b) => b.id - a.id);
      const orders = read('kinetic-orders', []).sort((a, b) => b.id - a.id);
      mount.innerHTML = `<div class="staff-form"><div><span class="eyebrow">LOCAL DEMO INBOX</span><h3>Keep requests moving.</h3><p class="staff-help">Submissions from this browser appear here. Nothing is sent to a live gym system.</p></div><div class="request-group"><div class="admin-card__heading"><strong>Visit &amp; quiet-hour requests</strong><span>${bookings.length} total</span></div>${bookings.length ? bookings.map((item) => `<article class="request-card"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.email)} · ${escapeHtml(item.date)}${item.time ? ` · ${escapeHtml(item.time)}` : ''}</small><small>${escapeHtml(item.interest || 'Quiet-hour gym slot')}</small></div><label class="request-status-label">Status<select data-request-status="kinetic-bookings" data-id="${item.id}"><option ${item.status === 'Request received' ? 'selected' : ''}>Request received</option><option ${item.status === 'Awaiting client confirmation' ? 'selected' : ''}>Awaiting client confirmation</option><option ${item.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option><option ${item.status === 'Unable to accommodate' ? 'selected' : ''}>Unable to accommodate</option></select></label></article>`).join('') : '<p class="empty-requests">New visit requests will appear here in this preview.</p>'}</div><div class="request-group"><div class="admin-card__heading"><strong>Demo store orders</strong><span>${orders.length} total</span></div>${orders.length ? orders.map((item) => `<article class="request-card"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.email)} · ${item.products.reduce((sum, product) => sum + product.quantity, 0)} items</small><small>${item.products.map((product) => `${escapeHtml(product.name)} × ${product.quantity}`).join(', ')}</small></div><label class="request-status-label">Status<select data-request-status="kinetic-orders" data-id="${item.id}"><option ${item.status === 'Demo order received' ? 'selected' : ''}>Demo order received</option><option ${item.status === 'Review with client' ? 'selected' : ''}>Review with client</option><option ${item.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option></select></label></article>`).join('') : '<p class="empty-requests">Demo checkout submissions will appear here.</p>'}</div></div>`;
    }
  }
  function setTab(group, button) {
    const siblings = [...group.querySelectorAll('.choice-pill')];
    siblings.forEach((item) => item.classList.toggle('is-selected', item === button));
    guidance[group.dataset.choiceGroup] = button.textContent.trim();
    byId('guidance-submit').disabled = !['goal', 'experience', 'rhythm'].every((key) => guidance[key]);
  }
  function showGuidance() {
    const message = guidance.experience === 'New to it' ? 'Start with a supported first visit.' : guidance.rhythm === 'I’ll see how it goes' ? 'Keep it curious and flexible.' : 'Build a rhythm you can repeat.';
    byId('guidance-questions').hidden = true;
    byId('guidance-result').hidden = false;
    byId('guidance-result').innerHTML = `<span class="result-icon" aria-hidden="true">✳</span><span class="eyebrow">A GOOD FIRST STEP</span><h3>${message}</h3><p>For your goal of <strong>${escapeHtml(guidance.goal.toLowerCase())}</strong>, consider meeting a coach, trying one comfortable session, and adjusting the plan around your week. Your answers can guide a trainer conversation; this isn’t medical or individualized exercise advice.</p><div class="result-actions"><button class="button button--primary" data-guidance-followup>Ask a trainer to follow up <span aria-hidden="true">↗</span></button><button class="text-button" data-guidance-edit>Edit my answers</button></div>`;
  }
  function validateBooking(form) {
    const data = new FormData(form);
    const errors = [];
    if (!String(data.get('name') || '').trim()) errors.push(['name', 'Please add your name.']);
    if (!/^\S+@\S+\.\S+$/.test(String(data.get('email') || ''))) errors.push(['email', 'Enter a valid email address.']);
    if (!data.get('date')) errors.push(['date', 'Choose a preferred date.']);
    if (bookingMode === 'quiet' && !data.get('time')) errors.push(['time', 'Choose a preferred start time.']);
    return { data, errors };
  }

  document.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open]');
    if (open) { event.preventDefault(); if (open.dataset.open === 'quiet-booking') openBooking('quiet'); else if (open.dataset.open === 'booking') openBooking('visit'); else openDialog(open.dataset.open); return; }
    if (event.target.matches('[data-close]')) { closeDialog(event.target.closest('.dialog-backdrop')); return; }
    const backdrop = event.target.classList?.contains('dialog-backdrop') ? event.target : null;
    if (backdrop) closeDialog(backdrop);
    const add = event.target.closest('[data-add]'); if (add) { addToCart(add.dataset.add); return; }
    const member = event.target.closest('[data-membership]'); if (member) { openBooking('visit'); byId('booking-interest').value = 'Membership options'; return; }
    const pill = event.target.closest('.choice-pill'); if (pill) { setTab(pill.closest('[data-choice-group]'), pill); return; }
    const qty = event.target.closest('[data-quantity]'); if (qty) { const amount = Number(qty.dataset.change); cart = cart.map((item) => item.id === qty.dataset.quantity ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0); saveCart(); updateCartCount(); renderCart(); return; }
    if (event.target.closest('[data-checkout]')) { renderCheckout(); byId('cart-title').textContent = 'Checkout preview'; return; }
    if (event.target.closest('[data-back-to-cart]')) { byId('cart-title').textContent = 'Your bag'; renderCart(); return; }
    if (event.target.closest('[data-cart-shop]')) { closeDialog(byId('cart-dialog')); document.getElementById('shop').scrollIntoView({ behavior: 'smooth' }); return; }
    if (event.target.closest('[data-guidance-followup]')) { openBooking('visit'); return; }
    if (event.target.closest('[data-guidance-edit]')) { byId('guidance-result').hidden = true; byId('guidance-questions').hidden = false; return; }
    const tab = event.target.closest('[data-staff-tab]'); if (tab) { activeStaffTab = tab.dataset.staffTab; renderStaff(); return; }
    const remove = event.target.closest('[data-remove-product]'); if (remove) { site.products = site.products.filter((item) => item.id !== remove.dataset.removeProduct); saveSite(); applySite(); renderStaff(); showToast('Product removed from the preview.'); return; }
    if (event.target.closest('#menu-trigger')) { const nav = byId('main-nav'); const openState = nav.classList.toggle('is-open'); event.target.closest('#menu-trigger').setAttribute('aria-expanded', String(openState)); event.target.closest('#menu-trigger').setAttribute('aria-label', openState ? 'Close menu' : 'Open menu'); return; }
    if (event.target.closest('#toast-close')) byId('toast').hidden = true;
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.id === 'booking-form') {
      event.preventDefault();
      const { data, errors } = validateBooking(form);
      const summary = byId('booking-errors');
      if (errors.length) { summary.innerHTML = `<strong>${errors.length === 1 ? 'There’s one thing to check' : `There are ${errors.length} things to check`}</strong>${errors.map(([field, text]) => `<a href="#booking-${field}">${escapeHtml(text)}</a>`).join('')}`; summary.hidden = false; summary.focus(); return; }
      const requests = read('kinetic-bookings', []);
      write('kinetic-bookings', [...requests, { id: Date.now(), name: data.get('name'), email: data.get('email'), date: data.get('date'), time: data.get('time'), interest: data.get('interest'), status: 'Request received' }]);
      form.hidden = true;
      byId('booking-success').hidden = false;
      byId('booking-success').innerHTML = '<span class="success-icon" aria-hidden="true">✓</span><h3>Request received.</h3><p>This preview saved your request on this device. The team will confirm your visit, session length, availability, and any pricing directly.</p><button class="button button--primary" data-close>Done</button>';
      return;
    }
    if (form.id === 'checkout-form') {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form); const orders = read('kinetic-orders', []);
      write('kinetic-orders', [...orders, { id: Date.now(), products: cart, name: data.get('name'), email: data.get('email'), status: 'Demo order received' }]);
      cart = []; saveCart(); updateCartCount(); closeDialog(byId('cart-dialog')); showToast('Checkout preview complete. No payment was taken.'); return;
    }
    if (form.id === 'site-form') {
      event.preventDefault(); const data = new FormData(form);
      site = { ...site, brand: data.get('brand').trim() || DEFAULT_SITE.brand, address: data.get('address').trim() || 'Studio address to be confirmed', hours: data.get('hours').trim() || 'Opening hours to be confirmed', equipment: data.get('equipment').trim() || 'Equipment list to be confirmed', classes: data.get('classes').trim() || DEFAULT_SITE.classes };
      saveSite(); applySite(); renderStaff(); byId('staff-content').insertAdjacentHTML('afterbegin', '<div class="staff-notice" role="status">Site details saved in this browser preview.</div>'); return;
    }
    if (form.id === 'offers-form') {
      event.preventDefault(); const data = new FormData(form);
      site.memberships = site.memberships.map((item, index) => ({ ...item, name: data.get(`name-${index}`).trim() || item.name, price: data.get(`price-${index}`).trim() || 'Price to be confirmed', description: data.get(`description-${index}`).trim() || 'Membership details and benefits to be confirmed.' }));
      site.trial = { ...site.trial, price: data.get('trialPrice').trim() || 'Intro offer to be confirmed', description: data.get('trialDescription').trim() || DEFAULT_SITE.trial.description };
      saveSite(); applySite(); activeStaffTab = 'memberships'; renderStaff(); byId('staff-content').insertAdjacentHTML('afterbegin', '<div class="staff-notice" role="status">Offers saved in this browser preview.</div>'); return;
    }
    const productForm = form.closest('[data-product-form]');
    if (productForm) { event.preventDefault(); const data = new FormData(form); site.products = site.products.map((item) => item.id === productForm.dataset.productForm ? { ...item, name: data.get('name').trim() || item.name, category: data.get('category').trim(), price: data.get('price').trim() || 'Price to be confirmed', image: data.get('image').trim() || item.image } : item); saveSite(); applySite(); renderStaff(); showToast('Product saved in this browser preview.'); return; }
    if (form.id === 'new-product-form') { event.preventDefault(); const data = new FormData(form); site.products.push({ id: `product-${Date.now()}`, name: data.get('name').trim(), category: data.get('category').trim() || 'Kinetic edit', price: data.get('price').trim() || 'Price to be confirmed', image: data.get('image').trim() || DEFAULT_SITE.products[0].image, tag: 'New arrival' }); saveSite(); applySite(); activeStaffTab = 'shop'; renderStaff(); showToast('Product added to the preview.'); }
  });

  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-request-status]');
    if (!select) return;
    const records = read(select.dataset.requestStatus, []).map((item) => String(item.id) === select.dataset.id ? { ...item, status: select.value } : item);
    write(select.dataset.requestStatus, records);
    showToast('Request status updated in this browser preview.');
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]')) {
      const nav = byId('main-nav');
      if (nav.classList.contains('is-open')) { nav.classList.remove('is-open'); byId('menu-trigger').setAttribute('aria-expanded', 'false'); byId('menu-trigger').setAttribute('aria-label', 'Open menu'); }
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { const open = document.querySelector('.dialog-backdrop:not([hidden])'); if (open) closeDialog(open); }
    if (event.key !== 'Tab') return;
    const dialog = document.querySelector('.dialog-backdrop:not([hidden]) .dialog');
    if (!dialog) return;
    const focusable = [...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')];
    if (!focusable.length) return;
    if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
  });

  byId('year').textContent = new Date().getFullYear();
  applySite();
})();
