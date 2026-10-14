const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = reducedQuery.matches;
let paused = reducedMotion;
let garden, lenis, motionContext, motionMedia, ticker, motionProgress = 0, heroEntranceDone = false;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

// Navigation remains ordinary anchors; only the optional dropdown is scripted.
const navToggle = $('.menu-toggle');
const servicesToggle = $('#services-toggle');
function closeDropdown() { servicesToggle.setAttribute('aria-expanded', 'false'); $('#services-menu').hidden = true; }
servicesToggle.addEventListener('click', () => { const open = servicesToggle.getAttribute('aria-expanded') !== 'true'; servicesToggle.setAttribute('aria-expanded', String(open)); $('#services-menu').hidden = !open; });
navToggle.addEventListener('click', () => { const open = navToggle.getAttribute('aria-expanded') !== 'true'; navToggle.setAttribute('aria-expanded', String(open)); navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); $('#main-nav').classList.toggle('is-open', open); });
document.addEventListener('click', event => { if (!event.target.closest('.nav-dropdown')) closeDropdown(); if (!event.target.closest('.site-header')) closeNav(); });
function closeNav() { navToggle.setAttribute('aria-expanded', 'false'); navToggle.setAttribute('aria-label', 'Open navigation'); $('#main-nav').classList.remove('is-open'); }
document.addEventListener('keydown', event => { if (event.key === 'Escape') { const wasOpen = servicesToggle.getAttribute('aria-expanded') === 'true'; const wasMobileOpen=navToggle.getAttribute('aria-expanded')==='true'; closeDropdown(); closeNav(); if(wasMobileOpen)navToggle.focus(); else if (wasOpen) servicesToggle.focus(); } });
$$('nav a').forEach(a => a.addEventListener('click', () => { closeNav(); closeDropdown(); }));

const serviceData = {
  lawn: { image: 'lawn.jpg', alt: 'Lush green lawn beside a landscaped home', caption: 'Room to breathe. Space to enjoy.' },
  hedges: { image: 'detail.jpg', alt: 'Carefully shaped green hedges and lush garden planting', caption: 'The little details make the difference.' },
  cleanup: { image: 'garden.jpg', alt: 'An inviting landscaped lawn and outdoor living space', caption: 'A fresh start for your outdoors.' },
  beds: { image: 'detail.jpg', alt: 'Carefully shaped green planting in a garden', caption: 'Attention to the spaces in between.', care:'hedges' },
  leaves: { image: 'garden.jpg', alt: 'An open lawn and inviting patio', caption: 'Make room for life outside.', care:'cleanup' },
  recurring: { image: 'lawn.jpg', alt: 'An inviting green lawn beside a landscaped home', caption: 'Good care becomes a good routine.', care:'lawn' }
};
function setService(key) {
  const data = serviceData[key]; if (!data) return;
  $$('.service-trigger').forEach(button => { const open = button.dataset.care === key; button.setAttribute('aria-expanded', String(open)); button.closest('.service-item').classList.toggle('is-open', open); $('.service-symbol', button).textContent = open ? '−' : '+'; document.getElementById(button.getAttribute('aria-controls')).hidden = !open; });
  const img = $('#service-image');
  const change = () => { img.src = `./assets/${data.image}`; img.alt = data.alt; $('#service-caption').textContent = data.caption; };
  if (gsap && !paused) gsap.to(img, { opacity: .35, duration: .18, overwrite: true, onComplete: () => { change(); gsap.to(img, { opacity: 1, duration: .35 }); } }); else change();
  garden?.setCare(data.care || key);
  ScrollTrigger?.refresh();
}
$$('[data-care]').forEach(button => button.addEventListener('click', () => setService(button.dataset.care)));
$$('[data-service]').forEach(a => a.addEventListener('click', () => setService(a.dataset.service)));
$$('[data-select]').forEach(a => a.addEventListener('click', () => { $('#service-select').value = a.dataset.select; if(a.dataset.select==='Recurring lawn care')$('input[name="frequency"][value="Recurring care"]').checked=true; openFormStep(0,false); }));
$$('.faq details').forEach(details => details.addEventListener('toggle', () => ScrollTrigger?.refresh()));

