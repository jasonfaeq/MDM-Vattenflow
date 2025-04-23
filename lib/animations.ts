// Animation durations
export const durations = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
} as const;

// Animation easings
export const easings = {
  // Smooth, natural easing
  default: "cubic-bezier(0.4, 0, 0.2, 1)",
  // Energetic start
  emphasis: "cubic-bezier(0.2, 0, 0, 1)",
  // Gentle ending
  gentle: "cubic-bezier(0.4, 0, 0.6, 1)",
} as const;

// Reusable animation classes
export const animations = {
  // Fade animations
  fadeIn: "animate-in fade-in duration-300",
  fadeOut: "animate-out fade-out duration-200",
  
  // Scale animations
  scaleUp: "animate-in zoom-in-95 duration-200",
  scaleDown: "animate-out zoom-out-95 duration-150",
  
  // Slide animations
  slideInFromRight: "animate-in slide-in-from-right duration-300",
  slideOutToLeft: "animate-out slide-out-to-left duration-200",
  
  // Hover animations
  buttonHover: "hover:scale-[1.02] active:scale-[0.98] transition-all duration-200",
  
  // Loading animations
  pulse: "animate-pulse",
  spin: "animate-spin",
  
  // Page transitions
  pageEnter: "animate-in fade-in slide-in-from-bottom-2 duration-500",
  pageExit: "animate-out fade-out slide-out-to-top-2 duration-200",
} as const; 