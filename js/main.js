(function() {
    'use strict';

    var app = document.getElementById('app');

    function setHeader(header) {
        var nameEl = document.getElementById('headerName');
        var subtitleEl = document.getElementById('headerSubtitle');
        var instEl = document.getElementById('headerInstitution');
        var imgEl = document.getElementById('headerImage');
        if (nameEl && header.name !== undefined) nameEl.textContent = header.name;
        if (nameEl && header.name_color) nameEl.style.color = header.name_color;
        if (subtitleEl && header.subtitle !== undefined) subtitleEl.textContent = header.subtitle;
        if (subtitleEl && header.subtitle_color) subtitleEl.style.color = header.subtitle_color;
        if (instEl && header.institution !== undefined) instEl.textContent = header.institution;
        if (imgEl && header.image !== undefined) {
            imgEl.src = header.image || '';
            if (header.image_alt !== undefined) imgEl.alt = header.image_alt || '';
            if (header.image_width) imgEl.width = header.image_width;
            if (header.image_height) imgEl.height = header.image_height;
            imgEl.fetchpriority = 'high';
        }
    }

    function setMeta(siteData) {
        if (siteData.title) {
            var titleEl = document.getElementById('pageTitle');
            if (titleEl) titleEl.textContent = siteData.title;
        }
        if (siteData.description) {
            var meta = document.querySelector('meta[name="description"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = 'description';
                document.head.appendChild(meta);
            }
            meta.content = siteData.description;
        }
        if (siteData.favicon) {
            var fav = document.getElementById('favicon');
            var favShort = document.getElementById('faviconShortcut');
            if (fav) fav.href = siteData.favicon;
            if (favShort) favShort.href = siteData.favicon;
        }
        if (siteData.header) {
            var author = document.getElementById('metaAuthor');
            if (author) author.content = siteData.header.name || '';
            var ogt = document.getElementById('ogTitle');
            if (ogt) ogt.content = (siteData.header.name || '') + (siteData.header.subtitle ? ' — ' + siteData.header.subtitle : '');
            var ogd = document.getElementById('ogDescription');
            if (ogd) ogd.content = siteData.description || '';
        }
        var ogu = document.getElementById('ogUrl');
        if (ogu) ogu.content = window.location.href.split('?')[0].split('#')[0];
        var can = document.getElementById('canonical');
        if (can) can.href = window.location.href.split('?')[0].split('#')[0];
    }

    function setStructuredData(siteData) {
        var existing = document.getElementById('ldJson');
        if (!existing) {
            var script = document.createElement('script');
            script.id = 'ldJson';
            script.type = 'application/ld+json';
            document.head.appendChild(script);
            existing = script;
        }
        var h = siteData.header || {};
        var data = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": h.name || siteData.title || '',
            "jobTitle": h.subtitle || '',
            "affiliation": h.institution ? { "@type": "Organization", "name": h.institution } : undefined,
            "url": window.location.href.split('?')[0].split('#')[0],
            "image": h.image || undefined
        };
        existing.textContent = JSON.stringify(data);
    }

    function initCV(siteData) {
        var cv = siteData.cv;
        var btn = document.getElementById('cvBtn');
        if (!btn || !cv || !cv.enabled) { if (btn) btn.style.display = 'none'; return; }
        btn.textContent = cv.label || 'CV';
        btn.addEventListener('click', function() {
            if (cv.mode === 'view' && cv.viewer) {
                window.open(cv.viewer + '?url=' + encodeURIComponent('../' + cv.path), '_blank');
            } else {
                var a = document.createElement('a');
                a.href = cv.path;
                a.download = 'cv.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }

    function getSiteData() {
        var el = document.getElementById('siteData');
        if (el) {
            try { return Promise.resolve(JSON.parse(el.textContent)); } catch(e) {}
        }
        return fetchJSON('data/site.json');
    }

    function init() {
        getSiteData().then(function(siteData) {
            setMeta(siteData);
            setStructuredData(siteData);
            if (siteData.highlight_color) {
                document.documentElement.style.setProperty('--hl-color', siteData.highlight_color);
            }
            if (siteData.header) setHeader(siteData.header);
            initCV(siteData);

            var sections = siteData.sections || [];
            var promises = [];

            sections.forEach(function(sectionConfig) {
                if (sectionConfig.enabled === false) {
                    promises.push(null);
                    return;
                }
                var sectionPromise = (window.__preloaded && window.__preloaded[sectionConfig.file])
                    || fetchJSON(sectionConfig.file);
                promises.push(
                    sectionPromise.then(function(sectionData) {
                        var render = renderers[sectionData.type];
                        if (render) return render(sectionData);
                        return null;
                    }).catch(function(err) {
                        console.warn('Skipped section:', sectionConfig.file, err.message);
                        return null;
                    })
                );
            });

            return Promise.all(promises).then(function(htmls) {
                app.innerHTML = htmls.filter(function(h) { return h !== null; }).join('');
                var footer = document.getElementById('siteFooter');
                if (footer) footer.style.visibility = 'visible';
            });
        }).catch(function(err) {
            app.innerHTML = '<p style="padding:4rem;text-align:center;color:var(--text-muted);">Failed to load site data.</p>';
            console.error(err);
        });
    }

    init();
})();