// Preparing a mail draft is deliberately different from claiming a request was sent.
let formStep = 0;
function openFormStep(index, focus = true) {
  formStep=index;
  $$('.form-step').forEach(step=>step.hidden=Number(step.dataset.step)!==index);
  $$('[data-form-marker]').forEach(marker=>{const current=Number(marker.dataset.formMarker)===index;marker.classList.toggle('is-current',current);if(current)marker.setAttribute('aria-current','step');else marker.removeAttribute('aria-current');});
  if(index===1)$('#request-summary').textContent=`${$('#service-select').value} · ${$('select[name="timing"]').value}. You can add more service interests in the notes below.`;
  if(focus){$(`[data-step="${index}"] input, [data-step="${index}"] select`)?.focus({preventScroll:true});if(lenis)lenis.scrollTo($('#quote'),{offset:-115,duration:.65});else $('#quote').scrollIntoView({behavior:'auto',block:'start'});}
  ScrollTrigger?.refresh();
}
function nextFormStep(){const invalid=$$('[data-step="0"] [required]').find(field=>!field.validity.valid);if(invalid){invalid.reportValidity();return;}openFormStep(1);}
$('#form-next').addEventListener('click',nextFormStep);
$('#form-back').addEventListener('click',()=>openFormStep(0));
$('#quote-form').addEventListener('keydown',event=>{if(event.key==='Enter'&&formStep===0&&event.target.tagName==='INPUT'){event.preventDefault();nextFormStep();}});
let requestText = '';
$('#quote-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const fields = new FormData(event.currentTarget);
  requestText = `Hello JCP Lawn Service,\n\nI'd like to discuss lawn care for my property.\n\nName: ${fields.get('name')}\nEmail: ${fields.get('email')}\nPhone: ${fields.get('phone') || 'Not provided'}\nProperty: ${fields.get('address')}\nService: ${fields.get('service')}\nFrequency: ${fields.get('frequency')}\nApproximate lawn area: ${fields.get('lawnArea')}\nPreferred timing: ${fields.get('timing')}\n\nDetails: ${fields.get('details') || 'I can share more details when we speak.'}\n\nPlease let me know about availability and next steps.\nThank you!`;
  const status = $('.form-status'); status.hidden = false; status.textContent = 'Your draft is ready. Send it from your email app to complete your request. If it doesn’t open, copy your request below and email it to JCP.';
  $('.request-fallback').hidden = false;
  location.href = `mailto:juancpantoja78@gmail.com?subject=${encodeURIComponent('Lawn care request — ' + fields.get('name'))}&body=${encodeURIComponent(requestText)}`;
  ScrollTrigger?.refresh();
});
$('#copy-request').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(requestText); $('.form-status').textContent = 'Request copied. Paste it into an email to juancpantoja78@gmail.com and send when you’re ready.'; }
  catch { const area = document.createElement('textarea'); area.value = requestText; area.setAttribute('aria-label','Your prepared request — select and copy'); $('.request-fallback').after(area); area.focus(); area.select(); $('.form-status').textContent = 'Select and copy the request below, then email it to juancpantoja78@gmail.com.'; }
});
$('#quote-form').hidden = false;
$('#quote-fallback').hidden = true;
document.documentElement.classList.add('js-ready');

