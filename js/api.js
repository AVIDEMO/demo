function fetchJSON(path) {
    return fetch(path).then(function(resp) {
        if (!resp.ok) throw new Error('Failed to load ' + path);
        return resp.text();
    }).then(function(text) {
        return JSON.parse(text);
    });
}
