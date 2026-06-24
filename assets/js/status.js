// Live status from Uptime Kuma, re-checked every 60 seconds.
// Base URL and slug are read from the status pill's data attributes.
(function () {
  var pill = document.getElementById('statusPill');
  if (!pill) return;

  var BASE = pill.getAttribute('data-base') || '';
  var SLUG = pill.getAttribute('data-slug') || '';
  var INTERVAL = 60000;

  var stext = pill.querySelector('.stext');

  function set(state, label) {
    pill.setAttribute('data-state', state);
    if (stext) stext.textContent = label;
  }

  function evaluate(data) {
    var list = data && data.heartbeatList ? data.heartbeatList : {};
    var ids = Object.keys(list);
    var seen = false, problem = false;
    ids.forEach(function (id) {
      var beats = list[id];
      if (beats && beats.length) {
        seen = true;
        if (beats[beats.length - 1].status !== 1) problem = true;
      }
    });
    if (!seen) return 'unknown';
    return problem ? 'degraded' : 'ok';
  }

  function check() {
    if (!BASE || !SLUG) return;
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 6000);
    fetch(BASE + '/api/status-page/heartbeat/' + SLUG, {
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (data) {
        clearTimeout(timer);
        var s = evaluate(data);
        if (s === 'ok') set('ok', 'Operational');
        else if (s === 'degraded') set('degraded', 'Degraded');
        else set('unknown', 'Status');
      })
      .catch(function () {
        clearTimeout(timer);
        // Keep the last known state on a transient failure; only the first check falls back.
        if (pill.getAttribute('data-state') === 'loading') set('unknown', 'Status');
      });
  }

  check();
  setInterval(function () { if (!document.hidden) check(); }, INTERVAL);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
})();
