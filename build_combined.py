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

    # Case 1: Logo already wrapped in <a> — replace href
    html = re.sub(
        r'<a\s+href="[^"]*"([^>]*)>\s*(<img\s[^>]*__LOGO__[^>]*>)\s*</a>',
        r'<a href="#" ' + hub_onclick + r' \1 style="cursor:pointer;">\2</a>',
        html
    )

    # Case 2: Bare <img __LOGO__> not inside <a> — wrap it
    # Matches <img> with __LOGO__ anywhere in attributes (handles id="..." before src)
    def wrap_bare_logo(m):
        full = m.group(0)
        # Check if already inside an <a> by looking at preceding context
        start = m.start()
        preceding = html[max(0, start-200):start]
        if '<a ' in preceding and '</a>' not in preceding:
            return full  # Already inside a link
        return '<a href="#" ' + hub_onclick + ' style="cursor:pointer;">' + full + '</a>'

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

print("Read 10 HTML files: Hub, VM, Airway, Infusion, TEP, SedaPath, ToxPath, PedGuide, PaliaPath, BlockPath")

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
    # TEP may have a different PNG logo — also replace any remaining PNG base64
    tep_html = re.sub(r'data:image/png;base64,[A-Za-z0-9+/=]+', '__LOGO__', tep_html)
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
    </style>
</head>
<body>
    <!-- Splash Screen (square logo, border cropped) -->
    <div id="splash">
        <div id="splashLogo">
            <img src="''' + splash_logo_b64 + '''" alt="ANY App — Medicina de Emergência">
        </div>
        <div id="splashCredits">Gustavo Moreira &bull; Gabriela Feltrin &bull; Jo&atilde;o Pedro Moreira</div>
    </div>

    <!-- App Content (no sandbox — content is trusted) -->
    <iframe id="appFrame"></iframe>

    <script>
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
            block: `''' + block_escaped + '''`
        };

        function loadApp(name, target) {
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
        }

        // Load hub behind the splash
        loadApp('hub');

        // After logo animation (~3s), fade out splash and reveal app
        setTimeout(function() {
            var splash = document.getElementById('splash');
            var frame = document.getElementById('appFrame');
            splash.classList.add('fade-out');
            frame.classList.add('visible');
            setTimeout(function() {
                splash.remove();
            }, 900);
        }, 3000);
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
print("   Apps included: hub, vm, airway, infusion, tep, seda, tox, ped, palia, block")
