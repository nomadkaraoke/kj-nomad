// --- Theme Switching ---
function initializeTheme() {
    const themeToggleButton = document.getElementById('theme-toggle-button');
    if (!themeToggleButton) {
        return;
    }
    
    const body = document.body;

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('kj-nomad-theme') || 'dark';
    if (savedTheme === 'dark') {
        body.classList.add('dark');
    }

    themeToggleButton.addEventListener('click', () => {
        body.classList.toggle('dark');
        const newTheme = body.classList.contains('dark') ? 'dark' : 'light';
        localStorage.setItem('kj-nomad-theme', newTheme);
    });
}

// --- Download functionality ---
const releaseData = {
    version: "1.0.0",
    repo: "nomadkaraoke/kj-nomad",
    downloads: {
        windows_installer: `https://github.com/nomadkaraoke/kj-nomad/releases/download/latest/KJ-Nomad-Setup-1.0.0.exe`,
        windows_portable: `https://github.com/nomadkaraoke/kj-nomad/releases/download/latest/KJ-Nomad-1.0.0-win.zip`,
        macos_intel: `https://github.com/nomadkaraoke/kj-nomad/releases/download/latest/KJ-Nomad-1.0.0.dmg`,
        macos_apple_silicon: `https://github.com/nomadkaraoke/kj-nomad/releases/download/latest/KJ-Nomad-1.0.0-arm64.dmg`,
        linux_appimage: `https://github.com/nomadkaraoke/kj-nomad/releases/download/latest/KJ-Nomad-1.0.0.AppImage`,
        linux_deb: `https://github.com/nomadkaraoke/kj-nomad/releases/download/latest/kj-nomad_1.0.0_amd64.deb`
    }
};

function showDownloadOptions() {
    const platform = detectPlatform();
    const downloadUrl = getDownloadUrl(platform);
    
    if (downloadUrl) {
        // Direct download for detected platform
        window.open(downloadUrl, '_blank');
    } else {
        // Show all options
        showAllDownloadOptions();
    }
}

function detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    if (userAgent.includes('win') || platform.includes('win')) {
        return 'windows';
    } else if (userAgent.includes('mac') || platform.includes('mac')) {
        // Detect Apple Silicon vs Intel
        if (userAgent.includes('arm') || userAgent.includes('aarch64')) {
            return 'macos_apple_silicon';
        }
        return 'macos_intel';
    } else if (userAgent.includes('linux') || platform.includes('linux')) {
        return 'linux';
    }
    return null;
}

function getDownloadUrl(platform) {
    if (!releaseData || !releaseData.downloads) return null;
    
    switch (platform) {
        case 'windows':
            return releaseData.downloads.windows_installer;
        case 'macos_intel':
            return releaseData.downloads.macos_intel;
        case 'macos_apple_silicon':
            return releaseData.downloads.macos_apple_silicon;
        case 'linux':
            return releaseData.downloads.linux_appimage;
        default:
            return null;
    }
}

function showAllDownloadOptions() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(10px);
    `;
    
    modal.innerHTML = `
        <div style="
            background: var(--card-dark);
            border-radius: 20px;
            padding: 3rem;
            max-width: 600px;
            width: 90%;
            border: 2px solid var(--pink);
        ">
            <h3 style="
                font-family: 'Righteous', cursive;
                font-size: 2rem;
                margin-bottom: 2rem;
                text-align: center;
                color: var(--pink);
            ">Download KJ-Nomad v${releaseData?.version || 'latest'}</h3>
            
            <div style="display: grid; gap: 1rem;">
                <a href="${releaseData?.downloads?.windows_installer || '#'}" 
                   style="
                       display: flex;
                       align-items: center;
                       padding: 1rem;
                       background: rgba(35, 10, 137, 0.05);
                       border-radius: 10px;
                       text-decoration: none;
                       color: var(--text-primary-light);
                       transition: all 0.3s ease;
                   "
                   onmouseover="this.style.background='rgba(35, 10, 137, 0.1)'"
                   onmouseout="this.style.background='rgba(35, 10, 137, 0.05)'">
                    <span style="font-size: 2rem; margin-right: 1rem;">🪟</span>
                    <div>
                        <div style="font-weight: 600;">Windows Installer</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">Recommended for Windows users</div>
                    </div>
                </a>
                
                <a href="${releaseData?.downloads?.macos_intel || '#'}" 
                   style="
                       display: flex;
                       align-items: center;
                       padding: 1rem;
                       background: rgba(255, 122, 204, 0.1);
                       border-radius: 10px;
                       text-decoration: none;
                       color: white;
                       transition: all 0.3s ease;
                   "
                   onmouseover="this.style.background='rgba(255, 122, 204, 0.2)'"
                   onmouseout="this.style.background='rgba(255, 122, 204, 0.1)'">
                    <span style="font-size: 2rem; margin-right: 1rem;">🍎</span>
                    <div>
                        <div style="font-weight: 600;">macOS (Intel)</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">For Intel-based Macs</div>
                    </div>
                </a>
                
                <a href="${releaseData?.downloads?.macos_apple_silicon || '#'}" 
                   style="
                       display: flex;
                       align-items: center;
                       padding: 1rem;
                       background: rgba(255, 122, 204, 0.1);
                       border-radius: 10px;
                       text-decoration: none;
                       color: white;
                       transition: all 0.3s ease;
                   "
                   onmouseover="this.style.background='rgba(255, 122, 204, 0.2)'"
                   onmouseout="this.style.background='rgba(255, 122, 204, 0.1)'">
                    <span style="font-size: 2rem; margin-right: 1rem;">🍎</span>
                    <div>
                        <div style="font-weight: 600;">macOS (Apple Silicon)</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">For M1/M2/M3 Macs</div>
                    </div>
                </a>
                
                <a href="${releaseData?.downloads?.linux_appimage || '#'}" 
                   style="
                       display: flex;
                       align-items: center;
                       padding: 1rem;
                       background: rgba(255, 122, 204, 0.1);
                       border-radius: 10px;
                       text-decoration: none;
                       color: white;
                       transition: all 0.3s ease;
                   "
                   onmouseover="this.style.background='rgba(255, 122, 204, 0.2)'"
                   onmouseout="this.style.background='rgba(255, 122, 204, 0.1)'">
                    <span style="font-size: 2rem; margin-right: 1rem;">🐧</span>
                    <div>
                        <div style="font-weight: 600;">Linux AppImage</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">Universal Linux application</div>
                    </div>
                </a>
            </div>
            
            <div style="text-align: center; margin-top: 2rem;">
                <button onclick="document.body.removeChild(this.closest('div').parentElement)" 
                        style="
                            background: transparent;
                            border: 2px solid var(--text-secondary);
                            color: var(--text-secondary);
                            padding: 0.5rem 1.5rem;
                            border-radius: 25px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                        onmouseover="this.style.borderColor='var(--pink)'; this.style.color='var(--pink)'"
                        onmouseout="this.style.borderColor='var(--text-secondary)'; this.style.color='var(--text-secondary)'">
                    Close
                </button>
            </div>
        </div>
    `;
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
    
    document.body.appendChild(modal);
}

// --- Smooth scrolling for anchor links ---
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeSmoothScroll();
});
