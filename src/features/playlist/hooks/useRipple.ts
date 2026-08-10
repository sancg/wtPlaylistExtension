import { useRef } from 'react';

export function useRipple() {
  const containerRef = useRef<HTMLButtonElement | null>(null);

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('Ripple triggered');

    const button = event.currentTarget;
    if (!button) return;

    const rect = button.getBoundingClientRect();

    const ripple = document.createElement('span');

    const size = Math.max(rect.width, rect.height);

    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    ripple.className = `
      absolute block rounded-full
      bg-current
      opacity-30
      pointer-events-none
      animate-ripple
      transform-origin
      display block
    `;

    button.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  };

  const createBorderRipple = (event: React.PointerEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    const ripple = document.createElement('span');

    const size = Math.max(rect.width, rect.height) * 0.99;

    // CENTER POSITION
    const x = rect.width / 2 - size / 2;
    const y = rect.height / 2 - size / 2;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    ripple.className = `
    absolute block rounded-full
    border border-current opacity-40
    pointer-events-none
    animate-ripple-border
  `;

    button.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove());
  };

  return { containerRef, createRipple, createBorderRipple };
}
