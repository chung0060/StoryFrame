document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素獲取
    const backgroundContainer = document.getElementById('background-container');
    const backgroundElements = Array.from(backgroundContainer.querySelectorAll('.background-image'));
    const slideshowContainer = document.getElementById('slideshow-container');
    const imageElements = Array.from(slideshowContainer.querySelectorAll('.slide-image'));
    const menuToggle = document.getElementById('menu-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const intervalValue = document.getElementById('interval-value');
    const intervalSlider = document.getElementById('interval-slider');
    const showClockCheckbox = document.getElementById('show-clock-checkbox');
    const clockContainer = document.getElementById('clock-container');
    const clockAmPm = clockContainer.querySelector('.am-pm');
    const clockTime = clockContainer.querySelector('.time');
    const showLogoCheckbox = document.getElementById('show-logo-checkbox');
    const logoContainer = document.getElementById('logo-container');
    const backgroundMusic = document.getElementById('background-music');

    
    let state = {
        images: [],
        currentIndex: -1,
        interval: 5000,
        playbackMode: 'sequential',
        transition: 'fade',
        background: 'blur',
        timer: null,
        isTransitioning: false,
        isPaused: false,
        animationDuration: 1000,
        clockTimer: null
    };
    
    // --- 新增：移動 highlight 滑塊的函式 ---
    function moveHighlight(targetButton) {
        const optionsGroup = targetButton.closest('.options-group');
        if (!optionsGroup) return;

        const highlight = optionsGroup.querySelector('.highlight');
        if (!highlight) return;

        const targetRect = targetButton.getBoundingClientRect();
        const parentRect = optionsGroup.getBoundingClientRect();
        
        highlight.style.left = `${targetButton.offsetLeft}px`;
        highlight.style.width = `${targetRect.width}px`;
    }

    // 輔助及核心函式
    function getCssVariable(name) { const value = getComputedStyle(document.documentElement).getPropertyValue(name); return value.includes('ms') ? parseFloat(value) : parseFloat(value) * 1000; }
    function preloadImage(url) { return new Promise((resolve, reject) => { const img = new Image(); img.src = url; img.onload = resolve; img.onerror = reject; }); }
    function updateClock() { const now = new Date(); let hours = now.getHours(); const minutes = now.getMinutes(); const ampm = hours >= 12 ? 'PM' : 'AM'; hours = hours % 12; hours = hours ? hours : 12; const minutesPadded = String(minutes).padStart(2, '0'); clockAmPm.textContent = ampm; clockTime.textContent = `${hours}:${minutesPadded}`; }
    
    function updateBackground(imageUrl) {
        if (state.background !== 'blur') return;
        const activeBg = backgroundElements.find(el => el.classList.contains('active'));
        const nextBg = backgroundElements.find(el => !el.classList.contains('active'));
        if (nextBg) {
            nextBg.style.backgroundImage = `url(${imageUrl})`;
            nextBg.classList.add('active');
            if (activeBg) {
                activeBg.classList.remove('active');
            }
        }
    }

    function updateSlide() {
        if (state.isTransitioning || state.images.length === 0) return;
        state.isTransitioning = true;
        let nextIndex;
        if (state.playbackMode === 'random') {
            if (state.images.length > 1) {
                do {
                    nextIndex = Math.floor(Math.random() * state.images.length);
                } while (nextIndex === state.currentIndex);
            } else {
                nextIndex = 0;
            }
        } else {
            nextIndex = (state.currentIndex + 1) % state.images.length;
        }
        const imageUrl = `images/${state.images[nextIndex]}`;
        const activeEl = imageElements.find(el => el.classList.contains('active'));
        const nextEl = imageElements.find(el => !el.classList.contains('active'));
        preloadImage(imageUrl).then(() => {
            updateBackground(imageUrl);
            nextEl.src = imageUrl;
            if (state.transition === 'fade') {
                nextEl.style.zIndex = (parseInt(activeEl?.style.zIndex || '10', 10) + 1).toString();
                if (activeEl) activeEl.classList.remove('active');
                nextEl.classList.add('active');
                setTimeout(() => {
                    if (activeEl) activeEl.style.zIndex = '1';
                    nextEl.style.zIndex = '10';
                    state.currentIndex = nextIndex;
                    state.isTransitioning = false;
                }, state.animationDuration);
            } else if (state.transition === 'slide') {
                nextEl.style.zIndex = (parseInt(activeEl?.style.zIndex || '10', 10) + 1).toString();
                nextEl.classList.add('prepare');
                if (activeEl) activeEl.classList.add('exiting');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        nextEl.classList.remove('prepare');
                        nextEl.classList.add('active');
                    });
                });
                setTimeout(() => {
                    if (activeEl) activeEl.classList.remove('active', 'exiting');
                    nextEl.style.zIndex = '10';
                    state.currentIndex = nextIndex;
                    state.isTransitioning = false;
                }, state.animationDuration);
            }
        }).catch(error => { console.error('Failed to load image:', imageUrl, error); state.isTransitioning = false; });
    }
    
    function manualChangeSlide(direction) { if (state.images.length === 0) return; let nextIndex; if (direction === 'next') { nextIndex = (state.currentIndex + 1) % state.images.length; } else { nextIndex = (state.currentIndex - 1 + state.images.length) % state.images.length; } state.currentIndex = nextIndex; const imageUrl = `images/${state.images[state.currentIndex]}`; const activeEl = imageElements.find(el => el.classList.contains('active')); const nextEl = imageElements.find(el => !el.classList.contains('active')); nextEl.src = imageUrl; nextEl.classList.add('active'); if(activeEl) activeEl.classList.remove('active'); updateBackground(imageUrl); resetTimer(); }
    function resetTimer() { clearInterval(state.timer); if (!state.isPaused) { state.timer = setInterval(updateSlide, state.interval); } }
    function handleKeyDown(e) { if (e.target.tagName === 'INPUT') return; switch(e.key) { case 'ArrowRight': case 'ArrowDown': manualChangeSlide('next'); break; case 'ArrowLeft': case 'ArrowUp': manualChangeSlide('prev'); break; case ' ': e.preventDefault(); togglePause(); break; case 'f': case 'F': toggleFullscreen(); break; case 'Escape': if (settingsPanel.classList.contains('visible')) { settingsPanel.classList.remove('visible'); } break; } }
    function togglePause() { state.isPaused = !state.isPaused; if (state.isPaused) { clearInterval(state.timer); } else { updateSlide(); state.timer = setInterval(updateSlide, state.interval); } }
    function toggleFullscreen() { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => { alert(`無法進入全螢幕模式: ${err.message}`); }); } else { if (document.exitFullscreen) { document.exitFullscreen(); } } }
    function startSlideshow() { if (state.timer) clearInterval(state.timer); if (state.images.length === 0) return; state.currentIndex = 0; const firstImageUrl = `images/${state.images[state.currentIndex]}`; preloadImage(firstImageUrl).then(() => { imageElements[0].src = firstImageUrl; imageElements[0].classList.add('active'); updateBackground(firstImageUrl); state.isTransitioning = false; if (!state.isPaused) { setTimeout(() => { state.timer = setInterval(updateSlide, state.interval); }, state.animationDuration + 100); } }); }
    
    function handleSettings() {
        menuToggle.addEventListener('click', () => settingsPanel.classList.toggle('visible'));
        intervalSlider.addEventListener('input', (e) => intervalValue.textContent = e.target.value);
        intervalSlider.addEventListener('change', (e) => { state.interval = parseInt(e.target.value, 10) * 1000; resetTimer(); });
        
        
        document.querySelectorAll('.options-group').forEach(group => {
            group.addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (!button) return;

                const currentActive = group.querySelector('button.active');
                if (currentActive) currentActive.classList.remove('active');
                button.classList.add('active');

                moveHighlight(button);

                const groupId = group.id;
                const value = button.dataset.value;

                switch(groupId) {
                    case 'transition-options':
                        state.transition = value;
                        slideshowContainer.className = `transition-${value}`;
                        break;
                    case 'playback-options':
                        state.playbackMode = value;
                        break;
                    case 'music-options':
                        if (value === 'on') {
                            backgroundMusic.play().catch(error => console.log('Music playback failed.', error));
                        } else {
                            backgroundMusic.pause();
                        }
                        break;
                    case 'background-options':
                        state.background = value;
                        document.body.className = `bg-${value}`;
                        if (state.background === 'blur' && state.images[state.currentIndex]) {
                            updateBackground(`images/${state.images[state.currentIndex]}`);
                        } else {
                            backgroundElements.forEach(el => el.classList.remove('active'));
                        }
                        break;
                }
            });
        });

        showClockCheckbox.addEventListener('change', (e) => { if (e.target.checked) { clockContainer.classList.add('visible'); updateClock(); state.clockTimer = setInterval(updateClock, 1000); } else { clockContainer.classList.remove('visible'); clearInterval(state.clockTimer); } });
        showLogoCheckbox.addEventListener('change', (e) => { if (e.target.checked) { logoContainer.classList.add('visible'); } else { logoContainer.classList.remove('visible'); } });
    }

    async function init() {
        try {
            state.animationDuration = getCssVariable('--animation-duration');
            const response = await fetch('images.json');
            if (!response.ok) throw new Error('Cannot load images.json');
            state.images = await response.json();
            document.body.className = `bg-${state.background}`;
            slideshowContainer.className = `transition-${state.transition}`;
            handleSettings();
            startSlideshow();
            window.addEventListener('keydown', handleKeyDown);

            
            setTimeout(() => {
                document.querySelectorAll('.options-group').forEach(group => {
                    const activeButton = group.querySelector('button.active');
                    if (activeButton) {
                        moveHighlight(activeButton);
                    }
                });
            }, 100);

        } catch (error) {
            console.error('Initialization failed:', error);
            slideshowContainer.innerHTML = '<p style="color:white; font-size: 24px;">無法載入照片清單</p>';
        }
    }

    init();
});