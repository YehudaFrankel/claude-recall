var firstLoad = true;
var lastSession = 0;
var REPO_BASE = 'D:/resin-2.1.17/webapps';

function openVSCode(filePath, line) {
  fetch('/api/open?file=' + encodeURIComponent(filePath) + (line ? '&line=' + line : ''))
    .catch(function() {});
}

function openWorkflow(projName) {
  var proj = null;
  for (var i = 0; i < projectData.length; i++) {
    if (projectData[i].project === projName) { proj = projectData[i]; break; }
  }
  if (!proj || !proj.flowSteps.length) { return; }
  document.getElementById('workflowTitle').textContent = projName + ' — Flow';
  document.getElementById('workflowBody').innerHTML = proj.flowSteps.map(function(s, idx) {
    var vsUri = 'vscode://file/' + REPO_BASE + '/' + s.file.replace(/\\/g, '/') + ':' + s.line;
    return '<div class="wf-step">' +
      '<span class="wf-num">' + (idx + 1) + '</span>' +
      '<div class="wf-info">' +
        '<span class="wf-name">' + s.name + '</span>' +
        '<span class="wf-note">' + (s.note || '') + '</span>' +
      '</div>' +
      '<a href="#" class="wf-open" onclick="openVSCode(\'' + REPO_BASE + '/' + s.file.replace(/\\/g,'/') + '\',' + s.line + ');return false;">open</a>' +
    '</div>';
  }).join('');
  document.getElementById('workflowPanel').style.display = '';
}

function closeWorkflow() {
  document.getElementById('workflowPanel').style.display = 'none';
}

function refresh() {
    fetch('/api/status')
        .then(function(r) { return r.json(); })
        .then(render)
        .catch(function() {});
}

function loadHistory(q) {
    fetch('/api/history' + (q ? '?q=' + encodeURIComponent(q) : ''))
        .then(function(r) { return r.json(); })
        .then(function(d) { renderHistory(d.groups); })
        .catch(function() {});
}

