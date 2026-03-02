from playwright.sync_api import sync_playwright
import time
import os

def capture_zones():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--use-gl=angle', '--use-angle=gl', '--headless'])
        page = browser.new_page()
        page.goto('http://localhost:5173')
        page.wait_for_selector('canvas')
        time.sleep(3)  # Wait for initial render

        # Define approximate scroll positions for each zone (assuming 0-6000m mapped to scroll height)
        # Using a fixed scroll height for testing
        zones = {
            "cultivation": 0,
            "rainforest": 1500,
            "moorland": 3000,
            "alpine": 4500,
            "arctic": 5800
        }

        # Need to scroll the page. The actual app maps window scroll to altitude.
        for name, altitude in zones.items():
            # In the app, 0-6000 altitude corresponds to document.body.scrollHeight.
            # We will evaluate a script to scroll.
            # Usually scroll Y is proportional to altitude. Let's just scroll to fraction of page.
            fraction = altitude / 6000.0
            page.evaluate(f"window.scrollTo(0, document.body.scrollHeight * {fraction})")
            time.sleep(2) # Wait for fade/scroll
            page.screenshot(path=f"{name}.png")

        browser.close()

if __name__ == "__main__":
    capture_zones()
