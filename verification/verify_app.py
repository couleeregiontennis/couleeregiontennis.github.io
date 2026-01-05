from playwright.sync_api import sync_playwright

def verify_app_loads(page):
    page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

    try:
        page.goto("http://localhost:5173", timeout=10000)
        page.wait_for_selector('h1', timeout=10000)
    except Exception as e:
        print(f"Error waiting for selector: {e}")

    page.screenshot(path="verification/app_state.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_app_loads(page)
        finally:
            browser.close()
