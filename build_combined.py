#!/usr/bin/env python3
"""Combines ANY App HTML files into a single unified HTML with splash screen.

Architecture:
- document.write() (no Blob URL / no sandbox)
- Logo deduplication via __LOGO__ placeholder
- Splash logo (JPEG square) stored once in parent
- Header logo in sub-apps = clickable → returns to hub (no separate back button)
- ZIP with deflate compression for Netlify
"""

import os
import re
import base64

BASE = os.path.dirname(os.path.abspath(__file__))

def read_file(path):
    with open(os.path.join(BASE, path), 'r', encoding='utf-8') as f:
        return f.read()

def read_binary(path):
    with open(os.path.join(BASE, path), 'rb') as f:
        return f.read()

def escape_for_template(html):
    """Escape backticks, ${} and </script> for JS template literals."""
    html = html.replace('\\', '\\\\')
    html = html.replace('`', '\\`')
    html = html.replace('${', '\\${')
    html = html.replace('</script>', '<\\/script>')
    return html

def extract_and_replace_logo(html):
    """Extract first PNG base64 img src and replace with __LOGO__ placeholder."""
    match = re.search(r'(data:image/png;base64,[^"]+)', html)
    if match:
        logo = match.group(1)
        html = html.replace(logo, '__LOGO__')
        return html, logo
    return html, None

def make_logo_clickable_to_hub(html):
    """Make the header logo img clickable → parent.loadApp('hub').
    Handles both: <a href="..."><img __LOGO__></a> and bare <img __LOGO__>."""
    hub_onclick = 'onclick="event.preventDefault(); parent.loadApp(\'hub\')"'

    # Case 1: Logo already wrapped in <a> with loadApp — skip (already correct)
    # Case 1b: Logo wrapped in <a> without loadApp — replace href
    def fix_existing_link(m):
        full = m.group(0)
        if "loadApp" in full:
            return full  # Already has loadApp, don't duplicate
        return '<a href="#" ' + hub_onclick + ' style="cursor:pointer;">' + m.group(2) + '</a>'

    html = re.sub(
        r'(<a\s[^>]*>)\s*(<img\s[^>]*__LOGO__[^>]*>)\s*</a>',
        fix_existing_link,
        html
    )

    # Case 2: Bare <img __LOGO__> not inside <a> — wrap it
    def wrap_bare_logo(m):
        full = m.group(0)
        # Check if already inside an <a> by looking at preceding context
        start = m.start()
        preceding = html[max(0, start-200):start]
        if '<a ' in preceding and '</a>' not in preceding:
            return full  # Already inside a link
        # Remove any onclick on the img itself (build will provide via <a>)
        cleaned = re.sub(r'\s*onclick="[^"]*"', '', full)
        return '<a href="#" ' + hub_onclick + ' style="cursor:pointer;">' + cleaned + '</a>'

    html = re.sub(r'<img\s[^>]*__LOGO__[^>]*>', wrap_bare_logo, html)

    return html

# ══════════════════════════════════════════════════════════
# 1. Read all HTML files
# ══════════════════════════════════════════════════════════
hub_html = read_file('hub/index.html')
vm_html = read_file('tools/vm-guide/index.html')
airway_html = read_file('tools/airway-guide/index.html')
infusion_html = read_file('tools/infusion-guide/index.html')
tep_html = read_file('tools/tep-guide/index.html')
seda_html = read_file('tools/seda-path/index.html')
tox_html = read_file('tools/tox-path/index.html')
ped_html = read_file('tools/ped-guide/index.html')
palia_html = read_file('tools/palia-path/index.html')
block_html = read_file('tools/block-path/index.html')
acls_html = read_file('tools/acls/index.html')
dengue_html = read_file('tools/dengue-path/index.html')
shock_html = read_file('tools/shock-path/index.html')

print("Read 13 HTML files: Hub, VM, Airway, Infusion, TEP, SedaPath, ToxPath, PedGuide, PaliaPath, BlockPath, ACLS, DenguePath, ShockPath")

# ══════════════════════════════════════════════════════════
# 2. Load splash logo (JPEG square) — stored once in parent
# ══════════════════════════════════════════════════════════
splash_logo_bytes = read_binary('assets/splash-logo.jpeg')
splash_logo_b64 = 'data:image/jpeg;base64,' + base64.b64encode(splash_logo_bytes).decode()
print("Splash logo (square JPEG): %d chars" % len(splash_logo_b64))