function startMotion() {
  if (!gsap || !ScrollTrigger || paused) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) { lenis = new window.Lenis({ lerp: .085, smoothWheel: true, wheelMultiplier: .85, anchors: { offset: -115 } }); lenis.on('scroll', ScrollTrigger.update); ticker = time => lenis.raf(time * 1000); gsap.ticker.add(ticker); gsap.ticker.lagSmoothing(0); }
  motionContext = gsap.context(() => {
    if(!heroEntranceDone){heroEntranceDone=true;gsap.timeline({ defaults: { ease: 'power3.out' } }).from('.garden-stage', { opacity: 0, y: 20, duration: 1.3 }).from('.line-mask>span', { yPercent: 110, duration: 1.1, stagger: .12 }, .12).from('.location,.hero-copy>p,.hero-actions', { opacity: 0, y: 13, duration: .9, stagger: .1 }, .38);}
    motionMedia=gsap.matchMedia();
    motionMedia.add('(min-width: 960px) and (min-height: 600px)',()=>{
      document.documentElement.classList.add('scroll-story-enabled');
      const progress={value:0};
      const journey=gsap.timeline({scrollTrigger:{id:'garden-journey',trigger:'.hero',start:'top top',end:()=>`+=${Math.round(innerHeight*1.05)}`,pin:true,scrub:1,anticipatePin:1,invalidateOnRefresh:true}});
      journey.to(progress,{value:1,duration:1,ease:'none',onUpdate:()=>{motionProgress=progress.value;garden?.setScrollProgress(motionProgress);}},0)
        .to('.hero-copy',{autoAlpha:0,y:-35,duration:.22,ease:'power2.inOut'},.12)
        .fromTo('.journey-copy',{autoAlpha:0,y:25},{autoAlpha:1,y:0,duration:.26,ease:'power2.out'},.34)
        .to('.garden-stage',{xPercent:3,scale:1.025,duration:1,ease:'none'},0)
        .to('.journey-meter b',{scaleX:1,duration:1,ease:'none'},0);
      return()=>{document.documentElement.classList.remove('scroll-story-enabled');motionProgress=0;garden?.setScrollProgress(0);};
    });
    motionMedia.add('(max-width: 959px), (max-height: 599px)',()=>{
      ScrollTrigger.create({trigger:'.hero',start:'top top',end:'bottom top',onUpdate:self=>{motionProgress=self.progress;garden?.setScrollProgress(motionProgress);}});
    });
    ScrollTrigger.create({start:0,end:'max',onUpdate:self=>{$('.reading-progress').style.transform=`scaleX(${self.progress})`;}});
    gsap.to('.care-ribbon-track',{xPercent:-24,ease:'none',scrollTrigger:{trigger:'.care-ribbon',start:'top bottom',end:'bottom top',scrub:1.2}});
    gsap.from('.service-visual', { clipPath: 'inset(12% 8% 12% 8% round 25px)', duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: '.service-layout', start: 'top 85%', once: true } });
    gsap.to('.outdoor-story>img', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.outdoor-story', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    gsap.from('.steps article', { y: 25, opacity: 0, stagger: .15, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.steps', start: 'top 86%', once: true } });
    gsap.to('.guide-orbit',{rotation:150,y:-70,ease:'none',scrollTrigger:{trigger:'.yard-guide',start:'top bottom',end:'bottom top',scrub:1.3}});
    gsap.from('.guide-points article',{x:35,autoAlpha:0,stagger:.16,duration:.85,ease:'power3.out',scrollTrigger:{trigger:'.guide-points',start:'top 85%',once:true}});
    gsap.from('.footer-wordmark', { yPercent: 22, opacity: .4, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });
  });
  ScrollTrigger.refresh();
}
function stopMotion() { garden?.pause(true); if (ticker) gsap?.ticker.remove(ticker); ticker = null; lenis?.destroy(); lenis = null; motionMedia?.revert(); motionMedia=null; motionContext?.revert(); motionContext = null; motionProgress=0; garden?.setScrollProgress(0); $('.reading-progress').style.transform='scaleX(0)'; }
function updateMotionButton() { $('.motion-toggle').setAttribute('aria-pressed', String(paused)); $('.motion-toggle').innerHTML = `<span class="motion-icon">${paused ? '▷' : 'Ⅱ'}</span> ${paused ? 'Resume motion' : 'Pause motion'}`; $('.motion-toggle').title = paused ? 'Resume decorative animations' : 'Pause decorative animations'; }
$('.motion-toggle').addEventListener('click', () => { paused = !paused; paused ? stopMotion() : startMotion(); garden?.pause(paused); updateMotionButton(); });
reducedQuery.addEventListener('change', event => { reducedMotion = event.matches; paused = reducedMotion; stopMotion(); if (!paused) startMotion(); garden?.pause(paused); updateMotionButton(); });
startMotion(); updateMotionButton();
if (gsap && !reducedMotion && matchMedia('(pointer:fine)').matches) $$('[data-magnetic]').forEach(button => { const xTo=gsap.quickTo(button,'x',{duration:.45,ease:'power3.out'}), yTo=gsap.quickTo(button,'y',{duration:.45,ease:'power3.out'}); button.addEventListener('pointermove',event=>{if(paused)return;const r=button.getBoundingClientRect();xTo((event.clientX-r.left-r.width/2)*.08);yTo((event.clientY-r.top-r.height/2)*.12);});button.addEventListener('pointerleave',()=>{xTo(0);yTo(0);}); });
window.addEventListener('load', () => ScrollTrigger?.refresh());
document.fonts.ready.then(() => ScrollTrigger?.refresh());

// Lazy module loading keeps every contact and navigation control working even without WebGL.
import('./scene.js').then(({ initGardenScene }) => {
  garden = initGardenScene({ container: $('#garden'), reducedMotion: paused, onReady: ({fallback} = {}) => { $('.scene-loading')?.remove(); if (fallback) { $('#garden').removeAttribute('tabindex'); $('#garden').setAttribute('aria-label','Illustration of a landscaped California garden'); $('.drag-hint').textContent='A little garden inspiration'; $('.reset-scene').hidden=true; } } });
  garden?.setScrollProgress(motionProgress);
  $$('[data-time]').forEach(button => button.addEventListener('click', () => { $$('[data-time]').forEach(b => { const selected=b===button; b.classList.toggle('is-active',selected); b.setAttribute('aria-pressed',String(selected)); }); $('.garden-stage').classList.toggle('is-sunset',button.dataset.time==='sunset'); garden?.setTime(button.dataset.time); }));
  $('.reset-scene').addEventListener('click', () => garden?.reset());
}).catch(error => { console.error('Garden illustration unavailable',error); $('#garden').innerHTML = '<img src="./assets/lawn.jpg" alt="A beautifully green landscaped lawn" style="width:88%;height:82%;object-fit:cover;border-radius:45% 45% 35% 35%;position:absolute;inset:8% 6%">'; $('#garden').removeAttribute('tabindex'); $('#garden').setAttribute('aria-label','A beautifully green landscaped lawn'); $('.drag-hint').textContent='A little outdoor inspiration'; $('.scene-controls').hidden=true; $('.reset-scene').hidden=true; });
window.addEventListener('pagehide', event => { if(event.persisted){garden?.pause(true);return;} stopMotion(); garden?.dispose(); });
window.addEventListener('pageshow', event => { if(event.persisted){garden?.pause(paused);ScrollTrigger?.refresh();} });
