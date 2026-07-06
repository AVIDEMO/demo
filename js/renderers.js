function labelStyle(d) {
    return d.label_color ? ' style="color:' + d.label_color + ';"' : '';
}

function imgCard(item, single) {
    var src = typeof item === 'string' ? item : item.src;
    var alt = typeof item === 'string' ? '' : (item.alt || '');
    var w = typeof item === 'string' ? (single ? 600 : 400) : (item.w || (single ? 600 : 400));
    var h = typeof item === 'string' ? (single ? 400 : 300) : (item.h || (single ? 400 : 300));
    var ar = item.ar ? 'aspect-ratio:' + w + '/' + h + ';' : '';
    var cap = item.caption ? '<div style="grid-area:cap;font-size:0.75rem;color:var(--text-muted);">' + formatText(item.caption) + '</div>' : '';
    var cred = item.credit ? '<span class="img-credit" style="grid-area:stack;justify-self:end;align-self:start;font-size:11px;background:#000;color:#fff;padding:4px 10px;z-index:1;">' + escapeHTML(item.credit) + '</span>' : '';
    var wrapStyle = single ? '' : 'flex:1 1 180px;max-width:280px;';
    return '<div style="' + wrapStyle + 'display:grid;grid-template-areas:\'img\' \'cap\';grid-template-columns:1fr;">' +
        '<div style="grid-area:img;display:grid;grid-template-areas:\'stack\';grid-template-columns:1fr;">' +
            cred +
            '<img src="' + src + '" alt="' + escapeHTML(alt) + '" width="' + w + '" height="' + h + '" loading="lazy" style="grid-area:stack;width:100%;height:auto;' + ar + 'display:block;object-fit:cover;">' +
        '</div>' +
        cap +
    '</div>';
}

function toCSSRatio(r) {
    if (!r) return null;
    return r.replace('x', '/');
}

function parseRatio(r) {
    if (!r) return null;
    var parts = r.replace('/', 'x').split('x');
    if (parts.length !== 2) return null;
    var pw = parseFloat(parts[0]), ph = parseFloat(parts[1]);
    if (isNaN(pw) || isNaN(ph)) return null;
    return { w: pw, h: ph };
}

function renderGallery(gl, items) {
    var html = '';
    var layout = gl.layout || 'grid';
    var ratio = parseRatio(gl.ratio);
    var cols = gl.cols || 3;

        if (layout === 'masonry') {
            html += '<div class="section-media" style="columns:' + cols + ';gap:12px;margin-top:20px;">';
            items.forEach(function(img) {
                var card = imgCard(img, false);
                card = card.replace('<div style="flex:1 1 180px;max-width:280px;', '<div style="break-inside:avoid;margin-bottom:12px;');
                html += card;
            });
            html += '</div>';
        } else {
            html += '<div style="display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:12px;margin-top:20px;">';
            items.forEach(function(img) {
                if (ratio) {
                    img = typeof img === 'string' ? { src: img, ar: true, w: ratio.w, h: ratio.h } : Object.assign({}, img, { ar: true, w: ratio.w, h: ratio.h });
                }
                html += imgCard(img, false);
            });
            html += '</div>';
        }
    return html;
}

function renderEmbed(d) {
    if (!d.embed && !d.embed_html) return '';
    var html = '<div style="margin-top:20px;">';
    if (d.embed_html) {
        html += d.embed_html;
    } else if (d.embed) {
        var e = typeof d.embed === 'string' ? { src: d.embed, type: d.embed_type } : d.embed;
        var src = escapeHTML(e.src);
        var style = 'width:100%;border:0;';
        if (e.type === 'video' || (!e.type && d.embed_type === 'video')) {
            style += 'aspect-ratio:' + (e.ratio || '16/9') + ';';
        } else if (e.type === 'map' || (!e.type && d.embed_type === 'map')) {
            style += 'height:' + (e.height || '350px') + ';';
        } else {
            style += 'aspect-ratio:' + (e.ratio || '16/9') + ';';
        }
        var cap = e.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(e.caption) + '</p>' : '';
        if (e.scale) {
            var sw = e.scaleWidth || 800;
            var sh = e.ratio ? sw / parseFloat(e.ratio.replace('x', '/').split('/')[0]) * parseFloat(e.ratio.replace('x', '/').split('/')[1]) : (e.height ? parseInt(e.height) : sw / 1.3);
            var mb = sh - (sh * e.scale);
            html += '<div style="width:100%;overflow:hidden;"><iframe src="' + src + '" style="width:' + sw + 'px;height:' + sh + 'px;border:0;transform-origin:0 0;transform:scale(' + e.scale + ');margin-bottom:-' + mb + 'px;" allowfullscreen loading="lazy"></iframe></div>';
        } else {
            html += '<iframe src="' + src + '" style="' + style + '" allowfullscreen loading="lazy"></iframe>';
        }
    }
    html += '</div>';
    return html;
}