function renderHistory(groups) {
    var el = document.getElementById('historyGroups');
    if (!groups || groups.length === 0) {
        el.innerHTML = '<div class="history-empty">No commits found.</div>';
        return;
    }
    var html = '';
    for (var i = 0; i < groups.length; i++) {
        var g = groups[i];
        var isToday = (i === 0);
        var label = g.session === 'other' ? 'Other' : 'Session ' + g.session;
        html += '<div class="history-group">';
        html += '<div class="history-group-header" onclick="toggleGroup(this)">';
        html += '<span class="history-group-title">' + label + '</span>';
        html += '<span class="history-group-count">' + g.commits.length + '</span>';
        html += '<span class="history-group-chevron">' + (isToday ? '▾' : '▸') + '</span>';
        html += '</div>';
        html += '<div class="history-group-body"' + (isToday ? '' : ' style="display:none"') + '>';
        for (var j = 0; j < g.commits.length; j++) {
            var c = g.commits[j];
            var msg = (c.msg || c).replace(/^Session \d+:\s*/i, '');
            html += '<div class="history-commit">';
            html += '<div class="commit-msg" onclick="toggleFiles(this)">' + msg + '</div>';
            if (c.files && c.files.length > 0) {
                html += '<div class="commit-files" style="display:none">';
                for (var f = 0; f < c.files.length; f++) {
                    var file = c.files[f];
                    var fp = file.path || file;
                    if (file.added !== undefined && file.added === 0 && file.removed === 0) { continue; }
                    var fileName = fp.split('/').pop();
                    var stats = '';
                    if (file.added !== undefined && (file.added > 0 || file.removed > 0)) {
                        stats = ' <span class="file-added">+' + file.added + '</span> <span class="file-removed">-' + file.removed + '</span>';
                    }
                    html += '<div class="commit-file" onclick="showDiff(\'' + (c.hash || '') + '\',\'' + fp.replace(/\\/g, '/').replace(/'/g, "\\'") + '\',\'' + msg.replace(/'/g, "\\'") + '\')">';
                    html += '<span class="file-name">' + fileName + '</span>' + stats;
                    html += '</div>';
                }
                html += '</div>';
            }
            html += '</div>';
        }
        html += '</div></div>';
    }
    el.innerHTML = html;
}

function openChange(hash, filePath) {
    fetch('/api/openchange?hash=' + encodeURIComponent(hash) + '&file=' + encodeURIComponent(filePath))
        .catch(function() {});
}

function showDiff(hash, filePath, commitMsg) {
    fetch('/api/getdiff?hash=' + encodeURIComponent(hash) + '&file=' + encodeURIComponent(filePath))
        .then(function(r) { return r.json(); })
        .then(function(d) {
            if (d.lines.length === 0) { return; }
            var popup = document.getElementById('diffPopup');
            var body = document.getElementById('diffBody');
            document.getElementById('diffTitle').textContent = filePath.split('/').pop();
            var sourceLabel = d.source === 'production' ? 'vs Production' : 'vs Previous Commit';
            document.getElementById('diffNote').textContent = commitMsg + '  (' + sourceLabel + ')';
            document.getElementById('diffOpenBtn').onclick = function() { openChange(hash, filePath); };
            var html = '';
            for (var i = 0; i < d.lines.length; i++) {
                var line = d.lines[i];
                var cls = 'diff-ctx';
                var escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                if (line.indexOf('@@') === 0) { cls = 'diff-hunk'; }
                else if (line.indexOf('+') === 0) { cls = 'diff-add'; }
                else if (line.indexOf('-') === 0) { cls = 'diff-del'; }
                html += '<div class="' + cls + '">' + escaped + '</div>';
            }
            body.innerHTML = html;
            popup.style.display = 'flex';
        })
        .catch(function() {});
}

function closeDiff() {
    document.getElementById('diffPopup').style.display = 'none';
}

function toggleFiles(el) {
    var files = el.nextSibling;
    if (files && files.className === 'commit-files') {
        files.style.display = files.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleGroup(header) {
    var body = header.nextSibling;
    var chev = header.querySelector('.history-group-chevron');
    if (body.style.display === 'none') {
        body.style.display = '';
        chev.textContent = '▾';
    } else {
        body.style.display = 'none';
        chev.textContent = '▸';
    }
}

function render(d) {
    var sessionNum = parseInt(d.session, 10) || 0;

    if (firstLoad) {
        countUp(sessionNum);
        firstLoad = false;
    } else {
        document.getElementById('sessionBadge').textContent = 'S' + d.session;
        if (sessionNum !== lastSession) { flash('sessionBadge'); }
    }
    lastSession = sessionNum;

    document.getElementById('lastUpdated').textContent = d.time;

    var resinPill = document.getElementById('resinPill');
    var resinLabel = document.getElementById('resinLabel');
    resinPill.className = 'pill ' + (d.resin ? 'online' : 'offline');
    resinLabel.textContent = d.resin ? 'RESIN  UP' : 'RESIN  DOWN';

    var uncommittedPill = document.getElementById('uncommittedPill');
    var uncommittedLabel = document.getElementById('uncommittedLabel');
    uncommittedPill.className = 'pill ' + (d.git.clean ? 'clean' : 'dirty');
    uncommittedLabel.textContent = d.git.clean ? 'ALL  COMMITTED' : 'UNCOMMITTED';

    var pushPill = document.getElementById('pushPill');
    var pushLabel = document.getElementById('pushLabel');
    pushPill.className = 'pill ' + (d.git.pushNeeded ? 'dirty' : 'clean');
    pushLabel.textContent = d.git.pushNeeded ? 'PUSH  NEEDED' : 'ALL  PUSHED';

    var memorySyncPill = document.getElementById('memorySyncPill');
    var memorySyncLabel = document.getElementById('memorySyncLabel');
    memorySyncPill.className = 'pill ' + (d.memorySync ? 'clean' : 'dirty');
    memorySyncLabel.textContent = d.memorySync ? 'MEMORY  SYNCED' : 'MEMORY  DIRTY';

    setText('lastChange', d.lastChange);
    setText('lastCommit', d.git.lastCommit ? 'Last commit: ' + d.git.lastCommit : '');

}

function setText(id, value) {
    var el = document.getElementById(id);
    if (el.textContent !== value) {
        el.textContent = value;
        flash(id);
    }
}

function flash(id) {
    var el = document.getElementById(id);
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
}

function countUp(target) {
    var badge = document.getElementById('sessionBadge');
    badge.classList.add('counting');
    var n = Math.max(0, target - 30);
    var interval = setInterval(function() {
        n = Math.min(n + 1, target);
        badge.textContent = 'S' + n;
        if (n >= target) {
            clearInterval(interval);
            badge.classList.remove('counting');
        }
    }, 28);
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function copy(btn, text) {
    btn.classList.add('ripple');
    setTimeout(function() { btn.classList.remove('ripple'); }, 350);

    navigator.clipboard.writeText(text).then(function() {
        var msg = document.getElementById('copyMsg');
        msg.textContent = 'Copied  ' + text;
        setTimeout(function() { msg.textContent = ''; }, 2000);
    }).catch(function() {
        var msg = document.getElementById('copyMsg');
        msg.textContent = 'Copy not supported here';
        setTimeout(function() { msg.textContent = ''; }, 2000);
    });
}

function pushToGit(btn) {
    var msg = document.getElementById('copyMsg');
    btn.disabled = true;
    msg.textContent = 'Pushing...';
    fetch('/api/push', { method: 'POST' })
        .then(function(r) { return r.json(); })
        .then(function(d) {
            msg.textContent = d.ok ? '✓ ' + d.msg : '✗ ' + d.msg;
            setTimeout(function() { msg.textContent = ''; }, 4000);
        })
        .catch(function(e) { msg.textContent = '✗ ' + e.message; })
        .finally(function() { btn.disabled = false; refresh(); });
}

var DEFAULT_PROMPTS = [
    { name: 'Start',    text: 'Start Session' },
    { name: 'End',      text: 'End Session' },
    { name: 'Smoke',    text: '/smoke-test' },
    { name: 'Guard',    text: '/guard' },
    { name: 'Learn',    text: '/learn' },
    { name: 'Mem Push', text: 'Push Memory' },
    { name: 'Git Push', text: 'git push' }
];

function persistPrompts(prompts, cb) {
    fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompts)
    }).then(function() { if (cb) { cb(); } }).catch(function() { if (cb) { cb(); } });
}

function loadAndRenderPrompts() {
    fetch('/api/prompts')
        .then(function(r) { return r.json(); })
        .then(function(prompts) {
            if (!Array.isArray(prompts) || prompts.length === 0) {
                prompts = DEFAULT_PROMPTS.slice();
                persistPrompts(prompts);
            }
            renderSavedPrompts(prompts);
        })
        .catch(function() { renderSavedPrompts(DEFAULT_PROMPTS.slice()); });
}

function renderSavedPrompts(prompts) {
    var area = document.getElementById('savedPromptsArea');
    var html = '';
    for (var i = 0; i < prompts.length; i++) {
        html += '<div class="prompt-wrap">';
        html += '<button type="button" class="btn" data-text="' + escAttr(prompts[i].text) + '" onclick="copyPrompt(this)">' + escHtml(prompts[i].name) + '</button>';
        html += '<button type="button" class="btn-del" onclick="deletePrompt(' + i + ')" title="Delete">&#215;</button>';
        html += '</div>';
    }
    area.innerHTML = html;
}

function copyPrompt(btn) {
    copy(btn, btn.getAttribute('data-text'));
}

function pillClick(type) {
    var pill, text;
    if (type === 'uncommitted') {
        pill = document.getElementById('uncommittedPill');
        if (!pill.classList.contains('dirty')) { return; }
        text = 'commit my changes';
    } else if (type === 'push') {
        pill = document.getElementById('pushPill');
        if (!pill.classList.contains('dirty')) { return; }
        text = 'push to github';
    } else if (type === 'memory') {
        pill = document.getElementById('memorySyncPill');
        if (!pill.classList.contains('dirty')) { return; }
        text = 'push memory';
    }
    navigator.clipboard.writeText(text).then(function() {
        var msg = document.getElementById('copyMsg');
        msg.textContent = 'Copied  ' + text;
        setTimeout(function() { msg.textContent = ''; }, 2000);
    });
}

function escAttr(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function deletePrompt(index) {
    fetch('/api/prompts')
        .then(function(r) { return r.json(); })
        .then(function(prompts) {
            prompts.splice(index, 1);
            persistPrompts(prompts, loadAndRenderPrompts);
        }).catch(function() {});
}

function focusQuickPrompt() {
    var el = document.getElementById('qpTarget');
    if (el) { el.focus(); }
}

function sendQuickPrompt() {
    var target = document.getElementById('qpTarget').value.trim();
    var action = document.getElementById('qpAction').value.trim();
    var saveName = document.getElementById('qpSaveName').value.trim();
    var btn = document.querySelector('.btn-send');
    if (!target && !action) { return; }
    var text;
    if (target && action) {
        text = 'Working on: ' + target + '\nTask: ' + action + '\n\nContext: InfoGrasp — Java/Resin 2.1.17, SQL Server. Check existing patterns before proposing. Full plan required before any edit.';
    } else {
        text = target ? target : action;
    }
    copy(btn, text);
    if (saveName) {
        fetch('/api/prompts')
            .then(function(r) { return r.json(); })
            .then(function(prompts) {
                if (!Array.isArray(prompts)) { prompts = []; }
                prompts.push({ name: saveName, text: text });
                persistPrompts(prompts, loadAndRenderPrompts);
            }).catch(function() {});
        document.getElementById('qpSaveName').value = '';
    }
    document.getElementById('qpTarget').value = '';
    document.getElementById('qpAction').value = '';
}

// ── Skill Health ────────────────────────────────────────────
function loadSkillHealth() {
    fetch('/api/skillhealth')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var el = document.getElementById('skillDots');
            if (!el) { return; }
            if (!data.skills || !data.skills.length) { el.innerHTML = '<span style="color:#555;font-size:0.72rem;">No data yet</span>'; return; }
            var colors = { urgent: '#ff4444', watch: '#ffaa00', stable: '#00cc66' };
            el.innerHTML = data.skills.map(function(s) {
                return '<span title="' + s.name + ': ' + s.unpatchedY + ' open, ' + s.n + ' clean" ' +
                    'style="display:inline-block;width:10px;height:10px;border-radius:50%;' +
                    'background:' + (colors[s.status] || '#555') + ';margin:3px 3px 3px 0;cursor:default;"></span>';
            }).join('');
        }).catch(function() {});
}

