from playwright.sync_api import sync_playwright

def verify_shortcut():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            print("Navigating to home page...")
            page.goto("http://localhost:3008")

            # Wait for search input
            print("Waiting for search input...")
            search_input = page.get_by_placeholder("Search articles, CVEs, or software...")
            search_input.wait_for(state="visible")

            # Press shortcut
            print("Pressing shortcut (Meta+K)...")
            page.keyboard.press("Meta+K")

            # Verify input is focused
            print("Verifying input is focused...")
            is_focused = search_input.evaluate("el => document.activeElement === el")
            if not is_focused:
                 # Try Control+K for Linux/Windows simulation if Meta+K fails or environment differences
                 print("Meta+K didn't focus, trying Control+K...")
                 page.keyboard.press("Control+K")
                 is_focused = search_input.evaluate("el => document.activeElement === el")

            assert is_focused, "Search input was not focused after pressing shortcut"

            # Take screenshot of focused state
            print("Taking screenshot of focused state...")
            page.screenshot(path="verification_focused.png")

            print("Verification successful!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification_error_shortcut.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_shortcut()