function renderButtons(d) {
    if (!d.buttons || !d.buttons.length) return '';
    var html = '';
    d.buttons.forEach(function(btn) {
        var st = btn.style === 'outline' ? 'background:transparent;color:var(--text);border:1px solid var(--border);' : 'background:#000;color:#fff;border:none;';
        html += '<div style="margin-top:12px;text-align:' + (btn.align || 'center') + ';"><a href="' + escapeHTML(btn.url || '#') + '" target="_blank" style="display:inline-block;font-family:\'Inter\',sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;padding:12px 28px;text-decoration:none;cursor:pointer;transition:transform .2s,opacity .2s;' + st + '" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'">' + escapeHTML(btn.label || 'Button') + '</a></div>';
    });
    return html;
}

function renderVideo(d) {
    if (!d.video) return '';
    if (typeof d.video === 'string') d.video = { src: d.video };
    var v = d.video;
    var src = v.src;
    var yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (yt) src = 'https://www.youtube.com/embed/' + yt[1];
    var vm = src.match(/vimeo\.com\/(\d+)/);
    if (vm) src = 'https://player.vimeo.com/video/' + vm[1];
    var r = v.ratio ? v.ratio.replace('x', '/') : '16/9';
    var cap = v.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(v.caption) + '</p>' : '';
    return '<div style="margin-top:20px;"><iframe src="' + escapeHTML(src) + '" style="width:100%;aspect-ratio:' + r + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
}

function renderModel(d) {
    if (!d.model) return '';
    if (typeof d.model === 'string') d.model = { src: d.model };
    if (!customElements.get('model-viewer')) {
        var s = document.createElement('script');
        s.type = 'module';
        s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js';
        document.head.appendChild(s);
    }
    var m = d.model;
    var r = m.ratio ? m.ratio.replace('x', '/') : '1/1';
    var cap = m.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(m.caption) + '</p>' : '';
    var rot = m.rotate !== false ? ' auto-rotate' : '';
    return '<div style="margin-top:20px;"><model-viewer src="' + escapeHTML(m.src) + '" style="width:100%;aspect-ratio:' + r + ';min-height:400px;" camera-controls' + rot + ' shadow-intensity="1" loading="lazy"></model-viewer>' + cap + '</div>';
}

