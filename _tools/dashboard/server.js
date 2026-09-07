var http = require('http');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').execSync;

function readBody(req, cb) {
    var body = '';
    req.on('data', function(d) { body += d; });
    req.on('end', function() { try { cb(JSON.parse(body)); } catch(e) { cb({}); } });
}

var REPO = path.resolve(__dirname, '..', '..').replace(/\\/g, '/');
var projectFolder = REPO.replace(/\//g, '-').replace(/:/g, '-').replace(/\./g, '-');
var MEM = require('os').homedir().replace(/\\/g, '/') + '/.claude/projects/' + projectFolder + '/memory/';
var MEM_REPO = path.dirname(MEM.replace(/\/$/, ''));
var PORT = 3030;
var PUBLIC = path.join(__dirname, 'public');

function readSafe(file) {
    try { return fs.readFileSync(file, 'utf8'); } catch (e) { return ''; }
}

function parseStatus() {
    var content = readSafe(MEM + 'STATUS.md');
    // Find highest session number from any format (complete, auto-logged, etc)
    var allSessions = content.match(/Session (\d+)/g) || [];
    var highest = 0;
    for (var i = 0; i < allSessions.length; i++) {
        var num = parseInt(allSessions[i].replace('Session ', ''), 10);
        if (num > highest) { highest = num; }
    }
    var session = highest > 0 ? String(highest) : '?';
    var sessionClosed = content.indexOf('Session ' + session + ' complete') !== -1;
    // Last change from most recent completed session in STATUS.md
    var lastChange = 'No recent data';
    var changeMatch = content.match(/Session (\d+) complete\.\*\* (.+)/);
    if (changeMatch) {
        var changeText = changeMatch[2]
            .replace(/\*\*/g, '')
            .replace(/`/g, '')
            .replace(/\[.*?\]\(.*?\)/g, '');
        if (changeText.length > 200) {
            changeText = changeText.substring(0, 200) + '...';
        }
        lastChange = 'Session ' + changeMatch[1] + ': ' + changeText;
    }
    return { session: session, lastChange: lastChange, sessionClosed: sessionClosed };
}

function parseDeferred() {
    var content = readSafe(MEM + 'todo.md');
    var items = [];
    var inPending = false;
    var lines = content.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.indexOf('## Pending') === 0) { inPending = true; continue; }
        if (inPending && line.indexOf('## ') === 0) { inPending = false; }
        if (inPending && line.indexOf('### ') === 0) {
            var title = line.replace('### ', '').trim();
            // Skip DONE items (strikethrough ~~text~~) and completed items
            if (title.indexOf('~~') === 0) { continue; }
            if (title.toLowerCase().indexOf('done') !== -1 && title.indexOf('~~') !== -1) { continue; }
            items.push(title);
        }
    }
    // Return top 3 most actionable — put NOT WORKING first
    items.sort(function(a, b) {
        var aUrgent = a.indexOf('NOT WORKING') !== -1 ? 0 : 1;
        var bUrgent = b.indexOf('NOT WORKING') !== -1 ? 0 : 1;
        return aUrgent - bUrgent;
    });
    return items.slice(0, 3);
}

function getGit() {
    try {
        var branch = exec('git -C "' + REPO + '" branch --show-current', { encoding: 'utf8' }).trim();
        var dirty = exec('git -C "' + REPO + '" status --short', { encoding: 'utf8' }).trim();
        var commit = exec('git -C "' + REPO + '" log -1 --pretty=%s', { encoding: 'utf8' }).trim();
        var unpushed = exec('git -C "' + REPO + '" log origin/main..HEAD --oneline', { encoding: 'utf8' }).trim();
        if (commit.length > 65) { commit = commit.substring(0, 65) + '...'; }
        return { branch: branch || 'main', clean: dirty === '', lastCommit: commit, pushNeeded: unpushed !== '' };
    } catch (e) {
        return { branch: 'unknown', clean: true, lastCommit: '', pushNeeded: false };
    }
}

function getMemorySync() {
    try {
        var dirty = exec('git -C "' + MEM_REPO + '" status --short', { encoding: 'utf8' }).trim();
        var unpushed = exec('git -C "' + MEM_REPO + '" log origin/main..HEAD --oneline', { encoding: 'utf8' }).trim();
        return dirty === '' && unpushed === '';
    } catch(e) {
        return true;
    }
}

function checkResin(cb) {
    var done = false;
    var req = http.get('http://localhost:8010/apps/webservice.jsp', function(res) {
        if (!done) { done = true; cb(true); }
        res.resume();
    });
    req.on('error', function() { if (!done) { done = true; cb(false); } });
    req.setTimeout(1800, function() { req.destroy(); if (!done) { done = true; cb(false); } });
}

var MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };

// ── Flow detection ──────────────────────────────────────────────────────────
var FLOWS = {
    tictacwisdom: {
        label: 'TicTacWisdom',
        steps: [
            { name: 'courseEnroll',           file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 3503, note: 'User signs up + optional card payment on landing page' },
            { name: 'courseSignup',           file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 3450, note: 'Save enrollment, send welcome email' },
            { name: 'courseGetCatalog',       file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 5200, note: 'Load all available courses for the catalog page' },
            { name: 'courseRequestLogin',     file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 5663, note: 'Send magic login link from the landing page' },
            { name: 'courseFeed',             file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 5550, note: 'Load user\'s full course history and progress' },
            { name: 'courseMarkSessionView',  file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 6679, note: 'Record that user read or listened to a session' },
            { name: 'sendActiveCourseEmails', file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 3831, note: 'Daily job — decide what email each user gets today' },
            { name: 'courseMarkComplete',     file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 5712, note: 'User marks session done (enforces 1-day wait rule)' },
            { name: 'coursePayNow',           file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 3615, note: 'User pays $10 after finishing (pay-at-end flow)' },
            { name: 'adminSendIntroEmail',    file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 7927, note: 'Admin sends invite email with pre-filled signup link' },
            { name: 'adminGetUsers',          file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 6963, note: 'Admin views all enrolled users and their progress' },
            { name: 'adminSendSession',       file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 7100, note: 'Admin manually sends a session to a specific user' },
            { name: 'adminSaveDoc',           file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 7400, note: 'Admin uploads course document and parses all sessions' },
            { name: 'adminRemoveUser',        file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpChallengeUtils.java', line: 6760, note: 'Admin deletes a user\'s enrollment and all their data' }
        ]
    },
    makeapayment: {
        label: 'MakeaPayment / Pledge',
        steps: [
            { name: 'appSendLoginEmail',               file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebservice.java', line: 1, note: 'Send magic login link to family email' },
            { name: 'AutoLogin.html',                  file: 'mobile/AutoLogin.html', line: 1, note: 'Magic link lands here — creates session, redirects to pay page' },
            { name: 'pyrBuildFullUI',                  file: 'mobile/js/MakeaPayment.js', line: 903, note: 'Draw the full payment page after login' },
            { name: 'appGetHouseholdPaymentMethods',   file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebservice.java', line: 1, note: 'Load saved cards and bank accounts for family' },
            { name: 'appAddPaymentCard',               file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebservice.java', line: 1, note: 'Save a new credit card for the family' },
            { name: 'appAddBankAccount',               file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebservice.java', line: 1, note: 'Save a new bank account for the family' },
            { name: 'appSubmitHouseholdPledge',        file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebservice.java', line: 1, note: 'Create a pledge or charge for the family' },
            { name: 'doPayNow',                        file: 'mobile/js/MakeaPayment.js', line: 1533, note: 'User clicks Pay — collect selected charges and charge card' },
            { name: 'appPayNow',                       file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebservice.java', line: 2723, note: 'Server receives payment, runs gateway, records result' },
            { name: 'pyrLivePledgeUpdate',             file: 'mobile/js/MakeaPayment.js', line: 1195, note: 'As user types pledge amount, create or update charge in real time' }
        ]
    },
    households: {
        label: 'Households / Billing',
        steps: [
            { name: 'appGetHouseholds',              file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebservice.java', line: 1, note: 'Load list of families with balance and status' },
            { name: 'checkIfHouseholdExists',        file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpHouseholds.java', line: 1, note: 'Check for duplicate families before creating' },
            { name: 'addHousehold',                  file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpHouseholdUtils.java', line: 1, note: 'Create a new family record' },
            { name: 'appGetHouseholdCharges',        file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebservice.java', line: 1, note: 'Load what a family owes' },
            { name: 'specDetailGeneratePaymentLink', file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpHouseholds.java', line: 70, note: 'Create a one-click pay link and email it to the family' },
            { name: 'updateChargeTotals',            file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpUtils.java', line: 1, note: 'Recalculate what a family owes after a payment' },
            { name: 'createPaymentAndProcessCreditCard', file: 'apps/WEB-INF/classes/com/mfimp/jobs/nfpUtilsPayments.java', line: 1623, note: 'Run the card through the payment gateway and record result' }
        ]
    },
    keepalivenow: {
        label: 'KeepAliveNow',
        steps: [
            { name: 'appKANGoogleSignIn',    file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebKAN.java', line: 1, note: 'Member signs in with Google' },
            { name: 'appKANGetCommunity',    file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebKAN.java', line: 1, note: 'Load community settings and member info' },
            { name: 'appKANSendMagicLink',   file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebKAN.java', line: 1, note: 'Send login link by email — no password needed' },
            { name: 'appKANGetMembers',      file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebKAN.java', line: 1, note: 'Load all members of the community' },
            { name: 'appKANGetDiscussions',  file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebKAN.java', line: 1, note: 'Load the community feed posts' },
            { name: 'appKANPostDiscussion',  file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebKAN.java', line: 1, note: 'Member posts something to the feed' },
            { name: 'appKANCreateEvent',     file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebKAN.java', line: 1, note: 'Organizer creates a community event' },
            { name: 'appKANEventRSVP',       file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebKAN.java', line: 1, note: 'Member RSVPs to an event' },
            { name: 'appKANToggleReaction',  file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebKAN.java', line: 1, note: 'Member likes or reacts to a post' },
            { name: 'appKANGetDues',         file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebKAN.java', line: 1, note: 'Load dues owed by each member' },
            { name: 'appKANBuildNewsletter', file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebKAN.java', line: 1, note: 'Auto-generate a community newsletter from recent activity' }
        ]
    },
    infograspcore: {
        label: 'InfoGrasp Core',
        steps: [
            { name: 'executeService',    file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebservice.java', line: 128, note: 'Every API request enters here — routes to the right function' },
            { name: 'isAdminSession',    file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebservice.java', line: 1, note: 'Check if the request has a valid admin login' },
            { name: 'wrapResponse',      file: 'apps/WEB-INF/classes/com/mfimp/utils/HFmtWebservice.java', line: 1, note: 'Wrap every API response with CORS headers and session logging' },
            { name: 'executeSql',        file: 'apps/WEB-INF/classes/com/mfimp/utils/USql.java', line: 1, note: 'Run a database write — INSERT, UPDATE or DELETE' },
            { name: 'getSingleRow',      file: 'apps/WEB-INF/classes/com/mfimp/utils/UTable.java', line: 1, note: 'Load one record from the database' },
            { name: 'getMultipleRows',   file: 'apps/WEB-INF/classes/com/mfimp/utils/UTable.java', line: 1, note: 'Load a list of records from the database' },
            { name: 'addRow',            file: 'apps/WEB-INF/classes/com/mfimp/utils/UTable.java', line: 1, note: 'Insert a record using the ORM (non-IDENTITY tables only)' },
            { name: 'easeyEncrypt',      file: 'apps/WEB-INF/classes/com/mfimp/utils/USql.java', line: 2073, note: 'Encode a string as Base64 for URL params' },
            { name: 'getEmailOpenedID',  file: 'apps/WEB-INF/classes/com/mfimp/utils/USql.java', line: 1, note: 'Generate a unique tracking ID for email open pixel' },
            { name: 'sendMail',          file: 'apps/WEB-INF/classes/com/mfimp/utils/UMail.java', line: 1, note: 'Send an email via SMTP' }
        ]
    }
};

function detectFlow(lastChange) {
    var lc = (lastChange || '').toLowerCase();
    if (lc.indexOf('makeapayment') !== -1 || lc.indexOf('pledge') !== -1 || lc.indexOf('payment') !== -1) { return 'makeapayment'; }
    if (lc.indexOf('tictacwisdom') !== -1 || lc.indexOf('ttw') !== -1 || lc.indexOf('course') !== -1) { return 'tictacwisdom'; }
    if (lc.indexOf('household') !== -1 || lc.indexOf('billing') !== -1 || lc.indexOf('charge') !== -1) { return 'households'; }
    if (lc.indexOf('keepalivenow') !== -1 || lc.indexOf('kan') !== -1) { return 'keepalivenow'; }
    return 'makeapayment'; // default
}

function parseCodeMap() {
    var status = parseStatus();
    var flowKey = detectFlow(status.lastChange);
    var flow = FLOWS[flowKey];
    var result = { flowLabel: flow.label, flowKey: flowKey, steps: flow.steps, java: [], js: [] };
    try {
        var javaIdx = fs.readFileSync(MEM + 'java_function_index.md', 'utf8');
        var currentFile = '';
        javaIdx.split('\n').forEach(function(line) {
            var fileMatch = line.match(/^Path:\s*(.+)/);
            if (fileMatch) { currentFile = fileMatch[1].trim(); return; }
            var rowMatch = line.match(/^\|\s*([^\|]+?)\s*\|\s*(\d+)\s*\|/);
            if (rowMatch && rowMatch[1] !== 'Method') {
                result.java.push({ name: rowMatch[1].trim(), file: currentFile, line: parseInt(rowMatch[2]) });
            }
        });
    } catch(e) {}
    try {
        var jsIdx = fs.readFileSync(MEM + 'js_function_index.md', 'utf8');
        var currentJsFile = '';
        jsIdx.split('\n').forEach(function(line) {
            var fileMatch = line.match(/^Path:\s*(.+)/);
            if (fileMatch) { currentJsFile = fileMatch[1].trim(); return; }
            var rowMatch = line.match(/^\|\s*([^\|]+?)\s*\|\s*(\d+)\s*\|/);
            if (rowMatch && rowMatch[1] !== 'Method') {
                result.js.push({ name: rowMatch[1].trim(), file: currentJsFile, line: parseInt(rowMatch[2]) });
            }
        });
    } catch(e) {}
    return result;
}

var server = http.createServer(function(req, res) {
    // Session diff — create backup folder with only changed files
    if (req.url === '/api/session-diff' && req.method === 'POST') {
        try {
            var scriptPath = path.join(REPO, 'tools', 'session-diff.ps1');
            var out = exec('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + scriptPath + '"', { encoding: 'utf8', timeout: 30000 }).trim();
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: true, msg: out }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: false, msg: e.stdout ? e.stdout.toString() : e.message }));
        }
        return;
    }

    if (req.url === '/api/push' && req.method === 'POST') {
        try {
            var out = exec('git -C "' + REPO + '" push 2>&1', { encoding: 'utf8' }).trim();
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: true, msg: out || 'Pushed.' }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: false, msg: e.message || 'Push failed.' }));
        }
        return;
    }

    var PROMPTS_FILE = path.join(__dirname, 'prompts.json');

    if (req.url === '/api/prompts' && req.method === 'GET') {
        try {
            var pdata = fs.readFileSync(PROMPTS_FILE, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(pdata);
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end('[]');
        }
        return;
    }

    if (req.url === '/api/prompts' && req.method === 'POST') {
        readBody(req, function(body) {
            var prompts = Array.isArray(body) ? body : [];
            fs.writeFileSync(PROMPTS_FILE, JSON.stringify(prompts, null, 2));
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: true }));
        });
        return;
    }

    if (req.url === '/api/codemap') {
        var data = parseCodeMap();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(data));
        return;
    }

    if (req.url === '/api/projectmap') {
        var FLOW_PROJECT = { makeapayment: 'MakeaPayment', tictacwisdom: 'TicTacWisdom', households: 'Households', keepalivenow: 'KeepAliveNow', infograspcore: 'InfoGrasp Core' };
        var PROJ_ICONS  = { TicTacWisdom: '📖', MakeaPayment: '💳', KeepAliveNow: '🕊', Households: '🏠', 'InfoGrasp Core': '⚙' };

        function getProjectForFile(filePath) {
            var f = filePath.replace(/\\/g, '/').toLowerCase();
            if (f.indexOf('tictacwisdom') !== -1 || f.indexOf('nfpchallenge') !== -1 || f.indexOf('hfmtwebttw') !== -1) { return 'TicTacWisdom'; }
            if (f.indexOf('makeapayment') !== -1 || f.indexOf('nfponline') !== -1 || f.indexOf('nfputilspayment') !== -1 || f.indexOf('getloginemail') !== -1 || f.indexOf('selecthousehold') !== -1 || f.indexOf('autologin') !== -1 || f.indexOf('sendmoney') !== -1) { return 'MakeaPayment'; }
            if (f.indexOf('keepalivenow') !== -1 || f.indexOf('hfmtwebkan') !== -1 || f.indexOf('nfpkeepalive') !== -1) { return 'KeepAliveNow'; }
            if (f.indexOf('household') !== -1 || f.indexOf('nfphousehold') !== -1) { return 'Households'; }
            return 'InfoGrasp Core';
        }

        try {
            var cm = parseCodeMap();
            var allMethods = cm.java.concat(cm.js);
            var projects = {};

            // Seed from FLOWS — key steps with notes
            Object.keys(FLOWS).forEach(function(key) {
                var projName = FLOW_PROJECT[key] || key;
                if (!projects[projName]) { projects[projName] = { flowSteps: [], files: {} }; }
                FLOWS[key].steps.forEach(function(step) {
                    projects[projName].flowSteps.push({ name: step.name, file: step.file, line: step.line, note: step.note });
                });
            });

            // Add ALL index methods grouped by project + file
            allMethods.forEach(function(m) {
                var proj = getProjectForFile(m.file);
                if (!projects[proj]) { projects[proj] = { flowSteps: [], files: {} }; }
                var fname = m.file.replace(/.*[\/\\]/, '');
                if (!projects[proj].files[fname]) { projects[proj].files[fname] = { path: m.file.replace(/\\/g, '/'), methods: [] }; }
                projects[proj].files[fname].methods.push({ name: m.name, line: m.line });
            });

            // Convert to array
            var result = Object.keys(projects).map(function(projName) {
                var p = projects[projName];
                return {
                    project: projName,
                    icon: PROJ_ICONS[projName] || '📁',
                    flowSteps: p.flowSteps,
                    files: Object.keys(p.files).map(function(fname) {
                        return { label: fname, path: p.files[fname].path, methods: p.files[fname].methods };
                    }).sort(function(a, b) { return a.label.localeCompare(b.label); })
                };
            });

            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ projects: result }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ projects: [], error: e.message }));
        }
        return;
    }

    if (req.url.indexOf('/api/createpackage') === 0) {
        var prodFolder = '';
        try { prodFolder = fs.readFileSync(REPO + '/_prod_path.txt', 'utf8').trim(); } catch(e) {}
        var backupsPath = '';
        try { backupsPath = fs.readFileSync(REPO + '/_backups_path.txt', 'utf8').trim(); } catch(e) {}
        if (!prodFolder || !backupsPath) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: false, msg: 'Missing _prod_path.txt or _backups_path.txt' }));
            return;
        }
        var now = new Date();
        var yy = now.getFullYear();
        var mm = String(now.getMonth() + 1).padStart(2, '0');
        var dd = String(now.getDate()).padStart(2, '0');
        var pkgName = 'ig' + yy + mm + dd + 'y';
        var pkgPath = backupsPath.replace(/\//g, '\\') + '\\' + pkgName;
        var exts = ['.java', '.js', '.html', '.css', '.jsp', '.sql', '.xml', '.json'];
        var skipDirs = ['files', 'node_modules', '.git', '.claude', '_tools', 'work'];
        var authorName = '';
        try { authorName = exec('git -C "' + REPO + '" config user.name', { encoding: 'utf8' }).trim(); } catch(e) {}
        var committedFiles = {};
        try {
            var gitLog = exec('git -C "' + REPO + '" log origin/main --format=COMMIT:%s --name-only -500', { encoding: 'utf8' }).trim();
            var gitBlocks = gitLog.split('COMMIT:').filter(function(s) { return s.trim(); });
            for (var gb = 0; gb < gitBlocks.length; gb++) {
                var gitLines = gitBlocks[gb].split('\n').filter(function(s) { return s.trim(); });
                var subj = gitLines[0];
                if (!subj.match(/^Session \d+/i)) { continue; }
                for (var gl = 1; gl < gitLines.length; gl++) {
                    var gf = gitLines[gl].trim();
                    if (gf) { committedFiles[gf] = true; }
                }
            }
        } catch(e) {}
        try { exec('curl -s -o nul "http://localhost:8010/apps/webservice.jsp?func=ping" --max-time 5', { encoding: 'utf8' }); } catch(e) {}
        var copyDirs = ['apps', 'mobile', 'mfimp'];
        for (var cdi = 0; cdi < copyDirs.length; cdi++) {
            var srcDir = (REPO + '/' + copyDirs[cdi]).replace(/\//g, '\\');
            var destDir = pkgPath + '\\' + copyDirs[cdi];
            try { exec('xcopy "' + srcDir + '" "' + destDir + '\\" /E /I /Q /Y', { encoding: 'utf8', timeout: 60000 }); } catch(e) {}
        }
        var copiedCount = 0;
        try { var countOut = exec('cmd /c "dir /S /B "' + pkgPath + '" 2>nul | find /C /V """', { encoding: 'utf8' }); copiedCount = parseInt(countOut.trim()) || 0; } catch(e) {}
        var changedFiles = [];
        var checkExts = ['.java', '.html', '.css', '.js'];
        var fileKeys = Object.keys(committedFiles);
        for (var fi = 0; fi < fileKeys.length; fi++) {
            var relFile = fileKeys[fi];
            var ext = path.extname(relFile).toLowerCase();
            if (checkExts.indexOf(ext) < 0) { continue; }
            var allowed = false;
            for (var ai = 0; ai < copyDirs.length; ai++) { if (relFile.indexOf(copyDirs[ai] + '/') === 0) { allowed = true; break; } }
            if (!allowed) { continue; }
            var prodFile = (prodFolder + '/' + relFile).replace(/\//g, '\\');
            var repoFile = (REPO + '/' + relFile).replace(/\//g, '\\');
            if (!fs.existsSync(prodFile) || !fs.existsSync(repoFile)) { continue; }
            var added = 0; var removed = 0;
            try {
                var numOut = exec('git diff --no-index --numstat "' + prodFile.replace(/\\/g, '/') + '" "' + repoFile.replace(/\\/g, '/') + '"', { encoding: 'utf8' });
                var numParts = numOut.trim().split('\t');
                added = parseInt(numParts[0]) || 0;
                removed = parseInt(numParts[1]) || 0;
            } catch(de) {
                if (de.stdout) { var numParts = de.stdout.toString().trim().split('\t'); added = parseInt(numParts[0]) || 0; removed = parseInt(numParts[1]) || 0; }
            }
            if (added > 0 || removed > 0) { changedFiles.push(relFile); }
        }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true, packagePath: pkgPath, packageName: pkgName, totalFiles: copiedCount, changedFiles: changedFiles, changedCount: changedFiles.length }));
        return;
    }

    if (req.url === '/api/proddiff' || req.url.indexOf('/api/proddiff?') === 0) {
        var prodFolder = '';
        try { prodFolder = fs.readFileSync(REPO + '/_prod_path.txt', 'utf8').trim(); } catch(e) {}
        if (!prodFolder || !fs.existsSync(prodFolder.replace(/\//g, '\\'))) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: 'Production folder not found. Set path in _prod_path.txt', files: [] }));
            return;
        }
        var exts = ['.java', '.js', '.html', '.css', '.jsp', '.sql', '.xml', '.json'];
        var skipDirs = ['files', 'node_modules', '.git', '.claude', '_tools', '_mem_path.txt', 'work'];
        var committedFiles = {};
        try {
            var gitFiles = exec('git -C "' + REPO + '" log origin/main --author="' + exec('git -C "' + REPO + '" config user.name', { encoding: 'utf8' }).trim() + '" --name-only --format="" -500', { encoding: 'utf8' }).trim();
            var gfLines = gitFiles.split('\n');
            for (var gi = 0; gi < gfLines.length; gi++) {
                var gf = gfLines[gi].trim();
                if (gf) { committedFiles[gf] = true; }
            }
        } catch(e) {}
        var results = [];
        var fileKeys = Object.keys(committedFiles);
        for (var fi = 0; fi < fileKeys.length; fi++) {
            var relFile = fileKeys[fi];
            var ext = path.extname(relFile).toLowerCase();
            if (exts.indexOf(ext) < 0) { continue; }
            var prodFile = (prodFolder + '/' + relFile).replace(/\//g, '\\');
            var repoFile = (REPO + '/' + relFile).replace(/\//g, '\\');
            if (!fs.existsSync(prodFile) || !fs.existsSync(repoFile)) { continue; }
            try {
                var repoContent = fs.readFileSync(repoFile, 'utf8');
                var prodContent = fs.readFileSync(prodFile, 'utf8');
                if (repoContent !== prodContent) {
                    var added = 0; var removed = 0;
                    try {
                        var diffOut = exec('git diff --no-index --numstat "' + prodFile.replace(/\\/g, '/') + '" "' + repoFile.replace(/\\/g, '/') + '"', { encoding: 'utf8' });
                        var parts = diffOut.trim().split('\t');
                        added = parseInt(parts[0]) || 0;
                        removed = parseInt(parts[1]) || 0;
                    } catch(de) {
                        if (de.stdout) { var parts = de.stdout.toString().trim().split('\t'); added = parseInt(parts[0]) || 0; removed = parseInt(parts[1]) || 0; }
                    }
                    if (added > 0 || removed > 0) {
                        results.push({ path: relFile, status: 'modified', added: added, removed: removed });
                    }
                }
            } catch(e) {}
        }
        results.sort(function(a, b) {
            var extA = path.extname(a.path).toLowerCase();
            var extB = path.extname(b.path).toLowerCase();
            if (extA !== extB) { return extA < extB ? -1 : 1; }
            return a.path < b.path ? -1 : 1;
        });
        var commitMap = {};
        var fileSessionMap = {};
        try {
            var logOut = exec('git -C "' + REPO + '" log origin/main --format=COMMIT:%s --name-only -500', { encoding: 'utf8' }).trim();
            var logBlocks = logOut.split('COMMIT:').filter(function(s) { return s.trim(); });
            for (var lb = 0; lb < logBlocks.length; lb++) {
                var logLines = logBlocks[lb].split('\n').filter(function(s) { return s.trim(); });
                var commitMsg = logLines[0];
                var sm = commitMsg.match(/^Session (\d+)/i);
                var sessionKey = sm ? sm[1] : 'other';
                for (var lf = 1; lf < logLines.length; lf++) {
                    var fp = logLines[lf].trim();
                    if (!commitMap[fp]) { commitMap[fp] = []; }
                    if (commitMap[fp].indexOf(commitMsg) < 0) { commitMap[fp].push(commitMsg); }
                    if (!fileSessionMap[fp]) { fileSessionMap[fp] = []; }
                    if (fileSessionMap[fp].indexOf(sessionKey) < 0) { fileSessionMap[fp].push(sessionKey); }
                }
            }
        } catch(e) {}
        for (var ri = 0; ri < results.length; ri++) {
            results[ri].reasons = commitMap[results[ri].path] || [];
            results[ri].sessions = fileSessionMap[results[ri].path] || [];
            var fileName = path.basename(results[ri].path, path.extname(results[ri].path));
            var ext = path.extname(results[ri].path).toLowerCase();
            var dependents = 0;
            var risk = 'low';
            if (ext === '.java') {
                try {
                    var grepOut = exec('git -C "' + REPO + '" grep -l "' + fileName + '" -- "*.java" 2>nul', { encoding: 'utf8' }).trim();
                    dependents = grepOut ? grepOut.split('\n').length - 1 : 0;
                } catch(e) {
                    if (e.stdout) { var lines = e.stdout.toString().trim().split('\n'); dependents = lines.length - 1; }
                }
            } else if (ext === '.js') {
                try {
                    var grepOut = exec('git -C "' + REPO + '" grep -l "' + fileName + '" -- "*.html" "*.js" 2>nul', { encoding: 'utf8' }).trim();
                    dependents = grepOut ? grepOut.split('\n').length - 1 : 0;
                } catch(e) {
                    if (e.stdout) { var lines = e.stdout.toString().trim().split('\n'); dependents = lines.length - 1; }
                }
            }
            if (dependents >= 10) { risk = 'high'; }
            else if (dependents >= 3) { risk = 'medium'; }
            results[ri].dependents = dependents;
            results[ri].risk = risk;
        }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ files: results, prodFolder: prodFolder, repoBase: REPO, totalFiles: results.length, totalAdded: results.reduce(function(s,f){return s+f.added;},0), totalRemoved: results.reduce(function(s,f){return s+f.removed;},0) }));
        return;
    }

    if (req.url.indexOf('/api/proddifffile') === 0) {
        var qs = req.url.split('?')[1] || '';
        var params = {};
        qs.split('&').forEach(function(p) { var kv = p.split('='); if (kv[0]) { params[kv[0]] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); } });
        var filePath = params.file || '';
        var prodFolder = '';
        try { prodFolder = fs.readFileSync(REPO + '/_prod_path.txt', 'utf8').trim(); } catch(e) {}
        var prodFile = prodFolder + '/' + filePath;
        var repoFile = REPO + '/' + filePath;
        var prodPath = prodFile.replace(/\//g, '\\');
        var repoPath = repoFile.replace(/\//g, '\\');
        var isNew = !fs.existsSync(prodPath);
        var prodDate = '';
        var repoDate = '';
        try { prodDate = fs.statSync(prodPath).mtime.toLocaleString(); } catch(e) {}
        try { repoDate = fs.statSync(repoPath).mtime.toLocaleString(); } catch(e) {}
        var diffLines = [];
        try {
            if (isNew) {
                var content = fs.readFileSync(repoPath, 'utf8').split('\n');
                for (var ni = 0; ni < content.length; ni++) { diffLines.push('+' + content[ni]); }
            } else {
                var diffOut = exec('git diff --no-index -U9999 "' + prodFile + '" "' + repoFile + '"', { encoding: 'utf8' });
                var rawLines = diffOut.split('\n');
                for (var di = 0; di < rawLines.length; di++) {
                    var dl = rawLines[di];
                    if (dl.indexOf('@@') === 0 || dl.indexOf('+') === 0 || dl.indexOf('-') === 0 || dl.indexOf(' ') === 0) {
                        if (dl.indexOf('---') === 0 || dl.indexOf('+++') === 0) { continue; }
                        diffLines.push(dl);
                    }
                }
            }
        } catch(e) {
            if (e.stdout) {
                var rawLines = e.stdout.toString().split('\n');
                for (var di = 0; di < rawLines.length; di++) {
                    var dl = rawLines[di];
                    if (dl.indexOf('@@') === 0 || dl.indexOf('+') === 0 || dl.indexOf('-') === 0 || dl.indexOf(' ') === 0) {
                        if (dl.indexOf('---') === 0 || dl.indexOf('+++') === 0) { continue; }
                        diffLines.push(dl);
                    }
                }
            }
        }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ lines: diffLines, file: filePath, isNew: isNew, prodPath: prodFile, repoPath: repoFile, prodDate: prodDate, repoDate: repoDate }));
        return;
    }

    if (req.url.indexOf('/api/getdiff') === 0) {
        var qs = req.url.split('?')[1] || '';
        var params = {};
        qs.split('&').forEach(function(p) { var kv = p.split('='); if (kv[0]) { params[kv[0]] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); } });
        var hash = params.hash || '';
        var filePath = params.file || '';
        var diffLines = [];
        var prodFolder = '';
        try { prodFolder = fs.readFileSync(REPO + '/_prod_path.txt', 'utf8').trim(); } catch(e) {}
        var prodFile = prodFolder + '/' + filePath;
        var currentFile = REPO + '/' + filePath;
        try {
            if (fs.existsSync(prodFile.replace(/\//g, '\\'))) {
                var diffOut = exec('git diff --no-index "' + prodFile + '" "' + currentFile + '"', { encoding: 'utf8' });
                var rawLines = diffOut.split('\n');
                for (var di = 0; di < rawLines.length; di++) {
                    var dl = rawLines[di];
                    if (dl.indexOf('@@') === 0 || dl.indexOf('+') === 0 || dl.indexOf('-') === 0 || dl.indexOf(' ') === 0) {
                        if (dl.indexOf('---') === 0 || dl.indexOf('+++') === 0) { continue; }
                        diffLines.push(dl);
                    }
                }
            } else {
                var diffOut = exec('git -C "' + REPO + '" diff ' + hash + '~1..' + hash + ' -- "' + filePath + '"', { encoding: 'utf8' });
                var rawLines = diffOut.split('\n');
                for (var di = 0; di < rawLines.length; di++) {
                    var dl = rawLines[di];
                    if (dl.indexOf('@@') === 0 || dl.indexOf('+') === 0 || dl.indexOf('-') === 0 || dl.indexOf(' ') === 0) {
                        if (dl.indexOf('---') === 0 || dl.indexOf('+++') === 0) { continue; }
                        diffLines.push(dl);
                    }
                }
            }
        } catch(e) {
            if (e.stdout) {
                var rawLines = e.stdout.toString().split('\n');
                for (var di = 0; di < rawLines.length; di++) {
                    var dl = rawLines[di];
                    if (dl.indexOf('@@') === 0 || dl.indexOf('+') === 0 || dl.indexOf('-') === 0 || dl.indexOf(' ') === 0) {
                        if (dl.indexOf('---') === 0 || dl.indexOf('+++') === 0) { continue; }
                        diffLines.push(dl);
                    }
                }
            }
        }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ lines: diffLines, file: filePath, hash: hash, source: fs.existsSync(prodFile.replace(/\//g, '\\')) ? 'production' : 'git' }));
        return;
    }

    if (req.url.indexOf('/api/openbc') === 0) {
        var qs = req.url.split('?')[1] || '';
        var params = {};
        qs.split('&').forEach(function(p) { var kv = p.split('='); if (kv[0]) { params[kv[0]] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); } });
        var filePath = params.file || '';
        var prodFolder = '';
        try { prodFolder = fs.readFileSync(REPO + '/_prod_path.txt', 'utf8').trim(); } catch(e) {}
        var prodFile = (prodFolder + '/' + filePath).replace(/\//g, '\\');
        var repoFile = (REPO + '/' + filePath).replace(/\//g, '\\');
        try {
            var bcPath = fs.readFileSync(REPO + '/_bc_path.txt', 'utf8').trim();
            exec('start "" "' + bcPath + '" "' + prodFile + '" "' + repoFile + '"', { encoding: 'utf8' });
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: true }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: false, msg: e.message }));
        }
        return;
    }

    if (req.url.indexOf('/api/openchange') === 0) {
        var qs = req.url.split('?')[1] || '';
        var params = {};
        qs.split('&').forEach(function(p) { var kv = p.split('='); if (kv[0]) { params[kv[0]] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); } });
        var hash = params.hash || '';
        var filePath = params.file || '';
        var line = 1;
        try {
            var diffOut = exec('git -C "' + REPO + '" diff ' + hash + '~1..' + hash + ' -- "' + filePath + '"', { encoding: 'utf8' });
            var diffLines = diffOut.split('\n');
            var hunkStart = 0;
            var currentLine = 0;
            for (var di = 0; di < diffLines.length; di++) {
                var dl = diffLines[di];
                if (dl.indexOf('@@') === 0) {
                    var hm = dl.match(/@@ [^\+]*\+(\d+)/);
                    if (hm) { hunkStart = parseInt(hm[1]); currentLine = hunkStart; }
                } else if (hunkStart > 0) {
                    if (dl.indexOf('+') === 0 && dl.indexOf('+++') !== 0) { line = currentLine; break; }
                    if (dl.indexOf('-') === 0) { continue; }
                    currentLine++;
                }
            }
        } catch(e) {}
        var fullPath = REPO + '/' + filePath;
        try {
            var target = '"' + fullPath.replace(/\//g, '\\') + ':' + line + '"';
            exec('code --goto ' + target, { encoding: 'utf8' });
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: true, line: line }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: false, msg: e.message }));
        }
        return;
    }

    if (req.url.indexOf('/api/open') === 0) {
        var qs = req.url.split('?')[1] || '';
        var params = {};
        qs.split('&').forEach(function(p) { var kv = p.split('='); if (kv[0]) { params[kv[0]] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); } });
        var file = (params.file || '').replace(/\//g, '\\');
        var line = params.line || '';
        if (file && !fs.existsSync(file)) {
            var fixed = file.replace(/\\TicTacWisdom\\js\\/i, '\\mobile\\js\\')
                           .replace(/\\TicTacWisdom\\css\\/i, '\\mobile\\css\\');
            if (fs.existsSync(fixed)) { file = fixed; }
        }
        if (!file || !fs.existsSync(file)) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: false, msg: 'File not found: ' + file }));
            return;
        }
        try {
            var target = '"' + (line ? file + ':' + line : file) + '"';
            exec('code --goto ' + target, { encoding: 'utf8' });
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: true }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ ok: false, msg: e.message }));
        }
        return;
    }

    if (req.url === '/api/costlog') {
        try {
            var costContent = readSafe(MEM + 'tasks/cost_log.md');
            var costRows = [];
            costContent.split('\n').forEach(function(line) {
                if (line.startsWith('|') && !line.includes('---') && !line.includes('Session') && !line.includes('Date')) {
                    var cols = line.split('|').map(function(c) { return c.trim(); }).filter(Boolean);
                    if (cols.length >= 2) {
                        costRows.push({ date: cols[0], session: cols[1], tokens: cols[2] || '—', context: cols[3] || '' });
                    }
                }
            });
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ rows: costRows.slice(-10) }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ rows: [] }));
        }
        return;
    }

    if (req.url === '/api/skillhealth') {
        try {
            var scoreContent = readSafe(MEM + 'tasks/skill_scores.md');
            var skills = {};
            scoreContent.split('\n').forEach(function(line) {
                if (!line.startsWith('|') || line.includes('---') || line.includes('Skill')) { return; }
                var cols = line.split('|').map(function(c) { return c.trim(); }).filter(Boolean);
                if (cols.length < 5) { return; }
                var skill = cols[1];
                var correction = cols[4];
                var patched = cols.length >= 8 ? cols[7] : '-';
                if (!skills[skill]) { skills[skill] = { y: 0, n: 0, unpatchedY: 0 }; }
                if (correction === 'Y') { skills[skill].y++; if (patched === '-') { skills[skill].unpatchedY++; } }
                else if (correction === 'N') { skills[skill].n++; }
            });
            var result = Object.keys(skills).map(function(name) {
                var s = skills[name];
                return { name: name, status: s.unpatchedY >= 3 ? 'urgent' : s.unpatchedY >= 2 ? 'watch' : 'stable', unpatchedY: s.unpatchedY, n: s.n };
            });
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ skills: result }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ skills: [] }));
        }
        return;
    }

    if (req.url === '/api/filetree') {
        try {
            var treeFiles = [];
            [MEM + 'java_function_index.md', MEM + 'js_function_index.md'].forEach(function(indexPath) {
                var content = readSafe(indexPath);
                var currentFile = null;
                content.split('\n').forEach(function(line) {
                    var pathMatch = line.match(/^Path:\s*(.+)/);
                    if (pathMatch) { currentFile = { path: pathMatch[1].trim().replace(/\\/g, '/'), methods: [] }; treeFiles.push(currentFile); return; }
                    var methodMatch = line.match(/^\|\s*([^\|]+?)\s*\|\s*(\d+)\s*\|/);
                    if (methodMatch && currentFile && methodMatch[1].trim() !== 'Method') {
                        currentFile.methods.push({ name: methodMatch[1].trim(), line: parseInt(methodMatch[2]) });
                    }
                });
            });
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ files: treeFiles }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ files: [] }));
        }
        return;
    }

    if (req.url.indexOf('/api/history') === 0) {
        var q = '';
        var qMatch = req.url.match(/[?&]q=([^&]*)/);
        if (qMatch) { q = decodeURIComponent(qMatch[1]).toLowerCase(); }
        var groups = [];
        var prodFolder = '';
        try { prodFolder = fs.readFileSync(REPO + '/_prod_path.txt', 'utf8').trim(); } catch(e) {}
        var prodDiffCache = {};
        try {
            exec('git -C "' + REPO + '" fetch origin --quiet', { encoding: 'utf8' });
            var histOut = exec('git -C "' + REPO + '" log origin/main --format=COMMIT:%H:%s --numstat -500', { encoding: 'utf8' }).trim();
            var blocks = histOut ? histOut.split('COMMIT:').filter(function(s) { return s.trim(); }) : [];
            var sessionMap = {};
            var sessionOrder = [];
            for (var hi = 0; hi < blocks.length; hi++) {
                var blockLines = blocks[hi].split('\n').filter(function(s) { return s.trim(); });
                var firstLine = blockLines[0];
                var hashEnd = firstLine.indexOf(':');
                var hash = firstLine.substring(0, hashEnd);
                var subject = firstLine.substring(hashEnd + 1);
                var files = [];
                for (var fi = 1; fi < blockLines.length; fi++) {
                    var parts = blockLines[fi].split('\t');
                    if (parts.length >= 3) {
                        var fp = parts[2];
                        if (prodFolder) {
                            if (prodDiffCache[fp] === undefined) {
                                var pf = (prodFolder + '/' + fp).replace(/\//g, '\\');
                                var rf = (REPO + '/' + fp).replace(/\//g, '\\');
                                if (!fs.existsSync(pf) || !fs.existsSync(rf)) { prodDiffCache[fp] = true; }
                                else { try { prodDiffCache[fp] = fs.readFileSync(rf, 'utf8') !== fs.readFileSync(pf, 'utf8'); } catch(e) { prodDiffCache[fp] = true; } }
                            }
                            if (!prodDiffCache[fp]) { continue; }
                        }
                        files.push({ path: fp, added: parseInt(parts[0]) || 0, removed: parseInt(parts[1]) || 0 });
                    }
                }
                var sm = subject.match(/^Session (\d+)/i);
                var sKey = sm ? sm[1] : 'other';
                if (!sessionMap[sKey]) { sessionMap[sKey] = []; sessionOrder.push(sKey); }
                sessionMap[sKey].push({ msg: subject, files: files, hash: hash });
            }
            for (var hj = 0; hj < sessionOrder.length; hj++) {
                var key = sessionOrder[hj];
                var commits = sessionMap[key];
                if (q) {
                    commits = commits.filter(function(c) { return c.msg.toLowerCase().indexOf(q) >= 0; });
                    if (commits.length === 0) { continue; }
                }
                groups.push({ session: key, commits: commits });
            }
        } catch(e) {}
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ groups: groups }));
        return;
    }

    if (req.url === '/api/status') {
        var status = parseStatus();
        var deferred = parseDeferred();
        var git = getGit();
        var sessionClosed = status.sessionClosed;
        checkResin(function(resinUp) {
            var data = {
                session: status.session,
                lastChange: status.lastChange,
                deferred: deferred,
                git: git,
                resin: resinUp,
                memorySync: getMemorySync(),
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            };
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify(data));
        });
        return;
    }

    var urlPath = req.url === '/' ? '/index.html' : req.url;
    var filePath = path.join(PUBLIC, urlPath);
    var ext = path.extname(filePath);

    fs.readFile(filePath, function(err, data) {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
        res.end(data);
    });
});

server.listen(PORT, function() {
    console.log('');
    console.log('  INFOGRASP Dashboard  ->  http://localhost:' + PORT);
    console.log('  In VS Code: Ctrl+Shift+P -> "Simple Browser: Show"');
    console.log('  URL: http://localhost:' + PORT);
    console.log('');
});
