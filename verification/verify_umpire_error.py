from playwright.sync_api import sync_playwright, expect
import time

def verify_umpire_error(page):
    # Capture console logs
    page.on("console", lambda msg: print(f"Console: {msg.text}"))

    # Go to home page
    page.goto('http://localhost:5173/')

    # Wait for the Ask the Umpire button
    button = page.get_by_label("Ask the Umpire")
    expect(button).to_be_visible(timeout=10000)

    # Click it
    button.click()

    # Wait for widget to open
    widget = page.locator(".umpire-widget")
    expect(widget).to_be_visible()

    # Mock network error for the function call
    def handle_route(route):
        print("Aborting route to simulate network error: " + route.request.url)
        route.abort("failed")

    page.route("**/functions/v1/ask-umpire", handle_route)

    # Type a query
    input_box = page.locator(".umpire-input")
    input_box.fill("test query")

    # Click send
    submit_btn = page.locator(".umpire-submit")
    submit_btn.click()

    # Wait for error message
    error_msg = page.locator(".umpire-error")
    expect(error_msg).to_be_visible(timeout=5000)

    # Check text
    text = error_msg.text_content()
    print(f"Error message displayed: {text}")

    expect(error_msg).to_contain_text("Connection blocked")

    # Take screenshot
    page.screenshot(path="/home/jules/verification/umpire-network-error.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.add_init_script("navigator.locks = undefined")

        try:
            verify_umpire_error(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error_state.png")
        finally:
            browser.close()