function sectionMedia(d) {
    var html = renderEmbed(d) + renderVideo(d) + renderModel(d) + renderButtons(d);
    var groups = d.groups || d.image_groups;
    if (groups && groups.length) {
        groups.forEach(function(group) {
            if (group.type === 'video') {
                var src = group.src;
                var yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                if (yt) src = 'https://www.youtube.com/embed/' + yt[1];
                var vm = src.match(/vimeo\.com\/(\d+)/);
                if (vm) src = 'https://player.vimeo.com/video/' + vm[1];
                var r = toCSSRatio(group.ratio) || '16/9';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(src) + '" style="width:100%;aspect-ratio:' + r + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
                return;
            }
            if (group.type === 'text') { html += '<p style="margin-bottom:1rem;">' + formatText(group.content || '') + '</p>'; return; }
            if (group.type === 'button') {
                var btnStyle = group.btn_style === 'outline' ? 'background:transparent;color:var(--text);border:1px solid var(--border);' : 'background:#000;color:#fff;border:none;';
                html += '<div style="margin-top:20px;text-align:' + (group.align || 'center') + ';"><a href="' + escapeHTML(group.url || '#') + '" target="_blank" style="display:inline-block;font-family:\'Inter\',sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;padding:12px 28px;text-decoration:none;cursor:pointer;transition:transform .2s,opacity .2s;' + btnStyle + '" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'">' + escapeHTML(group.label || 'Button') + '</a></div>';
                return;
            }
            if (group.type === 'model' || group.type === '3d') {
                var r = toCSSRatio(group.ratio) || '1/1';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                var rot = group.rotate !== false ? ' auto-rotate' : '';
                html += '<div style="margin-top:20px;"><model-viewer src="' + escapeHTML(group.src) + '" style="width:100%;aspect-ratio:' + r + ';min-height:400px;" camera-controls' + rot + ' shadow-intensity="1" loading="lazy"></model-viewer>' + cap + '</div>';
                return;
            }

            if (group.type === 'embed') {
                var r = toCSSRatio(group.ratio) || '16/9';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(group.src) + '" style="width:100%;aspect-ratio:' + r + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
                return;
            }
            if (group.image) { var obj = typeof group.image === 'string' ? { src: group.image, alt: group.image_alt || '', caption: group.caption || '', credit: group.credit || '', w: group.w || 600, h: group.h || 400, ar: group.ar === true } : group.image; html += '<div style="margin-top:16px;">' + imgCard(obj, true) + '</div>'; }
            var gl = group.gallery || {};
            if (group.embed) {
                var er = group.embed.ratio || '16/9';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(group.embed.src) + '" style="width:100%;aspect-ratio:' + er + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
            }
            var label = group.label ? '<p style="margin-top:20px;font-size:0.85rem;font-weight:600;">' + escapeHTML(group.label) + '</p>' : '';
            if (group.images) html += label + renderGallery(gl, group.images);
        });
    } else if (d.images && d.images.length) {
        html += renderGallery(d.gallery || {}, d.images);
    } else if (d.image) {
        var obj = typeof d.image === 'string' ? {
            src: d.image, alt: d.image_alt || '', caption: d.caption || '', credit: d.credit || '',
            w: d.w || 600, h: d.h || 400, ar: d.ar === true
        } : d.image;
        html += '<div style="margin-top:16px;">' + imgCard(obj, true) + '</div>';
    }
    return html;
}

var renderers = {};

