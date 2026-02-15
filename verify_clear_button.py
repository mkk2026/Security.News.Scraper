from playwright.sync_api import sync_playwright

def verify_clear_button():
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

            # Type something
            print("Typing search query...")
            search_input.fill("test query")

            # Wait for clear button
            print("Waiting for clear button...")
            clear_button = page.get_by_label("Clear search")
            clear_button.wait_for(state="visible")

            # Take screenshot with text and button
            print("Taking screenshot with text...")
            page.screenshot(path="verification_with_text.png")

            # Click clear button
            print("Clicking clear button...")
            clear_button.click()

            # Verify input is empty
            print("Verifying input is empty...")
            assert search_input.input_value() == ""

            # Take screenshot after clearing
            print("Taking screenshot after clearing...")
            page.screenshot(path="verification_cleared.png")

            print("Verification successful!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification_error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_clear_button()
