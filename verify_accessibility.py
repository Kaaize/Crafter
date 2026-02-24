import os
from playwright.sync_api import sync_playwright

def verify_accessibility():
    cwd = os.getcwd()
    johto_path = f"file://{cwd}/FinderJohto.html"
    kanto_path = f"file://{cwd}/FinderKanto.html"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print(f"Checking {johto_path}")
        try:
            page.goto(johto_path)

            # Check static buttons
            check_aria_label(page, "#btn-paste", "Paste coordinates from clipboard")
            check_aria_label(page, "#floor-up", "Move floor up")
            check_aria_label(page, "#floor-down", "Move floor down")

            # Verify Zoom In
            zoom_in = page.locator("button[aria-label='Zoom in']")
            if zoom_in.count() > 0:
                print("✅ Zoom In button found with correct aria-label")
            else:
                print("❌ Zoom In button MISSING aria-label")

            # Verify dynamic vector delete button
            # MOCK ENVIRONMENT to allow adding vector without loading map
            page.evaluate("() => { canvas.width = 1000; canvas.height = 1000; GLOBAL_OFFSET_X = 0; GLOBAL_OFFSET_Y = 0; }")

            page.fill("#input-x", "500")
            page.fill("#input-y", "500")
            # Click a direction to add
            page.click(".dir-btn.n") # Click North

            # Now check if delete button exists and has aria-label
            try:
                page.wait_for_selector(".delete-btn", timeout=5000)
                delete_btns = page.locator(".delete-btn")
                count = delete_btns.count()
                print(f"Found {count} delete buttons")

                if count > 0:
                    btn = delete_btns.first
                    label = btn.get_attribute("aria-label")
                    title = btn.get_attribute("title")
                    print(f"Delete button aria-label: {label}")
                    print(f"Delete button title: {title}")

                    if label and "Delete vector" in label and title == "Delete vector":
                        print("✅ Dynamic delete button accessible")
                    else:
                        print("❌ Dynamic delete button NOT accessible")
            except Exception as e:
                print(f"❌ Failed to find delete button: {e}")
                status = page.locator("#status").text_content()
                print(f"Status: {status}")

            # Take screenshot
            page.screenshot(path="verification_johto.png")

            print("-" * 20)

            print(f"Checking {kanto_path}")
            page.goto(kanto_path)
            # Similar checks for Kanto...
            check_aria_label(page, "#btn-paste", "Paste coordinates from clipboard")

            # MOCK ENVIRONMENT
            page.evaluate("() => { canvas.width = 1000; canvas.height = 1000; GLOBAL_OFFSET_X = 0; GLOBAL_OFFSET_Y = 0; }")

            page.fill("#input-x", "500")
            page.fill("#input-y", "500")
            page.click(".dir-btn.s") # Click South

            try:
                page.wait_for_selector(".delete-btn", timeout=5000)
                delete_btns = page.locator(".delete-btn")
                if delete_btns.count() > 0:
                    btn = delete_btns.first
                    label = btn.get_attribute("aria-label")
                    if label and "Delete vector" in label:
                        print("✅ Kanto Dynamic delete button accessible")
                    else:
                        print("❌ Kanto Dynamic delete button NOT accessible")
            except Exception as e:
                print(f"❌ Failed to find Kanto delete button: {e}")
                status = page.locator("#status").text_content()
                print(f"Status: {status}")

            page.screenshot(path="verification_kanto.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

def check_aria_label(page, selector, expected_label):
    el = page.locator(selector)
    if el.count() == 0:
        print(f"❌ Element {selector} not found")
        return

    actual = el.get_attribute("aria-label")
    if actual == expected_label:
        print(f"✅ {selector} has correct aria-label: {actual}")
    else:
        print(f"❌ {selector} has WRONG aria-label: {actual} (Expected: {expected_label})")

if __name__ == "__main__":
    verify_accessibility()