function renderJSON(d) {
    var html = '';
    var handlers = {
        paragraphs: function() { if (d.paragraphs) d.paragraphs.forEach(function(p) { html += '<p>' + formatText(p) + '</p>'; }); },
        buttons: function() { html += renderButtons(d); },
        image: function() { if (d.image) { var obj = typeof d.image === 'string' ? { src: d.image, alt: d.image_alt || '', caption: d.caption || '', credit: d.credit || '', w: d.w || 600, h: d.h || 400, ar: d.ar === true } : d.image; html += '<div style="margin-top:16px;">' + imgCard(obj, true) + '</div>'; } },
        embed: function() { html += renderEmbed(d); },
        video: function() { html += renderVideo(d); },
        model: function() { html += renderModel(d); },
        images: function() { if (d.images && d.images.length) html += renderGallery(d.gallery || {}, d.images); },
        groups: function() { renderJSONgroups(d.groups || d.image_groups); },
        image_groups: function() { renderJSONgroups(d.groups || d.image_groups); }
    };
    Object.keys(d).forEach(function(key) {
        if (handlers[key]) handlers[key]();
    });
    if (!d.groups && !d.image_groups) renderJSONgroups(null);
    function renderJSONgroups(groups) {
        if (!groups || !groups.length) return;
        groups.forEach(function(group) {
            if (group.type === 'video') { var src = group.src; var yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/); if (yt) src = 'https://www.youtube.com/embed/' + yt[1]; var vm = src.match(/vimeo\.com\/(\d+)/); if (vm) src = 'https://player.vimeo.com/video/' + vm[1]; var r = toCSSRatio(group.ratio) || '16/9'; var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : ''; html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(src) + '" style="width:100%;aspect-ratio:' + r + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>'; return; }
            if (group.type === 'text') { html += '<p style="margin-bottom:1rem;">' + formatText(group.content || '') + '</p>'; return; }
            if (group.type === 'button') { var cls = 'btn ' + (group.btn_style === 'outline' ? 'btn-outline' : 'btn-primary'); html += '<div style="margin-top:20px;text-align:' + (group.align || 'center') + ';"><a href="' + escapeHTML(group.url || '#') + '" target="_blank" class="' + cls + '">' + escapeHTML(group.label || 'Button') + '</a></div>'; return; }
            if (group.type === 'model' || group.type === '3d') { var r = toCSSRatio(group.ratio) || '1/1'; var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : ''; var rot = group.rotate !== false ? ' auto-rotate' : ''; html += '<div style="margin-top:20px;"><model-viewer src="' + escapeHTML(group.src) + '" style="width:100%;aspect-ratio:' + r + ';min-height:400px;" camera-controls' + rot + ' shadow-intensity="1" loading="lazy"></model-viewer>' + cap + '</div>'; return; }
            if (group.type === 'embed') { var r = toCSSRatio(group.ratio) || '16/9'; var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : ''; html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(group.src) + '" style="width:100%;aspect-ratio:' + r + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>'; return; }
            var gl = group.gallery || {};
            if (group.embed) { var er = group.embed.ratio || '16/9'; var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : ''; html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(group.embed.src) + '" style="width:100%;aspect-ratio:' + er + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>'; }
            if (group.image) { var obj = typeof group.image === 'string' ? { src: group.image, alt: group.image_alt || '', caption: group.caption || '', credit: group.credit || '', w: group.w || 600, h: group.h || 400, ar: group.ar === true } : group.image; html += '<div style="margin-top:16px;">' + imgCard(obj, true) + '</div>'; }
            var label = group.label ? '<p style="margin-top:20px;font-weight:500;">' + escapeHTML(group.label) + '</p>' : '';
            if (group.images) html += label + renderGallery(gl, group.images);
        });
    }
    return html;
}

renderers.contact = function(data) {
    var d = data.data;
    var icons = '';
    if (d.icons) {
        d.icons.forEach(function(ic) {
            icons += '<a href="' + ic.url + '" target="_blank" title="' + escapeHTML(ic.label) + '">' +
                '<img src="assets/icons/academic social icons/' + ic.name + '.svg" alt="' + escapeHTML(ic.label) + '" style="display:block;width:24px;height:24px;object-fit:contain;opacity:0.7;transition:transform .2s,opacity .2s;" onmouseover="this.style.transform=\'scale(1.15)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
            '</a>';
        });
    }
    var addr = d.address ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:4px;">' + formatText(escapeHTML(d.address)) + '</p>' : '';
    var extra = d.extra_line ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:20px;">' + formatText(escapeHTML(d.extra_line)) + '</p>' : '';
    var media = sectionMedia(d);
    var txt = d.text ? '<p style="margin-bottom:10px;">' + formatText(escapeHTML(d.text)) + '</p>' : '';
    return '<div class="section">' +
        '<span class="section-label"' + labelStyle(d) + '>' + escapeHTML(d.label) + '</span>' +
        txt +
        addr + extra +
        (icons ? '<div style="display:flex;gap:12px;flex-wrap:wrap;">' + icons + '</div>' : '') +
        media +
    '</div>';
};

renderers.education = function(data) {
    var d = data.data;
    var html = '<div class="section">' +
        '<span class="section-label"' + labelStyle(d) + '>' + escapeHTML(d.label) + '</span>';
    var skip = { label:1, section_num:1, section_title:1, image_alt:1, caption:1, credit:1, w:1, h:1, ar:1, gallery:1, address:1, extra_line:1, text:1, email:1, texts:1, intro:1 };
    var handlers = {
        items: function() {
            d.items.forEach(function(item, i) {
                if (i > 0) html += '<hr style="border:none;border-top:1px solid var(--border);margin:0.75rem 0;">';
                html += '<div class="edu-block">';
                if (item.degree !== undefined) {
                    var inst = item.institution ? formatText(escapeHTML(item.institution)) : '';
                    var yr = item.year ? formatText(escapeHTML(item.year)) : '';
                    var meta = inst && yr ? inst + ' &mdash; ' + yr : inst || yr;
                    html += '<div style="font-size:0.85rem;font-weight:600;">' + formatText(escapeHTML(item.degree)) + '</div>' +
                        (meta ? '<div style="font-size:0.85rem;color:var(--text-muted);">' + meta + '</div>' : '') +
                        (item.description ? '<p style="font-size:0.9rem;margin-top:6px;">' + formatText(escapeHTML(item.description)) + '</p>' : '');
                    html += sectionMedia(item);
                } else if (item.type === 'model') {
                    html += sectionMedia({ model: { src: item.src, ratio: item.ratio || '1/1' } });
                } else if (item.type === 'video') {
                    html += sectionMedia({ video: { src: item.src, ratio: item.ratio || '16/9' } });
                } else if (item.type === 'embed') {
                    html += sectionMedia({ embed: { src: item.src, ratio: item.ratio || '16/9' } });
                } else {
                    html += sectionMedia(item);
                }
                html += '</div>';
            });
        },
        embed: function() { html += renderEmbed(d); },
        video: function() { html += renderVideo(d); },
        model: function() { html += renderModel(d); },
        buttons: function() { html += renderButtons(d); },
        image: function() { if (d.image) { var obj = typeof d.image === 'string' ? { src: d.image, alt: d.image_alt || '', caption: d.caption || '', credit: d.credit || '', w: d.w || 600, h: d.h || 400, ar: d.ar === true } : d.image; html += '<div style="margin-top:16px;">' + imgCard(obj, true) + '</div>'; } },
        images: function() { if (d.images && d.images.length) html += renderGallery(d.gallery || {}, d.images); },
        groups: function() { groupFn(d.groups || d.image_groups); },
        image_groups: function() { groupFn(d.groups || d.image_groups); }
    };
    Object.keys(d).forEach(function(key) { if (handlers[key]) handlers[key](); });
    if (!d.groups && !d.image_groups && (d.items || d.papers || d.texts || d.paragraphs)) html += sectionMedia(d);
    function groupFn(groups) {
        if (!groups || !groups.length) return;
        groups.forEach(function(group) {
            if (group.type === 'education-item') {
                var inst = group.institution ? formatText(escapeHTML(group.institution)) : '';
                var yr = group.year ? formatText(escapeHTML(group.year)) : '';
                var meta = inst && yr ? inst + ' &mdash; ' + yr : inst || yr;
                html += '<div class="edu-block">' +
                    '<div style="font-size:0.85rem;font-weight:600;">' + formatText(escapeHTML(group.degree || group.label || '')) + '</div>' +
                    (meta ? '<div style="font-size:0.85rem;color:var(--text-muted);">' + meta + '</div>' : '') +
                    (group.description ? '<p style="font-size:0.9rem;margin-top:6px;">' + formatText(escapeHTML(group.description)) + '</p>' : '') +
                    '</div>';
                return;
            }
            if (group.type === 'video') {
                var src = group.src;
                var yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                if (yt) src = 'https://www.youtube.com/embed/' + yt[1];
                var vm = src.match(/vimeo\.com\/(\d+)/);
                if (vm) src = 'https://player.vimeo.com/video/' + vm[1];
                var r = toCSSRatio(group.ratio) || '16/9';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(src) + '" style="width:100%;aspect-ratio:' + r + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
                return;
            }
            if (group.type === 'text') { html += '<p style="margin-bottom:1rem;">' + formatText(group.content || '') + '</p>'; return; }
            if (group.type === 'button') {
                var btnStyle = group.btn_style === 'outline' ? 'background:transparent;color:var(--text);border:1px solid var(--border);' : 'background:#000;color:#fff;border:none;';
                html += '<div style="margin-top:20px;text-align:' + (group.align || 'center') + ';"><a href="' + escapeHTML(group.url || '#') + '" target="_blank" style="display:inline-block;font-family:\'Inter\',sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;padding:12px 28px;text-decoration:none;cursor:pointer;transition:transform .2s,opacity .2s;' + btnStyle + '" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'">' + escapeHTML(group.label || 'Button') + '</a></div>';
                return;
            }
            if (group.type === 'model' || group.type === '3d') {
                var r = toCSSRatio(group.ratio) || '1/1';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                var rot = group.rotate !== false ? ' auto-rotate' : '';
                html += '<div style="margin-top:20px;"><model-viewer src="' + escapeHTML(group.src) + '" style="width:100%;aspect-ratio:' + r + ';min-height:400px;" camera-controls' + rot + ' shadow-intensity="1" loading="lazy"></model-viewer>' + cap + '</div>';
                return;
            }
            if (group.type === 'embed') {
                var r = toCSSRatio(group.ratio) || '16/9';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(group.src) + '" style="width:100%;aspect-ratio:' + r + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
                return;
            }
            if (group.image) { var obj = typeof group.image === 'string' ? { src: group.image, alt: group.image_alt || '', caption: group.caption || '', credit: group.credit || '', w: group.w || 600, h: group.h || 400, ar: group.ar === true } : group.image; html += '<div style="margin-top:16px;">' + imgCard(obj, true) + '</div>'; }
            var gl = group.gallery || {};
            if (group.embed) {
                var er = group.embed.ratio || '16/9';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(group.embed.src) + '" style="width:100%;aspect-ratio:' + er + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
            }
            var label = group.label ? '<p style="margin-top:20px;font-weight:500;">' + escapeHTML(group.label) + '</p>' : '';
            if (group.images) html += label + renderGallery(gl, group.images);
        });
    }
    html += '</div>';
    return html;
};

renderers.about = function(data) {
    var d = data.data;
    return '<div class="section">' +
        '<span class="section-label"' + labelStyle(d) + '>' + escapeHTML(d.label) + '</span>' +
        renderJSON(d) +
    '</div>';
};

renderers.publications = function(data) {
    var d = data.data;
    var html = '';
    var numbered = d.numbered === true;
    var skip = { label:1, section_num:1, section_title:1, image_alt:1, caption:1, credit:1, w:1, h:1, ar:1, gallery:1, address:1, extra_line:1, text:1, email:1, texts:1, intro:1, numbered:1 };
    var handlers = {
        papers: function() {
            d.papers.forEach(function(p, i) {
                var ptext = p.text ? '<p style="margin-top:4px;font-size:0.9rem;">' + formatText(escapeHTML(p.text)) + '</p>' : '';
                var pimg = p.image ? '<div style="margin-top:4px;">' + imgCard(
                    { src: p.image, alt: p.image_alt || '', caption: p.caption || '', credit: p.credit || '', w: p.w || 400, h: p.h || 300, ar: p.ar === true },
                    true
                ) + '</div>' : '';
                var numHtml = numbered ? '<span style="font-weight:600;min-width:20px;">' + (i + 1) + '.</span>' : '';
                var metaHtml = p.meta ? '<p style="font-size:0.85rem;color:var(--text-muted);font-style:italic;">' + formatText(escapeHTML(p.meta)) + '</p>' : '';
                var content = '<div class="pub-block" style="display:flex;gap:8px;">' +
                    numHtml +
                    '<div><p style="margin-bottom:2px;"><strong><a href="' + p.url + '">' + formatText(escapeHTML(p.title)) + '</a></strong></p>' +
                    (p.authors ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:2px;">' + formatText(escapeHTML(p.authors)) + '</p>' : '') +
                    metaHtml + '</div>' +
                '</div>';
                var pmedia = sectionMedia(p);
                html += content + ptext + pimg + pmedia;
            });
        },
        embed: function() { html += renderEmbed(d); },
        video: function() { html += renderVideo(d); },
        model: function() { html += renderModel(d); },
        buttons: function() { html += renderButtons(d); },
        image: function() { if (d.image) { var obj = typeof d.image === 'string' ? { src: d.image, alt: d.image_alt || '', caption: d.caption || '', credit: d.credit || '', w: d.w || 600, h: d.h || 400, ar: d.ar === true } : d.image; html += '<div style="margin-top:16px;">' + imgCard(obj, true) + '</div>'; } },
        images: function() { if (d.images && d.images.length) html += renderGallery(d.gallery || {}, d.images); },
        groups: function() { groupFn(d.groups || d.image_groups); },
        image_groups: function() { groupFn(d.groups || d.image_groups); }
    };
    Object.keys(d).forEach(function(key) { if (handlers[key]) handlers[key](); });
    if (!d.groups && !d.image_groups && (d.papers || d.items || d.texts || d.paragraphs)) html += sectionMedia(d);
    function groupFn(groups) {
        if (!groups || !groups.length) return;
        var pubIdx = 0;
        groups.forEach(function(group) {
            if (group.type === 'publication-item') {
                pubIdx++;
                var numHtml = numbered ? '<span style="font-weight:600;min-width:20px;">' + pubIdx + '.</span>' : '';
                var metaHtml = group.meta ? '<p style="font-size:0.85rem;color:var(--text-muted);font-style:italic;">' + formatText(escapeHTML(group.meta)) + '</p>' : '';
                html += '<div class="pub-block" style="display:flex;gap:8px;">' +
                    numHtml +
                    '<div><p style="margin-bottom:2px;"><strong><a href="' + group.url + '">' + formatText(escapeHTML(group.title)) + '</a></strong></p>' +
                    (group.authors ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:2px;">' + formatText(escapeHTML(group.authors)) + '</p>' : '') +
                    metaHtml + '</div>' +
                '</div>';
                return;
            }
            if (group.type === 'video') {
                var src = group.src;
                var yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                if (yt) src = 'https://www.youtube.com/embed/' + yt[1];
                var vm = src.match(/vimeo\.com\/(\d+)/);
                if (vm) src = 'https://player.vimeo.com/video/' + vm[1];
                var r = toCSSRatio(group.ratio) || '16/9';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(src) + '" style="width:100%;aspect-ratio:' + r + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
                return;
            }
            if (group.type === 'text') { html += '<p style="margin-bottom:1rem;">' + formatText(group.content || '') + '</p>'; return; }
            if (group.type === 'button') {
                var btnStyle = group.btn_style === 'outline' ? 'background:transparent;color:var(--text);border:1px solid var(--border);' : 'background:#000;color:#fff;border:none;';
                html += '<div style="margin-top:20px;text-align:' + (group.align || 'center') + ';"><a href="' + escapeHTML(group.url || '#') + '" target="_blank" style="display:inline-block;font-family:\'Inter\',sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;padding:12px 28px;text-decoration:none;cursor:pointer;transition:transform .2s,opacity .2s;' + btnStyle + '" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'">' + escapeHTML(group.label || 'Button') + '</a></div>';
                return;
            }
            if (group.type === 'model' || group.type === '3d') {
                var r = toCSSRatio(group.ratio) || '1/1';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                var rot = group.rotate !== false ? ' auto-rotate' : '';
                html += '<div style="margin-top:20px;"><model-viewer src="' + escapeHTML(group.src) + '" style="width:100%;aspect-ratio:' + r + ';min-height:400px;" camera-controls' + rot + ' shadow-intensity="1" loading="lazy"></model-viewer>' + cap + '</div>';
                return;
            }
            if (group.type === 'embed') {
                var r = toCSSRatio(group.ratio) || '16/9';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(group.src) + '" style="width:100%;aspect-ratio:' + r + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
                return;
            }
            if (group.image) { var obj = typeof group.image === 'string' ? { src: group.image, alt: group.image_alt || '', caption: group.caption || '', credit: group.credit || '', w: group.w || 600, h: group.h || 400, ar: group.ar === true } : group.image; html += '<div style="margin-top:16px;">' + imgCard(obj, true) + '</div>'; }
            var gl = group.gallery || {};
            if (group.embed) {
                var er = group.embed.ratio || '16/9';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(group.embed.src) + '" style="width:100%;aspect-ratio:' + er + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
            }
            var label = group.label ? '<p style="margin-top:20px;font-weight:500;">' + escapeHTML(group.label) + '</p>' : '';
            if (group.images) html += label + renderGallery(gl, group.images);
        });
    }
    return '<div class="section">' +
        '<span class="section-label"' + labelStyle(d) + '>' + escapeHTML(d.label) + '</span>' +
        html +
    '</div>';
};

renderers.research = function(data) {
    var d = data.data;
    var html = '';
    var media = '';
    var skip = { label:1, section_num:1, section_title:1, image_alt:1, caption:1, credit:1, w:1, h:1, ar:1, gallery:1, address:1, extra_line:1, text:1, email:1, texts:1, intro:1 };
    var handlers = {
        paragraphs: function() { d.paragraphs.forEach(function(p) { html += '<p>' + formatText(p) + '</p>'; }); },
        texts: function() { d.texts.forEach(function(t) { html += '<p>' + formatText(t) + '</p>'; }); },
        items: function() {
            html += '<ul>';
            d.items.forEach(function(item) {
                if (item.label !== undefined) {
                    html += '<li>' + formatText(escapeHTML(item.label)) + ': ' + formatText(escapeHTML(item.value));
                    if (item.model || item.video || item.embed || item.image || item.image_groups || item.buttons) {
                        html += sectionMedia(item);
                    }
                    html += '</li>';
                } else if (item.type === 'model') {
                    html += '<li>' + sectionMedia({ model: { src: item.src, ratio: item.ratio || '1/1' } }) + '</li>';
                } else if (item.type === 'video') {
                    html += '<li>' + sectionMedia({ video: { src: item.src, ratio: item.ratio || '16/9' } }) + '</li>';
                } else if (item.type === 'embed') {
                    html += '<li>' + sectionMedia({ embed: { src: item.src, ratio: item.ratio || '16/9' } }) + '</li>';
                } else {
                    html += '<li>' + sectionMedia(item) + '</li>';
                }
            });
            html += '</ul>';
        },
        embed: function() { html += renderEmbed(d); },
        video: function() { html += renderVideo(d); },
        model: function() { html += renderModel(d); },
        buttons: function() { html += renderButtons(d); },
        image: function() { if (d.image) { var obj = typeof d.image === 'string' ? { src: d.image, alt: d.image_alt || '', caption: d.caption || '', credit: d.credit || '', w: d.w || 600, h: d.h || 400, ar: d.ar === true } : d.image; html += '<div style="margin-top:16px;">' + imgCard(obj, true) + '</div>'; } },
        images: function() { if (d.images && d.images.length) html += renderGallery(d.gallery || {}, d.images); },
        groups: function() { groupFn(d.groups || d.image_groups); },
        image_groups: function() { groupFn(d.groups || d.image_groups); }
    };
    Object.keys(d).forEach(function(key) { if (handlers[key]) handlers[key](); });
    if (!d.groups && !d.image_groups && (d.paragraphs || d.texts || d.items || d.papers)) media = sectionMedia(d);
    function groupFn(groups) {
        if (!groups || !groups.length) return;
        groups.forEach(function(group) {
            if (group.type === 'research-item') {
                html += '<li>' + formatText(escapeHTML(group.label)) + ': ' + formatText(escapeHTML(group.value)) + '</li>';
                return;
            }
            if (group.type === 'video') {
                var src = group.src;
                var yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                if (yt) src = 'https://www.youtube.com/embed/' + yt[1];
                var vm = src.match(/vimeo\.com\/(\d+)/);
                if (vm) src = 'https://player.vimeo.com/video/' + vm[1];
                var r = toCSSRatio(group.ratio) || '16/9';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(src) + '" style="width:100%;aspect-ratio:' + r + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
                return;
            }
            if (group.type === 'text') { html += '<p style="margin-bottom:1rem;">' + formatText(group.content || '') + '</p>'; return; }
            if (group.type === 'divider') { html += '<hr style="border:none;border-top:1px solid var(--border);margin:1.5rem 0;">'; return; }
            if (group.type === 'button') {
                var btnStyle = group.btn_style === 'outline' ? 'background:transparent;color:var(--text);border:1px solid var(--border);' : 'background:#000;color:#fff;border:none;';
                html += '<div style="margin-top:20px;text-align:' + (group.align || 'center') + ';"><a href="' + escapeHTML(group.url || '#') + '" target="_blank" style="display:inline-block;font-family:\'Inter\',sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;padding:12px 28px;text-decoration:none;cursor:pointer;transition:transform .2s,opacity .2s;' + btnStyle + '" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'">' + escapeHTML(group.label || 'Button') + '</a></div>';
                return;
            }
            if (group.type === 'model' || group.type === '3d') {
                var r = toCSSRatio(group.ratio) || '1/1';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                var rot = group.rotate !== false ? ' auto-rotate' : '';
                html += '<div style="margin-top:20px;"><model-viewer src="' + escapeHTML(group.src) + '" style="width:100%;aspect-ratio:' + r + ';min-height:400px;" camera-controls' + rot + ' shadow-intensity="1" loading="lazy"></model-viewer>' + cap + '</div>';
                return;
            }
            if (group.type === 'embed') {
                var r = toCSSRatio(group.ratio) || '16/9';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(group.src) + '" style="width:100%;aspect-ratio:' + r + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
                return;
            }
            if (group.image) { var obj = typeof group.image === 'string' ? { src: group.image, alt: group.image_alt || '', caption: group.caption || '', credit: group.credit || '', w: group.w || 600, h: group.h || 400, ar: group.ar === true } : group.image; html += '<div style="margin-top:16px;">' + imgCard(obj, true) + '</div>'; }
            var gl = group.gallery || {};
            if (group.embed) {
                var er = group.embed.ratio || '16/9';
                var cap = group.caption ? '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">' + escapeHTML(group.caption) + '</p>' : '';
                html += '<div style="margin-top:20px;"><iframe src="' + escapeHTML(group.embed.src) + '" style="width:100%;aspect-ratio:' + er + ';border:0;" allowfullscreen loading="lazy"></iframe>' + cap + '</div>';
            }
            var label = group.label ? '<p style="margin-top:20px;font-weight:500;">' + escapeHTML(group.label) + '</p>' : '';
            if (group.images) html += label + renderGallery(gl, group.images);
        });
    }
    return '<div class="section">' +
        '<span class="section-label"' + labelStyle(d) + '>' + escapeHTML(d.label) + '</span>' +
        html +
        media +
    '</div>';
};
