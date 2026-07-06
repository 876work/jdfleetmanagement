/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    navy: "#0F2E66",
                    gold: "#997B20",
                    deep: "#071B3D",
                    soft: "#EAF0F8",
                    highlight: "#C8A84A",
                    tint: "#F7F3E8",
                    neutral: "#DDD3B5",
                    text: "#111827",
                    slate: "#475569",
                    border: "#E5E7EB",
                    success: "#15803D",
                    warning: "#B45309",
                    error: "#B91C1C",
                },
            },
        },
    },
    plugins: [],
}