// ── Token Usage ──────────────────────────────────────────────
function loadCostLog() {
    fetch('/api/costlog')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var el = document.getElementById('costRows');
            if (!el) { return; }
            if (!data.rows || !data.rows.length) { el.innerHTML = '<span style="color:#555;font-size:0.72rem;">No cost_log.md yet</span>'; return; }
            el.innerHTML = '<table style="width:100%;font-size:0.72rem;border-collapse:collapse;">' +
                data.rows.map(function(r) {
                    return '<tr><td style="color:#888;padding:2px 8px 2px 0;white-space:nowrap;">' + (r.session || r.date) + '</td>' +
                        '<td style="color:#c5985e;padding:2px 8px 2px 0;">' + (r.tokens || '—') + '</td>' +
                        '<td style="color:#555;">' + (r.context || '') + '</td></tr>';
                }).join('') + '</table>';
        }).catch(function() {});
}

// ── Project Map ──────────────────────────────────────────────
var projectData = [];

function togglePM(id) {
    var el = document.getElementById(id);
    var chev = document.getElementById('chev_' + id);
    if (!el) { return; }
    var hidden = el.style.display === 'none';
    el.style.display = hidden ? '' : 'none';
    if (chev) { chev.textContent = hidden ? '▾' : '▸'; }
}

