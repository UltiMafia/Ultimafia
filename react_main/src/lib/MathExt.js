export function clamp(x, lower, upper) {
    return Math.min(upper, Math.max(lower, x));
}