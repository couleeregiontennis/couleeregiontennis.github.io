from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        # 1. Rules Page
        page.goto("http://localhost:5173/rules")

        # Wait for H1 (Rules header)
        page.wait_for_selector("h1", timeout=10000)

        # Wait for H2 (Section header from Markdown)
        # Note: it might take a moment to fetch and render
        page.wait_for_selector("h2", timeout=10000)

        # Verify content
        content = page.content()
        if "League Coordinator" not in content:
            print("FAILED: League Coordinator text not found")
        else:
            print("PASSED: League Coordinator text found")

        # 2. Ask The Umpire
        # Check button visibility
        ask_button = page.locator("button[aria-label='Ask the Umpire']")
        if ask_button.is_visible():
             print("PASSED: Ask button visible")
        else:
             print("FAILED: Ask button not visible")

        # Click it
        ask_button.click()

        # Check widget visibility
        widget = page.locator(".umpire-widget")
        if widget.is_visible():
            print("PASSED: Widget opened")
        else:
             print("FAILED: Widget did not open")

        # Type query
        page.fill(".umpire-input", "Test question")
        page.click(".umpire-submit")

        # Wait for result (error in this env)
        page.wait_for_selector(".umpire-error", timeout=5000)
        print("PASSED: Error message displayed (expected in dev without backend)")

        page.screenshot(path="verification/after_rules.png", full_page=True)

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error_after.png", full_page=True)
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