# ══════════════════════════════════════════════════════════
# 3. Extract PNG header logo from hub (deduplicate)
# ══════════════════════════════════════════════════════════
hub_html, header_logo = extract_and_replace_logo(hub_html)
if header_logo:
    print("Header logo (PNG): %d chars — deduplicated to __LOGO__" % len(header_logo))
    # Replace the exact same logo in apps that share it
    vm_html = vm_html.replace(header_logo, '__LOGO__')
    airway_html = airway_html.replace(header_logo, '__LOGO__')
    infusion_html = infusion_html.replace(header_logo, '__LOGO__')
    tep_html = tep_html.replace(header_logo, '__LOGO__')
    seda_html = seda_html.replace(header_logo, '__LOGO__')
    tox_html = tox_html.replace(header_logo, '__LOGO__')
    ped_html = ped_html.replace(header_logo, '__LOGO__')
    palia_html = palia_html.replace(header_logo, '__LOGO__')
    block_html = block_html.replace(header_logo, '__LOGO__')
    acls_html = acls_html.replace(header_logo, '__LOGO__')
    dengue_html = dengue_html.replace(header_logo, '__LOGO__')
    shock_html = shock_html.replace(header_logo, '__LOGO__')
    # TEP may have a different PNG logo — also replace any remaining PNG base64
    tep_html = re.sub(r'data:image/png;base64,[A-Za-z0-9+/=]+', '__LOGO__', tep_html)
    acls_html = re.sub(r'data:image/png;base64,[A-Za-z0-9+/=]+', '__LOGO__', acls_html)
    dengue_html = re.sub(r'data:image/png;base64,[A-Za-z0-9+/=]+', '__LOGO__', dengue_html)
    shock_html = re.sub(r'data:image/png;base64,[A-Za-z0-9+/=]+', '__LOGO__', shock_html)
else:
    print("WARNING: No header logo found in hub!")
    header_logo = ''

# ══════════════════════════════════════════════════════════
# 4. Modify links: external → internal navigation
# ══════════════════════════════════════════════════════════

# HUB: replace external links with internal navigation
hub_html = hub_html.replace(
    'href="https://infusoes.netlify.app"',
    'href="#" onclick="event.preventDefault(); parent.loadApp(\'infusion\')"'
)
hub_html = hub_html.replace(
    'href="https://airwayguide.netlify.app"',
    'href="#" onclick="event.preventDefault(); parent.loadApp(\'airway\')"'
)
hub_html = hub_html.replace(
    'href="https://vmguide.netlify.app"',
    'href="#" onclick="event.preventDefault(); parent.loadApp(\'vm\')"'
)
hub_html = hub_html.replace(
    'href="https://tepguide.netlify.app"',
    'href="#" onclick="event.preventDefault(); parent.loadApp(\'tep\')"'
)
hub_html = hub_html.replace(
    'href="https://sedapath.netlify.app"',
    'href="#" onclick="event.preventDefault(); parent.loadApp(\'seda\')"'
)
hub_html = hub_html.replace(
    'href="https://toxpath.netlify.app"',
    'href="#" onclick="event.preventDefault(); parent.loadApp(\'tox\')"'
)
hub_html = hub_html.replace(
    'href="https://pedguide.netlify.app"',
    'href="#" onclick="event.preventDefault(); parent.loadApp(\'ped\')"'
)
hub_html = hub_html.replace(
    'href="https://paliapath.netlify.app"',
    'href="#" onclick="event.preventDefault(); parent.loadApp(\'palia\')"'
)

# Sub-apps: replace links back to hub
for url in ['https://hubany.netlify.app/hub.html', 'https://hubany.netlify.app']:
    replacement = 'href="#" onclick="event.preventDefault(); parent.loadApp(\'hub\')"'
    vm_html = vm_html.replace('href="%s"' % url, replacement)
    airway_html = airway_html.replace('href="%s"' % url, replacement)
    infusion_html = infusion_html.replace('href="%s"' % url, replacement)
    tep_html = tep_html.replace('href="%s"' % url, replacement)

# Airway Guide: fix cross-link to infusion calculator
airway_html = airway_html.replace(
    'href="https://anyapp-infusoes.netlify.app"',
    'href="#" onclick="event.preventDefault(); parent.loadApp(\'infusion\')"'
)

# TEP Guide: link HNF infusion to infusion guide
tep_html = tep_html.replace(
    'Integração futura com Guia de Infusões.',
    '<a href="#" onclick="event.preventDefault(); parent.loadApp(\'infusion\')" style="color:var(--info);text-decoration:underline;">Abrir Guia de Infusões →</a>'
)

