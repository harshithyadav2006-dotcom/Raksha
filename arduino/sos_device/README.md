# Arduino SOS Device — Raksha Nexus

This directory contains the Python bridge server that connects the Raksha Nexus web app to the Arduino hardware SOS device (GSM module for SMS + calls).

## How It Works

```
[Women Safety Page]
    │  SOS Button pressed (or shake detected)
    │  Countdown reaches 0
    ▼
[useSosArduino hook]  ──POST /sos──►  [server.py on localhost:5000]
                                              │
                                              │ Serial: "SOS,lat,lng\n"
                                              ▼
                                       [Arduino (COM8)]
                                              │
                                    ┌─────────┴─────────┐
                                    ▼                   ▼
                               GSM SMS              Voice Call
                           (to guardians)        (to first contact)
```

## Setup

### 1. Install Python dependencies

```bash
cd arduino/sos_device
pip install -r requirements.txt
```

### 2. Connect your Arduino

- Plug Arduino into **COM8** (or update `server.py` to your port)
- Ensure the Arduino sketch reads serial and handles `SOS,lat,lng` commands

### 3. Run the bridge server

```bash
python server.py
```

Server starts at `http://localhost:5000`

| Endpoint      | Method | Description                        |
|---------------|--------|------------------------------------|
| `/health`     | GET    | Returns Arduino connection status  |
| `/sos`        | POST   | Sends SOS command to Arduino       |

### 4. Arduino Serial Protocol

The server sends:
```
SOS,12.9716,77.5946\n
```

Your Arduino sketch should:
1. Read the serial line
2. Parse the lat/lng
3. Send SMS: `"SOS from Raksha! Location: https://maps.google.com/?q=<lat>,<lng>"`
4. Make a voice call to the stored emergency number

## Frontend Integration

The `useSosArduino` hook in `frontend/src/hooks/useSosArduino.ts`:
- Polls `/health` every 5 seconds → shows **Arduino · COM8** badge on SOS button
- Automatically calls `/sos` with live GPS coordinates when the SOS countdown reaches 0
