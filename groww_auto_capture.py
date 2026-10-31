import base64
import json
import math
import os
import shutil
import socket
import struct
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

import requests
import websocket


# ============================================================
# CONFIGURATION
# ============================================================

DEBUG_HOST = "127.0.0.1"
DEBUG_PORT = 9222

GROWW_URL = "https://groww.in/charts/indices/nifty"
GROWW_HOST = "websocket.groww.in"

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = BASE_DIR / "groww_ws_messages.jsonl"
CHROME_PROFILE = BASE_DIR / "chrome_debug_profile"

STARTUP_TIMEOUT = 45
NETWORK_TIMEOUT = 5


# ============================================================
# CHROME DISCOVERY AND AUTO-LAUNCH
# ============================================================

def debug_endpoint_available():
    """Check whether Chrome's remote debugging endpoint responds."""
    try:
        response = requests.get(
            f"http://{DEBUG_HOST}:{DEBUG_PORT}/json/version",
            timeout=2,
        )
        return response.ok
    except requests.RequestException:
        return False


def find_chrome():
    """Find Chrome on Windows, or use PATH on other systems."""
    candidates = []

    if sys.platform == "win32":
        candidates.extend([
            os.path.expandvars(
                r"%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"
            ),
            os.path.expandvars(
                r"%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe"
            ),
            os.path.expandvars(
                r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
            ),
        ])

        for candidate in candidates:
            if candidate and Path(candidate).is_file():
                return candidate

        return shutil.which("chrome") or shutil.which("chrome.exe")

    for name in ("google-chrome", "google-chrome-stable", "chromium",
                 "chromium-browser"):
        executable = shutil.which(name)
        if executable:
            return executable

    return None