# ══════════════════════════════════════════════════════════
# 5. Make header logo clickable → hub (replaces back button)
# ══════════════════════════════════════════════════════════
vm_html = make_logo_clickable_to_hub(vm_html)
airway_html = make_logo_clickable_to_hub(airway_html)
infusion_html = make_logo_clickable_to_hub(infusion_html)
tep_html = make_logo_clickable_to_hub(tep_html)
seda_html = make_logo_clickable_to_hub(seda_html)
tox_html = make_logo_clickable_to_hub(tox_html)
ped_html = make_logo_clickable_to_hub(ped_html)
palia_html = make_logo_clickable_to_hub(palia_html)
block_html = make_logo_clickable_to_hub(block_html)
acls_html = make_logo_clickable_to_hub(acls_html)
dengue_html = make_logo_clickable_to_hub(dengue_html)
shock_html = make_logo_clickable_to_hub(shock_html)
print("Logo click → hub applied to all sub-apps (no separate back button)")

# ══════════════════════════════════════════════════════════
# 6. Fix Airway Guide: Reiniciar should NOT reload page
# ══════════════════════════════════════════════════════════
airway_html = airway_html.replace(
    "if (confirm('Reiniciar todo o guia?')) location.reload();",
    """if (confirm('Reiniciar todo o guia?')) {
            // Reset state without reloading (would break iframe navigation)
            state = { step: 1, indications: [false,false,false,false,false,false], crash: {L:false,E:false,M:false,O:false,N:false}, difficult: {}, plan: 'standard', failed: false, cico: false };
            document.querySelectorAll('.check-item').forEach(function(el){ el.classList.remove('checked','checked-warning','checked-danger'); });
            goToStep(1);
            window.scrollTo(0, 0);
        }"""
)
print("Fixed Airway 'Reiniciar' — no longer reloads page")

# ══════════════════════════════════════════════════════════
# 7. Escape all HTML for JS template literals
# ══════════════════════════════════════════════════════════
hub_escaped = escape_for_template(hub_html)
vm_escaped = escape_for_template(vm_html)
airway_escaped = escape_for_template(airway_html)
infusion_escaped = escape_for_template(infusion_html)
tep_escaped = escape_for_template(tep_html)
seda_escaped = escape_for_template(seda_html)
tox_escaped = escape_for_template(tox_html)
ped_escaped = escape_for_template(ped_html)
palia_escaped = escape_for_template(palia_html)
block_escaped = escape_for_template(block_html)
acls_escaped = escape_for_template(acls_html)
dengue_escaped = escape_for_template(dengue_html)
shock_escaped = escape_for_template(shock_html)
header_logo_escaped = escape_for_template(header_logo)

