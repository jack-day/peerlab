/** @module */
/** Stores animation state of elements */
const animating = new Map();

/**
 * Bind all needed post-animation actions for an animation
 * - Prevents animations overriding one another
 * - Bind actions to animationend when the animation starts
 * - Runs a callback on animation end
 * - Ensures animation class is removed after the animation is ended
 * @returns animationstart event handler
 */
function animationStart(elem, cls, callback) {
    const start = () => {
        const animationEnd = () => {
            if (callback) callback();
            elem.classList.remove(cls);
            animating.delete(elem);
            elem.removeEventListener('animationend', animationEnd);
        };

        animating.set(elem, true);
        elem.addEventListener('animationend', animationEnd);
        elem.removeEventListener('animationstart', start);
    };
    return start;
}

/**
 * Animate an element, launching a callback if provided
 * and removing the animation class when finished
 * @param {HTMLElement} elem Element to animate
 * @param {string} cls Animation CSS class
 * @param {function} [callback] Callback function to run on animation end
 */
export default function animate(elem, cls, callback) {
    const running = animating.get(elem);
    const run = () => {
        elem.addEventListener('animationstart', animationStart(elem, cls, callback));
        elem.classList.add(cls);
    };

    if (running) {
        const interval = setInterval(() => {
            if (!animating.has(elem)) {
                clearInterval(interval);
                run();
            }
        }, 100);
    } else {
        run();
    }
}
