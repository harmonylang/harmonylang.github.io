document.addEventListener("DOMContentLoaded", function (e) {
    const elements = document.querySelectorAll('h1');

    for (const el of elements) {
        const observer = new IntersectionObserver(
            ([e]) => {e.target.classList.toggle("is-pinned", e.intersectionRatio < 1)},
            { threshold: [1] }
        );

        observer.observe(el);
    }
});