# ══════════════════════════════════════════════════════════
# 8. Build the combined HTML
# ══════════════════════════════════════════════════════════
combined = '''<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>ANY App — Medicina de Emergência</title>
    <meta name="description" content="ANY App — Ferramentas de apoio à decisão clínica para medicina de emergência">
    <meta property="og:title" content="ANY App — Medicina de Emergência">
    <meta property="og:description" content="Ferramentas de apoio à decisão clínica para medicina de emergência">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.101.1/dist/umd/supabase.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            background: #000;
            height: 100%;
            overflow: hidden;
        }

        /* ── Splash Screen ── */
        #splash {
            position: fixed;
            inset: 0;
            z-index: 10000;
            background: #000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 24px;
            transition: opacity 0.8s ease;
        }
        #splashCredits {
            color: #999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            text-align: center;
            opacity: 0;
            animation: creditsReveal 1.5s ease 1.5s forwards;
        }
        @keyframes creditsReveal {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        #splash.fade-out {
            opacity: 0;
            pointer-events: none;
        }
        #splashLogo {
            max-width: 220px;
            width: 55%;
            border-radius: 22px;
            overflow: hidden;
            opacity: 0;
            transform: scale(0.92);
            animation: logoReveal 2.2s cubic-bezier(0.25, 1, 0.5, 1) 0.3s forwards;
        }
        #splashLogo img {
            display: block;
            width: 100%;
            height: auto;
            transform: scale(1.08);
        }
        @keyframes logoReveal {
            0%   { opacity: 0; transform: scale(0.92); filter: blur(10px); }
            50%  { opacity: 1; transform: scale(1); filter: blur(0); }
            100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }

        /* ── App Frame ── */
        #appFrame {
            width: 100%;
            height: 100%;
            border: none;
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        #appFrame.visible {
            opacity: 1;
        }

        /* ── Login Elements (inside splash) ── */
        #splashLogin {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            opacity: 0;
            transform: translateY(12px);
            transition: opacity 0.8s ease, transform 0.8s ease;
            pointer-events: none;
        }
        #splashLogin.visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }
        #splashLogin .login-subtitle { color: #A0A0A0; font-size: 13px; text-align: center; max-width: 260px; line-height: 1.5; }
        #splashLogin .login-btn {
            display: flex; align-items: center; gap: 12px;
            background: #FFF; color: #333; border: none; border-radius: 12px;
            padding: 14px 28px; font-size: 15px; font-weight: 600;
            cursor: pointer; min-height: 48px; transition: transform 0.15s;
        }
        #splashLogin .login-btn:active { transform: scale(0.97); }
        #splashLogin .login-btn svg { width: 20px; height: 20px; }
        #splashLogin .login-disclaimer { color: #444; font-size: 11px; text-align: center; max-width: 240px; line-height: 1.4; }
    </style>
</head>
<body>
    <!-- Splash Screen (evolves into login if needed) -->
    <div id="splash">
        <div id="splashLogo">
            <img src="''' + splash_logo_b64 + '''" alt="ANY App — Medicina de Emergência">
        </div>
        <div id="splashCredits">Gustavo Moreira &bull; Gabriela Feltrin &bull; Jo&atilde;o Pedro Moreira</div>
        <div id="splashLogin">
            <div class="login-subtitle">Plataforma de apoio &agrave; decis&atilde;o cl&iacute;nica</div>
            <button class="login-btn" onclick="loginWithGoogle()">
                <svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Entrar com Google
            </button>
            <div class="login-disclaimer">Nenhum dado de paciente &eacute; armazenado.</div>
        </div>
    </div>

    <!-- Persistent Metronome Banner -->
    <div id="metroBanner" style="display:none;position:fixed;top:0;left:0;right:0;z-index:9999;background:#1A1A1A;border-bottom:2px solid #FF5252;padding:8px 16px;align-items:center;justify-content:space-between;font-family:-apple-system,sans-serif">
    <span style="color:#FF5252;font-size:13px;font-weight:600">Metrônomo ativo</span>
    <button onclick="parentStopMetronome();try{document.getElementById('appFrame').contentWindow.syncMetroBtn&&document.getElementById('appFrame').contentWindow.syncMetroBtn()}catch(e){}" style="background:#FF5252;color:#fff;border:none;border-radius:16px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer">Parar</button>
    </div>

    <!-- App Content (no sandbox — content is trusted) -->
    <iframe id="appFrame"></iframe>

    <script>
        // ===== PERSISTENT METRONOME =====
        var _metroCtx = null;
        var _metroInterval = null;
        var _ventInterval = null;
        var _metroConfig = null;
        var _silentAudio = null;

        function parentStartMetronome(config) {
          parentStopMetronome();
          _metroConfig = config || { bpm: 110, ventEnabled: false, ventIntervalMs: 6000 };
          if (!_metroCtx) _metroCtx = new (window.AudioContext || window.webkitAudioContext)();
          if (_metroCtx.state === 'suspended') _metroCtx.resume();
          var intervalMs = Math.round(60000 / _metroConfig.bpm);
          _metroInterval = setInterval(function() {
            _playMetroTick(880, 0.08, 'sine', 0.5);
          }, intervalMs);
          if (_metroConfig.ventEnabled) {
            _ventInterval = setInterval(function() {
              _playMetroVent();
            }, _metroConfig.ventIntervalMs);
          }
          _startSilentAudio();
          _showMetroBanner(true);
        }

        function parentStopMetronome() {
          if (_metroInterval) { clearInterval(_metroInterval); _metroInterval = null; }
          if (_ventInterval) { clearInterval(_ventInterval); _ventInterval = null; }
          _metroConfig = null;
          _stopSilentAudio();
          _showMetroBanner(false);
        }

        function parentUpdateVent(enabled) {
          if (_ventInterval) { clearInterval(_ventInterval); _ventInterval = null; }
          if (_metroConfig) _metroConfig.ventEnabled = enabled;
          if (enabled && _metroConfig && _metroCtx) {
            _ventInterval = setInterval(function() {
              _playMetroVent();
            }, _metroConfig.ventIntervalMs);
          }
        }

        function parentIsMetronomeOn() {
          return _metroInterval !== null;
        }

        function _playMetroTick(freq, dur, type, vol) {
          if (!_metroCtx) return;
          if (_metroCtx.state === 'suspended') _metroCtx.resume();
          var osc = _metroCtx.createOscillator();
          var gain = _metroCtx.createGain();
          osc.type = type || 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(vol || 0.5, _metroCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, _metroCtx.currentTime + dur);
          osc.connect(gain);
          gain.connect(_metroCtx.destination);
          osc.start();
          osc.stop(_metroCtx.currentTime + dur);
        }

        function _playMetroVent() {
          if (!_metroCtx) return;
          if (_metroCtx.state === 'suspended') _metroCtx.resume();
          var osc1 = _metroCtx.createOscillator();
          var gain1 = _metroCtx.createGain();
          osc1.type = 'sine';
          osc1.frequency.value = 1200;
          gain1.gain.setValueAtTime(0.6, _metroCtx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.001, _metroCtx.currentTime + 0.15);
          osc1.connect(gain1); gain1.connect(_metroCtx.destination);
          osc1.start(); osc1.stop(_metroCtx.currentTime + 0.15);
          setTimeout(function() {
            var osc2 = _metroCtx.createOscillator();
            var gain2 = _metroCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.value = 1500;
            gain2.gain.setValueAtTime(0.6, _metroCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, _metroCtx.currentTime + 0.15);
            osc2.connect(gain2); gain2.connect(_metroCtx.destination);
            osc2.start(); osc2.stop(_metroCtx.currentTime + 0.15);
          }, 180);
        }

        function _startSilentAudio() {
          if (_silentAudio) return;
          try {
            _silentAudio = document.createElement('audio');
            _silentAudio.setAttribute('loop', '');
            _silentAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
            _silentAudio.volume = 0.01;
            _silentAudio.play().catch(function(){});
          } catch(e) {}
        }

        function _stopSilentAudio() {
          if (_silentAudio) {
            _silentAudio.pause();
            _silentAudio.src = '';
            _silentAudio = null;
          }
        }

        document.addEventListener('visibilitychange', function() {
          if (!document.hidden && _metroCtx && _metroCtx.state === 'suspended') {
            _metroCtx.resume();
          }
          if (!document.hidden && _silentAudio) {
            _silentAudio.play().catch(function(){});
          }
        });

        function _showMetroBanner(show) {
          var banner = document.getElementById('metroBanner');
          if (!banner) return;
          banner.style.display = show ? 'flex' : 'none';
        }

        // Header logo stored ONCE (deduplicated from all apps)
        var LOGO_BASE64 = `''' + header_logo_escaped + '''`;

        var apps = {
            hub: `''' + hub_escaped + '''`,
            vm: `''' + vm_escaped + '''`,
            airway: `''' + airway_escaped + '''`,
            infusion: `''' + infusion_escaped + '''`,
            tep: `''' + tep_escaped + '''`,
            seda: `''' + seda_escaped + '''`,
            tox: `''' + tox_escaped + '''`,
            ped: `''' + ped_escaped + '''`,
            palia: `''' + palia_escaped + '''`,
            block: `''' + block_escaped + '''`,
            acls: `''' + acls_escaped + '''`,
            dengue: `''' + dengue_escaped + '''`,
            shock: `''' + shock_escaped + '''`
        };

        // ===== SUPABASE AUTH + ANALYTICS =====
        var SUPABASE_URL = 'https://meatbfomblpicftrzcsy.supabase.co';
        var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lYXRiZm9tYmxwaWNmdHJ6Y3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODE3MDAsImV4cCI6MjA5MDQ1NzcwMH0.QU5AuqMOp-V5QZWdLzfPME1ppBFLJRaB2qgjcivaEoI';
        var _sb = null;
        var _authReady = false;

        function initSupabase() {
            if (typeof supabase !== 'undefined' && supabase.createClient) {
                _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                return true;
            }
            return false;
        }

        async function checkAuth() {
            if (!_sb) return null;
            try {
                var result = await _sb.auth.getSession();
                return result.data.session;
            } catch(e) { return null; }
        }

        async function loginWithGoogle() {
            if (!_sb) return;
            await _sb.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: 'https://anyapp.netlify.app' }
            });
        }

        async function logPageview(tool, action, metadata) {
            if (!_sb) return;
            try {
                var result = await _sb.auth.getUser();
                var user = result.data.user;
                if (!user) return;
                _sb.from('pageviews').insert({
                    user_id: user.id,
                    tool: tool,
                    action: action || 'open',
                    metadata: metadata || null,
                    device: window.innerWidth < 768 ? 'mobile' : 'desktop'
                }).then(function(){});
                // Update last_seen
                _sb.from('profiles').update({ last_seen_at: new Date().toISOString() })
                    .eq('id', user.id).then(function(){});
            } catch(e) {}
        }

        function showLoginScreen() {
            // Fade out credits, fade in login elements inside splash
            var credits = document.getElementById('splashCredits');
            if (credits) { credits.style.opacity = '0'; credits.style.transition = 'opacity 0.5s ease'; }
            var login = document.getElementById('splashLogin');
            if (login) setTimeout(function() { login.classList.add('visible'); }, 400);
        }

        function hideLoginScreen() {
            var splash = document.getElementById('splash');
            if (splash) {
                splash.classList.add('fade-out');
                setTimeout(function() { splash.remove(); }, 900);
            }
        }

        var _authenticated = false;
        var _booted = false;

        function loadApp(name, target) {
            if (!_authenticated) return; // guarda: não carrega nada sem sessão ativa
            var html = apps[name].replace(/__LOGO__/g, LOGO_BASE64);
            var frame = document.getElementById('appFrame');
            var doc = frame.contentDocument || frame.contentWindow.document;
            doc.open();
            doc.write(html);
            doc.close();
            if (target) {
                setTimeout(function() {
                    var w = frame.contentWindow;
                    if (w && w.handleDeepLink) {
                        w.handleDeepLink(target);
                    }
                }, 400);
            }
            // Track navigation
            logPageview(name, 'open');
        }

        // ===== BOOT SEQUENCE =====
        function fadeSplashAndShow() {
            setTimeout(function() {
                var splash = document.getElementById('splash');
                var frame = document.getElementById('appFrame');
                if (splash) {
                    splash.classList.add('fade-out');
                    if (frame) frame.classList.add('visible');
                    setTimeout(function() { splash.remove(); }, 900);
                }
            }, 3000);
        }

        async function boot() {
            var sbOk = initSupabase();

            if (!sbOk) {
                // Supabase CDN falhou — mostrar erro após splash
                setTimeout(function() {
                    var credits = document.getElementById('splashCredits');
                    if (credits) credits.style.opacity = '0';
                    var login = document.getElementById('splashLogin');
                    if (login) {
                        setTimeout(function() {
                            login.innerHTML = '<div style="text-align:center;color:#A0A0A0;font-size:14px;padding:0 24px;">Falha ao conectar. Verifique sua conexão e recarregue a página.</div>';
                            login.classList.add('visible');
                        }, 400);
                    }
                }, 3000);
                return;
            }

            // Listen for auth callback (redirect from Google)
            _sb.auth.onAuthStateChange(function(event, session) {
                if (event === 'SIGNED_IN' && session && !_booted) {
                    _booted = true;
                    _authenticated = true;
                    loadApp('hub');
                    logPageview('hub', 'login');
                    hideLoginScreen();
                    var frame = document.getElementById('appFrame');
                    if (frame) frame.classList.add('visible');
                }
            });

            var session = await checkAuth();
            if (session && !_booted) {
                // Sessão ativa — abrir app após splash
                _booted = true;
                _authenticated = true;
                loadApp('hub');
                logPageview('hub', 'session_resume');
                fadeSplashAndShow();
            } else {
                // Sem sessão — mostrar tela de login dentro do splash
                setTimeout(function() {
                    showLoginScreen();
                }, 3000);
            }
        }

        boot();
    </script>
</body>
</html>'''

# ══════════════════════════════════════════════════════════
# 9. Write deploy/index.html (Netlify publishes this folder)
# ══════════════════════════════════════════════════════════
deploy_dir = os.path.join(BASE, 'deploy')
os.makedirs(deploy_dir, exist_ok=True)
deploy_path = os.path.join(deploy_dir, 'index.html')
with open(deploy_path, 'w', encoding='utf-8') as f:
    f.write(combined)

file_size = os.path.getsize(deploy_path)
print("✅ deploy/index.html created: %.1f KB" % (file_size / 1024))

# Verify
logo_count = combined.count('data:image/png;base64,')
splash_count = combined.count('data:image/jpeg;base64,')
print("   PNG logos: %d (should be 1)" % logo_count)
print("   JPEG splash: %d (should be 1)" % splash_count)
print("   Apps included: hub, vm, airway, infusion, tep, seda, tox, ped, palia, block, acls, dengue, shock")
