export function initScrollAnimations(): void {
  if (typeof window === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      el.classList.add('visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = (entry.target as HTMLElement).style.animationDelay;
          if (delay) {
            const ms = parseInt(delay) || 0;
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, ms);
          } else {
            entry.target.classList.add('visible');
          }
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  document.querySelectorAll('.animate-on-scroll').forEach((el) => {
    observer.observe(el);
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initScrollAnimations);
  document.addEventListener('astro:page-load', initScrollAnimations);
}
