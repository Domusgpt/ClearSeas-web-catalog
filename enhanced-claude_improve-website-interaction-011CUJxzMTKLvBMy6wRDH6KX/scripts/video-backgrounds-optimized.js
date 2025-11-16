/**
 * Optimized Video Background Manager
 * Aggressive performance optimization
 */

(function() {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

    // Disable videos on low-end devices or reduced motion
    if (prefersReducedMotion || isLowEndDevice) {
        console.log('Video backgrounds disabled for performance');
        document.querySelectorAll('.video-background').forEach(bg => {
            bg.style.display = 'none';
        });
        return;
    }

    const VideoManager = {
        videos: [],
        observer: null,
        maxSimultaneousVideos: 2, // Only play 2 videos at a time

        init() {
            this.setupIntersectionObserver();
            this.initializeVideos();
            this.setupVisibilityHandler();
        },

        setupIntersectionObserver() {
            if (!('IntersectionObserver' in window)) {
                return; // Don't load videos if no IntersectionObserver
            }

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const video = entry.target;

                    if (entry.isIntersecting) {
                        this.loadAndPlayVideo(video);
                    } else {
                        // Pause videos that are out of view
                        video.pause();
                    }
                });
            }, {
                root: null,
                rootMargin: '50px', // Reduced from 100px
                threshold: 0.1
            });
        },

        initializeVideos() {
            const videoElements = document.querySelectorAll('.video-background video');

            videoElements.forEach(video => {
                // Optimize video settings
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                video.preload = 'none'; // Don't preload anything
                video.setAttribute('playbackRate', '1.0');

                this.videos.push(video);

                if (this.observer) {
                    this.observer.observe(video);
                }

                // Error handling
                video.addEventListener('error', () => {
                    console.warn('Video failed to load');
                    video.closest('.video-background')?.remove();
                }, { once: true });
            });
        },

        loadAndPlayVideo(video) {
            const src = video.dataset.src;
            if (!src || video.src) return;

            // Check if we're already playing too many videos
            const playingCount = this.videos.filter(v => !v.paused).length;
            if (playingCount >= this.maxSimultaneousVideos) {
                return; // Don't start another video
            }

            video.src = src;
            video.load();

            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Silently fail - don't retry
                    console.log('Video autoplay blocked');
                });
            }
        },

        setupVisibilityHandler() {
            // Pause ALL videos when page is hidden
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.videos.forEach(v => v.pause());
                } else {
                    // Only resume videos in viewport
                    this.videos.forEach(v => {
                        const rect = v.getBoundingClientRect();
                        const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
                        if (inViewport && v.src) {
                            v.play().catch(() => {});
                        }
                    });
                }
            });
        }
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => VideoManager.init());
    } else {
        VideoManager.init();
    }

})();
