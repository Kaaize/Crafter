from playwright.sync_api import sync_playwright

def verify_a11y(page, name, url, bounds):
    print(f"Verifying {name} at {url}...")
    page.goto(url)

    # Wait for map to start loading
    page.wait_for_selector("#map-loading", state="visible")

    # Wait for map loading to finish (wait for it to disappear)
    # If loading fails (e.g. 404 on otmm), it might stay visible or show error.
    # We'll wait a bit. If it fails, we can still test the UI buttons.
    try:
        page.wait_for_selector("#map-loading", state="hidden", timeout=5000)
    except:
        print("Map loading might have failed or is slow, proceeding to check UI...")

    # 1. Verify static buttons by aria-label
    print("Checking static buttons...")
    page.get_by_label("Paste coordinates from clipboard").wait_for(state="visible")
    page.get_by_label("Move floor up").wait_for(state="visible")
    page.get_by_label("Move floor down").wait_for(state="visible")
    page.get_by_label("Zoom in").wait_for(state="visible")
    page.get_by_label("Zoom out").wait_for(state="visible")
    page.get_by_label("Reset view").wait_for(state="visible")
    print("Static buttons verified.")

    # 2. Add a vector and check dynamic delete button
    print("Adding vector...")
    x, y = bounds
    page.fill("#input-x", str(x))
    page.fill("#input-y", str(y))

    # Click 'N' compass button to add vector. use class selector to be safe
    page.click("button.dir-btn.n")

    # 3. Verify dynamic delete button
    # Vector label format: "(x, y) N"
    # Note: The JS uses `parseInt` so inputs are integers.
    vector_label = f"({x}, {y}) N"
    delete_label = f"Delete vector {vector_label}"

    print(f"Checking for delete button with label: '{delete_label}'")

    # Use explicit try-catch to debug if not found
    try:
        delete_btn = page.get_by_label(delete_label)
        delete_btn.wait_for(state="visible", timeout=2000)

        # Also check title attribute
        title = delete_btn.get_attribute("title")
        if title != "Delete vector":
            raise Exception(f"Expected title 'Delete vector', got '{title}'")

        print("Dynamic delete button verified.")
    except Exception as e:
        print(f"Failed to verify delete button: {e}")
        # Take a screenshot to debug
        page.screenshot(path=f"verification/{name}_debug.png")
        raise e

    # Screenshot
    page.screenshot(path=f"verification/{name}_a11y.png")
    print(f"Verification for {name} complete.")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()

    # Johto Bounds: 1597, 29862 to 4075, 31480. Use 2000, 30000.
    try:
        verify_a11y(page, "FinderJohto", "http://localhost:8000/FinderJohto.html", (2000, 30000))
    except Exception as e:
        print(f"FinderJohto failed: {e}")

    # Kanto Bounds: GLOBAL_OFFSET_X = 2816; GLOBAL_OFFSET_Y = 3136. Use 3000, 3500.
    try:
        verify_a11y(page, "FinderKanto", "http://localhost:8000/FinderKanto.html", (3000, 3500))
    except Exception as e:
        print(f"FinderKanto failed: {e}")

    browser.close()