def launch_debug_chrome():
    """Start a separate Chrome instance with remote debugging enabled."""
    chrome = find_chrome()

    if not chrome:
        raise RuntimeError(
            "Google Chrome was not found. Install Chrome or edit find_chrome()."
        )

    CHROME_PROFILE.mkdir(parents=True, exist_ok=True)

    command = [
        chrome,
        f"--remote-debugging-port={DEBUG_PORT}",
        f"--user-data-dir={CHROME_PROFILE}",
        "--no-first-run",
        "--no-default-browser-check",
        GROWW_URL,
    ]

    print("Launching debugging Chrome...")
    print("Chrome profile:", CHROME_PROFILE)

    subprocess.Popen(
        command,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    deadline = time.monotonic() + STARTUP_TIMEOUT

    while time.monotonic() < deadline:
        if debug_endpoint_available():
            print("Chrome debugging endpoint is ready.")
            return

        time.sleep(0.5)

    raise TimeoutError(
        "Chrome debugging did not start within "
        f"{STARTUP_TIMEOUT} seconds."
    )


def ensure_debug_chrome():
    """Reuse a running debugging Chrome or start a new one."""
    if debug_endpoint_available():
        print("Using existing Chrome debugging session.")
        return

    # Port may already be occupied by a process that is not Chrome.
    with socket.socket() as sock:
        try:
            sock.bind((DEBUG_HOST, DEBUG_PORT))
        except OSError as exc:
            raise RuntimeError(
                f"Port {DEBUG_PORT} is occupied, but the Chrome debugging "
                "endpoint is unavailable. Close the conflicting process "
                "or change DEBUG_PORT."
            ) from exc

    launch_debug_chrome()


# ============================================================
# FIND THE GROW W TAB
# ============================================================

def get_groww_tab():
    response = requests.get(
        f"http://{DEBUG_HOST}:{DEBUG_PORT}/json/list",
        timeout=NETWORK_TIMEOUT,
    )
    response.raise_for_status()

    tabs = response.json()

    # Prefer the exact NIFTY chart tab.
    for tab in tabs:
        parsed = urlparse(tab.get("url", ""))

        if (
            tab.get("type") == "page"
            and parsed.hostname
            and parsed.hostname.lower().endswith("groww.in")
            and "/charts/indices/nifty" in parsed.path
            and tab.get("webSocketDebuggerUrl")
        ):
            return tab

    # Otherwise reuse any Groww page.
    for tab in tabs:
        parsed = urlparse(tab.get("url", ""))

        if (
            tab.get("type") == "page"
            and parsed.hostname
            and parsed.hostname.lower().endswith("groww.in")
            and tab.get("webSocketDebuggerUrl")
        ):
            return tab

    raise RuntimeError(
        "No Groww page was found in the debugging Chrome. "
        "Open the NIFTY chart in that Chrome window and log in if required."
    )


# ============================================================
# GENERIC PROTOBUF FIELD INSPECTOR
# Diagnostic only: field meanings require the actual schema.
# ============================================================

def parse_varint(data, pos):
    value = 0
    shift = 0

    while pos < len(data) and shift < 70:
        byte = data[pos]
        pos += 1
        value |= (byte & 0x7F) << shift

        if not byte & 0x80:
            return value, pos

        shift += 7

    raise ValueError("Invalid or incomplete varint")


def decode_protobuf_fields(data, depth=0):
    if depth > 4:
        return

    pos = 0
    indent = "  " * depth

    while pos < len(data):
        start = pos

        try:
            tag, pos = parse_varint(data, pos)
            field_number = tag >> 3
            wire_type = tag & 7

            if field_number == 0:
                break

            if wire_type == 0:
                value, pos = parse_varint(data, pos)
                print(
                    f"{indent}field={field_number} "
                    f"wire=varint value={value}"
                )

            elif wire_type == 1:
                if pos + 8 > len(data):
                    break

                chunk = data[pos:pos + 8]
                pos += 8

                uint_value = int.from_bytes(chunk, "little")
                double_value = struct.unpack("<d", chunk)[0]
                double_text = (
                    repr(double_value)
                    if math.isfinite(double_value)
                    else "non-finite"
                )

                print(
                    f"{indent}field={field_number} "
                    f"wire=fixed64 uint64={uint_value} "
                    f"double={double_text}"
                )

            elif wire_type == 2:
                length, pos = parse_varint(data, pos)

                if pos + length > len(data):
                    break

                chunk = data[pos:pos + length]
                pos += length

                text_value = chunk.decode("utf-8", errors="replace")

                print(
                    f"{indent}field={field_number} "
                    f"wire=bytes length={length} "
                    f"text={text_value!r} hex={chunk.hex()}"
                )

                # Length-delimited fields are not always nested messages.
                if depth < 4 and chunk:
                    decode_protobuf_fields(chunk, depth + 1)

            elif wire_type == 5:
                if pos + 4 > len(data):
                    break

                chunk = data[pos:pos + 4]
                pos += 4
                float_value = struct.unpack("<f", chunk)[0]

                print(
                    f"{indent}field={field_number} "
                    f"wire=fixed32 float={float_value}"
                )

            else:
                print(
                    f"{indent}Unsupported wire type={wire_type} "
                    f"at offset={start}"
                )
                break

        except (ValueError, struct.error, IndexError):
            print(f"{indent}Could not parse at offset={start}")
            break


# ============================================================
# INSPECT A CAPTURED FRAME
# ============================================================

def inspect_frame(raw):
    print("\n" + "=" * 72)
    print(
        "Received:",
        datetime.now().astimezone().isoformat(
            timespec="milliseconds"
        ),
    )
    print("Frame bytes:", len(raw))

    separator = raw.find(b"\r\n\n")

    if separator == -1:
        print("No recognized Groww frame separator.")
        print("Raw hex:", raw.hex(" "))
        return

    header = raw[:separator].decode("ascii", errors="replace")
    body = raw[separator + 3:]

    print("Header:", header)

    if not body:
        print("Empty message body.")
        return

    symbol_length = body[0]
    symbol_end = 1 + symbol_length

    if (
        symbol_length > 0
        and symbol_end <= len(body)
        and all(32 <= b <= 126 for b in body[1:symbol_end])
    ):
        symbol = body[1:symbol_end].decode("ascii")
        print("Instrument candidate:", symbol)

        remaining = body[symbol_end:]

        if remaining.endswith(b"\r\n"):
            remaining = remaining[:-2]

        print("Remaining payload hex:", remaining.hex(" "))

        if remaining:
            print("Generic binary field inspection:")
            decode_protobuf_fields(remaining)

    else:
        print("Unrecognized body format.")
        print("Body hex:", body.hex(" "))


# ============================================================
# CONNECT TO CHROME DEVTOOLS
# ============================================================

def connect_devtools(tab):
    debugger_url = tab["webSocketDebuggerUrl"]

    # Older websocket-client versions support suppress_origin.
    return websocket.create_connection(
        debugger_url,
        timeout=10,
        suppress_origin=True,
    )


def send_command(devtools, method, params=None):
    """Send a CDP command and wait for its matching response."""
    command_id = 1

    devtools.send(json.dumps({
        "id": command_id,
        "method": method,
        "params": params or {},
    }))

    while True:
        response = json.loads(devtools.recv())

        if response.get("id") == command_id:
            if "error" in response:
                raise RuntimeError(
                    f"CDP command {method} failed: {response['error']}"
                )

            return response


# ============================================================
# CAPTURE INCOMING GROW W WEBSOCKET FRAMES
# ============================================================

def capture_messages():
    tab = get_groww_tab()

    print("Groww tab:", tab.get("url"))
    print("Connecting to Chrome DevTools...")

    devtools = connect_devtools(tab)
    websocket_urls = {}

    try:
        send_command(devtools, "Page.enable")
        send_command(devtools, "Network.enable")

        print("Network monitoring enabled.")
        print("Automatically refreshing the Groww chart...")

        # Trigger a reload without waiting for its response.
        # This lets the main capture loop receive WebSocket events.
        devtools.send(json.dumps({
        "id": 99,
        "method": "Page.reload",
        "params": {
            "ignoreCache": True
        }
        }))

        devtools.settimeout(None)

        print("Connected to Chrome DevTools.")
        print("Filtering host:", GROWW_HOST)
        print("Capturing incoming binary frames.")
        print("Saving to:", OUTPUT_FILE)
        print("Press Ctrl+C to stop.\n")

        with OUTPUT_FILE.open("a", encoding="utf-8") as logfile:
            while True:
                event = json.loads(devtools.recv())

                method = event.get("method")
                params = event.get("params", {})

                if method == "Network.webSocketCreated":
                    request_id = params.get("requestId")
                    url = params.get("url", "")

                    if GROWW_HOST in url.lower():
                        websocket_urls[request_id] = url
                        print("\nGroww WebSocket detected:", url)

                elif method == "Network.webSocketFrameError":
                    request_id = params.get("requestId")

                    if request_id in websocket_urls:
                        print(
                            "WebSocket frame error:",
                            params.get("errorMessage", "Unknown error"),
                        )

                elif method == "Network.webSocketClosed":
                    request_id = params.get("requestId")

                    if request_id in websocket_urls:
                        print("Groww WebSocket closed.")
                        websocket_urls.pop(request_id, None)

                elif method == "Network.webSocketFrameReceived":
                    request_id = params.get("requestId")

                    if request_id not in websocket_urls:
                        continue

                    frame = params.get("response", {})
                    opcode = frame.get("opcode")
                    payload_data = frame.get("payloadData", "")

                    # Capture binary frames only.
                    if opcode != 2:
                        continue

                    try:
                        raw = base64.b64decode(
                            payload_data,
                            validate=True,
                        )
                    except (ValueError, TypeError) as error:
                        print("Could not decode frame:", error)
                        continue

                    timestamp = datetime.now().astimezone().isoformat(
                        timespec="milliseconds"
                    )

                    record = {
                        "received_at": timestamp,
                        "url": websocket_urls[request_id],
                        "opcode": opcode,
                        "byte_length": len(raw),
                        "payload_base64": base64.b64encode(
                            raw
                        ).decode("ascii"),
                        "payload_hex": raw.hex(),
                    }

                    logfile.write(json.dumps(record) + "\n")
                    logfile.flush()

                    # Forward live frame to Personal Dashboard
                    try:
                        requests.post(
                            "http://127.0.0.1:3000/api/tick",
                            json={"payload_base64": record["payload_base64"]},
                            timeout=0.05,
                        )
                    except Exception:
                        pass

                    inspect_frame(raw)

    finally:
        devtools.close()


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("GROWW WEBSOCKET AUTO CAPTURE")
    print("=" * 60)

    ensure_debug_chrome()

    # Allow Chrome to finish loading the Groww page.
    deadline = time.monotonic() + STARTUP_TIMEOUT

    while True:
        try:
            tab = get_groww_tab()
            break
        except (requests.RequestException, RuntimeError):
            if time.monotonic() >= deadline:
                raise RuntimeError(
                    "Groww tab did not become available. "
                    "Check the Chrome window and log in if necessary."
                )
            time.sleep(1)

    print("Groww page found:", tab.get("url"))

    # Give the page time to load and establish its market-data connection.
    time.sleep(5)

    capture_messages()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nCapture stopped by user.")
    except Exception as error:
        print(f"\nERROR: {error}")
        sys.exit(1)