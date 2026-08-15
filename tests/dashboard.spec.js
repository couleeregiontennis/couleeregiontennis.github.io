const { test, expect } = require('@playwright/test');

// Must match the Open-Meteo URL in scripts/dashboard.js.
const OPEN_METEO_URL =
    'https://api.open-meteo.com/v1/forecast?latitude=43.7892&longitude=-91.2511&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FChicago';

// Freeze the browser clock so the (post-season) real schedule still resolves
// the next upcoming match within the 2026 season.
async function freezeAt(page, iso) {
    await page.clock.setFixedTime(new Date(iso));
}

// A live-weather mock whose hourly forecast includes the 5/2026-06-16T18:00 slot.
const FORECAST_PAYLOAD = {
    current: {
        temperature_2m: 70,
        apparent_temperature: 70,
        relative_humidity_2m: 40,
        weather_code: 0,
    },
    hourly: {
        time: ['2026-06-16T18:00'],
        temperature_2m: [75],
        apparent_temperature: [75],
        relative_humidity_2m: [40],
        weather_code: [1], // Partly Cloudy
    },
};

async function mockWeather(page, payload = FORECAST_PAYLOAD, status = 200) {
    await page.route(OPEN_METEO_URL, async route => {
        await route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(payload),
        });
    });
}

test.describe('Home Dashboard', () => {
    test('renders a Week N Matches card with day cards from master_schedule.json', async ({ page }) => {
        await freezeAt(page, '2026-06-16T12:00:00');
        await mockWeather(page);
        await page.goto('/');

        await expect(page.getByRole('heading', { name: /Week \d+ Matches/, level: 3 })).toBeVisible();
        await expect(page.locator('.day-card').first()).toBeVisible();
    });

    test('marks the day-card whose date is today with the today class and TONIGHT header', async ({ page }) => {
        await freezeAt(page, '2026-06-16T12:00:00');
        await mockWeather(page);
        await page.goto('/');

        const todayCard = page.locator('.day-card.today');
        await expect(todayCard).toBeVisible();
        await expect(todayCard.locator('.day-header')).toContainText('TONIGHT');
    });

    test('weather widget shows the forecasted temperature and weather text', async ({ page }) => {
        await freezeAt(page, '2026-06-16T12:00:00');
        await mockWeather(page);
        await page.goto('/');

        const widget = page.locator('#weather-widget');
        await expect(widget).toContainText('75°F');
        await expect(widget).toContainText('Partly Cloudy');
    });
});

test.describe('Weather Widget Fallbacks', () => {
    test('falls back to the cached weather file when Open-Meteo fails', async ({ page }) => {
        await freezeAt(page, '2026-06-16T12:00:00');
        await page.route(OPEN_METEO_URL, route => route.abort());
        await page.goto('/');

        // The cached fallback labels its output with "(Cached ...)".
        await expect(page.locator('#weather-widget')).toContainText(/Cached/i);
    });

    test('shows the absolute fallback with an accuweather link when all sources fail', async ({ page }) => {
        await freezeAt(page, '2026-06-16T12:00:00');
        await page.route(OPEN_METEO_URL, route => route.abort());
        await page.route('**/assets/weather-fallback.json**', route =>
            route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not Found' })
        );
        await page.goto('/');

        const widget = page.locator('#weather-widget');
        await expect(widget).toBeVisible();
        await expect(widget.locator('a[href*="accuweather.com"]')).toBeVisible();
    });
});

test.describe('Dashboard Resilience', () => {
    test('degrades gracefully when a night master schedule returns HTTP 500', async ({ page }) => {
        await freezeAt(page, '2026-06-16T12:00:00');
        await mockWeather(page);

        const errors = [];
        page.on('pageerror', e => errors.push(e.message));

        // Realistic 500: a non-JSON error body. The app must not white-screen.
        await page.route('**/teams/tuesday/schedules/master_schedule.json**', route =>
            route.fulfill({ status: 500, contentType: 'text/html', body: '<h1>500 Internal Server Error</h1>' })
        );

        await page.goto('/');

        // Main page content still renders without an uncaught exception.
        await expect(page.getByRole('heading', { name: 'Teams', level: 1, exact: true })).toBeVisible();
        expect(errors).toEqual([]);
    });
});
