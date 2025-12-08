// ===== DOM Elements =====
const youtubeUrlInput = document.getElementById('youtube-url');
const extractBtn = document.getElementById('extract-btn');
const resultSection = document.getElementById('result-section');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Thumbnail images
const thumbMaxres = document.getElementById('thumb-maxres');
const thumbSd = document.getElementById('thumb-sd');
const thumbHq = document.getElementById('thumb-hq');
const thumbMq = document.getElementById('thumb-mq');

// Download buttons
const downloadButtons = document.querySelectorAll('.btn-download');

// ===== YouTube URL Patterns =====
const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
];

// ===== Thumbnail Quality URLs =====
const thumbnailQualities = {
    maxres: 'maxresdefault',
    sd: 'sddefault',
    hq: 'hqdefault',
    mq: 'mqdefault'
};

// ===== Current Video ID =====
let currentVideoId = null;

// ===== Utility Functions =====
function extractVideoId(url) {
    for (const pattern of youtubePatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

function getThumbnailUrl(videoId, quality) {
    return `https://img.youtube.com/vi/${videoId}/${thumbnailQualities[quality]}.jpg`;
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    resultSection.classList.add('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function showLoading() {
    extractBtn.classList.add('loading');
}

function hideLoading() {
    extractBtn.classList.remove('loading');
}

// ===== Image Loading with Fallback =====
function loadThumbnail(imgElement, videoId, quality) {
    const wrapper = imgElement.closest('.thumbnail-wrapper');
    wrapper.classList.add('loading-img');

    const primaryUrl = getThumbnailUrl(videoId, quality);
    const fallbackUrl = getThumbnailUrl(videoId, 'hq');

    imgElement.onload = function () {
        wrapper.classList.remove('loading-img');
    };

    imgElement.onerror = function () {
        // maxresdefault might not exist for all videos, fallback to hqdefault
        if (quality === 'maxres') {
            imgElement.src = fallbackUrl;
        } else {
            wrapper.classList.remove('loading-img');
        }
    };

    imgElement.src = primaryUrl;
}

// ===== Extract Thumbnails =====
function extractThumbnails() {
    const url = youtubeUrlInput.value.trim();

    if (!url) {
        showError('유튜브 영상 URL을 입력해주세요.');
        return;
    }

    const videoId = extractVideoId(url);

    if (!videoId) {
        showError('올바른 유튜브 URL 형식이 아닙니다. 다시 확인해주세요.');
        return;
    }

    hideError();
    showLoading();
    currentVideoId = videoId;

    // Simulate a slight delay for better UX
    setTimeout(() => {
        // Load all thumbnail qualities
        loadThumbnail(thumbMaxres, videoId, 'maxres');
        loadThumbnail(thumbSd, videoId, 'sd');
        loadThumbnail(thumbHq, videoId, 'hq');
        loadThumbnail(thumbMq, videoId, 'mq');

        // Show result section with animation
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        hideLoading();
    }, 500);
}

// ===== Download Thumbnail =====
async function downloadThumbnail(quality) {
    if (!currentVideoId) return;

    const button = document.querySelector(`.btn-download[data-quality="${quality}"]`);
    const originalContent = button.innerHTML;

    button.innerHTML = `
        <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        다운로드 중...
    `;
    button.style.pointerEvents = 'none';

    try {
        // Get the image URL
        const imageUrl = getThumbnailUrl(currentVideoId, quality);

        // Fetch the image
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // Create download link
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `youtube_thumbnail_${currentVideoId}_${quality}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        // Success feedback
        button.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            완료!
        `;
        button.style.background = 'linear-gradient(135deg, #2ed573 0%, #1e90ff 100%)';

        setTimeout(() => {
            button.innerHTML = originalContent;
            button.style.background = '';
            button.style.pointerEvents = '';
        }, 2000);

    } catch (error) {
        // If fetch fails (CORS), open in new tab
        window.open(getThumbnailUrl(currentVideoId, quality), '_blank');

        button.innerHTML = originalContent;
        button.style.pointerEvents = '';
    }
}

// ===== Event Listeners =====
extractBtn.addEventListener('click', extractThumbnails);

youtubeUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        extractThumbnails();
    }
});

// Add paste event for instant extraction
youtubeUrlInput.addEventListener('paste', (e) => {
    // Wait for the paste to complete
    setTimeout(() => {
        const url = youtubeUrlInput.value.trim();
        if (extractVideoId(url)) {
            extractThumbnails();
        }
    }, 100);
});

downloadButtons.forEach(button => {
    button.addEventListener('click', () => {
        const quality = button.dataset.quality;
        downloadThumbnail(quality);
    });
});

// ===== Input Animation =====
youtubeUrlInput.addEventListener('focus', () => {
    youtubeUrlInput.parentElement.style.transform = 'scale(1.02)';
});

youtubeUrlInput.addEventListener('blur', () => {
    youtubeUrlInput.parentElement.style.transform = 'scale(1)';
});

// ===== Spin Animation Style =====
const style = document.createElement('style');
style.textContent = `
    .spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