function renderProjectMap(projects, filter) {
    var el = document.getElementById('fileTree');
    if (!el) { return; }
    var q = (filter || '').toLowerCase();
    var html = '';
    projects.forEach(function(proj) {
        var matchSteps = proj.flowSteps.filter(function(s) { return !q || s.name.toLowerCase().indexOf(q) !== -1 || (s.note || '').toLowerCase().indexOf(q) !== -1; });
        var matchFiles = proj.files.filter(function(f) {
            return !q || f.label.toLowerCase().indexOf(q) !== -1 || f.methods.some(function(m) { return m.name.toLowerCase().indexOf(q) !== -1; });
        });
        if (q && !matchSteps.length && !matchFiles.length) { return; }
        var pid = 'proj_' + proj.project.replace(/\s/g, '_');
        html += '<div class="pm-project">';
        html += '<div class="pm-proj-header" onclick="togglePM(\'' + pid + '\')">' +
            '<span>' + proj.icon + ' ' + proj.project + '</span>' +
            '<span class="pm-chevron" id="chev_' + pid + '">▸</span></div>';
        html += '<div class="pm-proj-body" id="' + pid + '" style="display:none;">';

        // Flow steps — key functions highlighted
        if (matchSteps.length) {
            html += '<div style="padding:4px 6px 2px;font-size:0.63rem;color:#555;text-transform:uppercase;letter-spacing:0.06em;">Key Flow</div>';
            matchSteps.forEach(function(s) {
                html += '<a href="#" class="pm-flow-step" onclick="openWorkflow(\'' + proj.project.replace(/'/g,"\\'") + '\');return false;" title="' + (s.note || '') + '">' +
                    '<span class="pm-flow-name">' + s.name + '</span>' +
                    '<span class="pm-flow-note">' + (s.note || '') + '</span>' +
                    '</a>';
            });
        }

        // All files from index
        if (matchFiles.length) {
            html += '<div style="padding:4px 6px 2px;font-size:0.63rem;color:#555;text-transform:uppercase;letter-spacing:0.06em;margin-top:4px;">All Files</div>';
            matchFiles.forEach(function(f) {
                var fid = 'file_' + f.label.replace(/[^a-z0-9]/gi, '_');
                var vsFile = 'vscode://file/' + f.path;
                var filteredMethods = q ? f.methods.filter(function(m) { return m.name.toLowerCase().indexOf(q) !== -1 || f.label.toLowerCase().indexOf(q) !== -1; }) : f.methods;
                html += '<div class="pm-file">';
                html += '<div class="pm-file-header" onclick="togglePM(\'' + fid + '\')">' +
                    '<a href="#" class="pm-file-link" onclick="event.stopPropagation();openVSCode(\'' + f.path + '\');return false;">' + f.label + '</a>' +
                    (filteredMethods.length ? '<span class="pm-chevron" id="chev_' + fid + '">▸</span>' : '') +
                    '</div>';
                if (filteredMethods.length) {
                    html += '<div class="pm-methods" id="' + fid + '" style="display:none;">';
                    filteredMethods.forEach(function(m) {
                        html += '<a href="#" class="pm-method" onclick="openVSCode(\'' + f.path + '\',' + m.line + ');return false;">' +
                            m.name + '<span class="pm-line">:' + m.line + '</span></a>';
                    });
                    html += '</div>';
                }
                html += '</div>';
            });
        }
        html += '</div></div>';
    });
    el.innerHTML = html || '<span style="color:#555;font-size:0.72rem;">No matches</span>';
}

function loadFileTree() {
    fetch('/api/projectmap')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            projectData = data.projects || [];
            renderProjectMap(projectData, '');
            var search = document.getElementById('treeSearch');
            if (search) {
                search.addEventListener('input', function() { renderProjectMap(projectData, search.value); });
            }
        }).catch(function() {});
}

loadAndRenderPrompts();
loadSkillHealth();
loadCostLog();
loadFileTree();
loadHistory('');
document.getElementById('historySearch').addEventListener('input', function() {
    loadHistory(this.value.trim());
});
// Session diff — create deploy folder with only changed files
function runSessionDiff(btn) {
    btn.disabled = true;
    btn.textContent = 'Building...';
    var output = document.getElementById('diffOutput');
    output.style.display = 'none';
    fetch('/api/session-diff', { method: 'POST' })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            btn.disabled = false;
            btn.textContent = 'Session Diff';
            output.textContent = data.msg || 'Done';
            output.style.display = 'block';
            output.style.color = data.ok ? '#4ade80' : '#f87171';
        })
        .catch(function(e) {
            btn.disabled = false;
            btn.textContent = 'Session Diff';
            output.textContent = 'Error: ' + e.message;
            output.style.display = 'block';
            output.style.color = '#f87171';
        });
}

setInterval(refresh, 10000);
refresh();
