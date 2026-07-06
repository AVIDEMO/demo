function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch(e) {}
}

function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'light' ? 'dark' : 'light');
}

var lastScroll = 0;
window.addEventListener('scroll', function() {
    var header = document.querySelector('header');
    if (!header) return;
    var cur = window.pageYOffset || document.documentElement.scrollTop;
    var delta = cur - lastScroll;
    if (Math.abs(delta) < 5) { lastScroll = cur; return; }
    header.style.transform = delta > 0 ? 'translateY(-100%)' : 'translateY(0)';
    lastScroll = cur;
}, { passive: true });

document.addEventListener('click', function(e) {
    var toggle = e.target.closest('[data-toggle-theme]');
    if (toggle) {
        e.preventDefault();
        toggleTheme();
    }
});

function formatText(str) {
    if (!str) return '';
    var ph = {}, c = 0, key;
    str = str.replace(/\\(.)/g, function(m, ch) { key = '\x00F' + (c++) + '\x00'; ph[key] = ch; return key; });
    str = str.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    str = str.replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>');
    str = str.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    str = str.replace(/==([^=]+)==/g, '<mark class="hl">$1</mark>');
    str = str.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    str = str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    str = str.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    str = str.replace(/\^([^^]+)\^/g, '<sup>$1</sup>');
    str = str.replace(/~([^~]+)~/g, '<sub>$1</sub>');
    str = str.replace(/\{([^}]+)\|([^}]+)\}/g, '<a href="$2"><strong>$1</strong></a>');
    str = str.replace(/\n/g, '<br>');
    for (var k in ph) { str = str.replace(k, ph[k]); }
    return str;
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
              .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function nl2br(str) {
    if (!str) return '';
    return str.replace(/\n/g, '<br>');
}
