import serial
import time
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # needed so the React frontend (localhost:5173) can call this

ser = serial.Serial('COM8', 9600, timeout=2)
time.sleep(2)  # wait for Arduino reset after serial connect

@app.route('/sos', methods=['POST'])
def sos():
    ser.write(b"SOS\n")
    time.sleep(8)  # give time for SMS + call to process
    response = ser.read(ser.inWaiting()).decode(errors='ignore')
    return jsonify({"status": "SOS triggered", "arduino_response": response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
