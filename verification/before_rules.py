from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:5173/rules")
        page.wait_for_selector("h1")
        # Ensure it loaded
        print(page.title())
        page.screenshot(path="verification/before_rules.png", full_page=True)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
