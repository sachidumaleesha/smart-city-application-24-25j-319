import os
import base64
import json
from flask import Blueprint, request, jsonify
import google.generativeai as genai
import requests
from datetime import datetime

anpr_bp = Blueprint('anpr', __name__)

# ✅ Registered Vehicles + Drivers + WhatsApp Numbers
registered_vehicles = [
    {
        "driver_name": "Driver One",
        "vehicle_number": "9024",
        "whatsapp_number": "94784522850"
    },
    {
        "driver_name": "Driver Two",
        "vehicle_number": "9597",
        "whatsapp_number": "94784522840"
    }
]

# ✅ Parking Sessions { vehicle_number: entry_time }
parking_sessions = {}

# ✅ Parking Rate (Per Hour)
PARKING_RATE_PER_HOUR = 100  # Set your price here

# ✅ Gemini API and ESP32 setup
GEMINI_API_KEY = "AIzaSyAeHm3GEPbEUYigXAf1p9gfO2mQrbDlycQ"
ESP32_IP_ADDRESS = "http://192.168.1.13"  # ESP32 IP Address

# ✅ Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash-latest")

@anpr_bp.route("/detect_plate", methods=["POST"])
def detect_plate():
    try:
        data = request.json
        base64_image = data.get("image")

        if not base64_image:
            return jsonify({"status": "failed", "message": "No image provided"}), 400

        # Decode image
        image_data = base64.b64decode(base64_image.split(",")[1])

        # Process with Gemini
        number_result = get_number_plate_number(image_data)

        if not number_result or "number" not in number_result:
            return jsonify({"status": "failed", "message": "No number detected"}), 200

        # Extract detected plate number
        plate_json = json.loads(number_result)
        detected_number = plate_json["number"]

        print(f"🔍 Detected Plate Number: {detected_number}")

        # Check registered vehicles
        matched_driver = next(
            (driver for driver in registered_vehicles if driver["vehicle_number"] == detected_number),
            None
        )

        now = datetime.now()
        entry_time_str = now.strftime('%Y-%m-%d %H:%M:%S')

        if not matched_driver:
            # ❌ Unauthorized vehicle
            return jsonify({
                "status": "unauthorized",
                "message": "Unauthorized vehicle detected",
                "plate_number": detected_number
            }), 200

        vehicle_number = matched_driver["vehicle_number"]
        driver_name = matched_driver["driver_name"]
        whatsapp_number = matched_driver["whatsapp_number"]

        # ✅ Entry Logic (Vehicle not in sessions)
        if vehicle_number not in parking_sessions:
            parking_sessions[vehicle_number] = now  # Save entry time
            print(f"📝 Entry time recorded for {vehicle_number}: {entry_time_str}")

            # Open gate and send entry message
            open_gate()
            send_whatsapp_entry(whatsapp_number, driver_name, entry_time_str)

            return jsonify({
                "status": "success",
                "message": f"Authorized: Welcome {driver_name}",
                "plate_number": detected_number,
                "driver": driver_name,
                "entry_time": entry_time_str
            }), 200

        # ✅ Exit Logic (Vehicle already inside)
        entry_time = parking_sessions.pop(vehicle_number)
        duration = now - entry_time
        hours_spent = max(1, int(duration.total_seconds() // 3600))  # Minimum 1 hour billing
        bill_amount = hours_spent * PARKING_RATE_PER_HOUR

        print(f"💰 Exit detected. Duration: {hours_spent} hour(s). Bill: Rs.{bill_amount}")

        # Open gate and send bill message
        open_gate()
        send_whatsapp_exit(whatsapp_number, driver_name, entry_time.strftime('%Y-%m-%d %H:%M:%S'), entry_time_str, hours_spent, bill_amount)

        return jsonify({
            "status": "success",
            "message": f"Exit Successful for {driver_name}",
            "plate_number": detected_number,
            "driver": driver_name,
            "entry_time": entry_time.strftime('%Y-%m-%d %H:%M:%S'),
            "exit_time": entry_time_str,
            "duration_hours": hours_spent,
            "bill": bill_amount
        }), 200

    except Exception as e:
        print(f"❌ ERROR in detect_plate: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

def get_number_plate_number(image_data):
    prompt = """
    You will receive an image of a vehicle license plate.
    Read the number plate and extract ONLY the numeric digits.

    Your reply MUST be in JSON format like:
    {
      "number": "XXXX"
    }
    """

    try:
        response = model.generate_content(
            contents=[
                {
                    "role": "user",
                    "parts": [
                        { "text": prompt },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": image_data
                            }
                        }
                    ]
                }
            ],
            generation_config={
                "temperature": 0.2,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 512
            }
        )

        response_text = response.text
        print(f"🔹 Gemini Response:\n{response_text}")

        start_index = response_text.find('{')
        end_index = response_text.find('}') + 1
        json_result = response_text[start_index:end_index]

        return json_result

    except Exception as e:
        print(f"❌ ERROR in get_number_plate_number: {str(e)}")
        return None

def open_gate():
    try:
        gate_url = f"{ESP32_IP_ADDRESS}/open_gate"
        response = requests.get(gate_url)

        if response.status_code == 200:
            print(f"✅ Gate opened! ESP32 response: {response.json()}")
        else:
            print(f"❌ Failed to open gate. HTTP {response.status_code}")

    except Exception as e:
        print(f"❌ Failed to send gate open request: {str(e)}")

def send_whatsapp_entry(phone_number, driver_name, entry_time):
    try:
        message = (
            f"🚗 Welcome {driver_name}!\n"
            f"✅ Your vehicle has been granted access.\n"
            f"🕒 Entry Time: {entry_time}"
        )

        print(f"📤 Sending WhatsApp entry message to {phone_number}: {message}")

        response = requests.post("http://localhost:3000/api/send-whatsapp-message", json={
            "phoneNumber": phone_number,
            "message": message
        })

        if response.status_code == 200:
            print(f"✅ WhatsApp entry message sent to {phone_number}")
        else:
            print(f"❌ WhatsApp API error on entry: HTTP {response.status_code}")

    except Exception as e:
        print(f"❌ Error sending WhatsApp entry message: {str(e)}")

def send_whatsapp_exit(phone_number, driver_name, entry_time, exit_time, duration_hours, bill_amount):
    try:
        message = (
            f"🚗 Thank you {driver_name}!\n"
            f"🕒 Entry Time: {entry_time}\n"
            f"🕒 Exit Time: {exit_time}\n"
            f"⏳ Duration: {duration_hours} hour(s)\n"
            f"💰 Parking Bill: Rs. {bill_amount}\n"
            f"✅ Please proceed to payment."
        )

        print(f"📤 Sending WhatsApp exit message to {phone_number}: {message}")

        response = requests.post("http://localhost:3000/api/send-whatsapp-message", json={
            "phoneNumber": phone_number,
            "message": message
        })

        if response.status_code == 200:
            print(f"✅ WhatsApp exit message sent to {phone_number}")
        else:
            print(f"❌ WhatsApp API error on exit: HTTP {response.status_code}")

    except Exception as e:
        print(f"❌ Error sending WhatsApp exit message: {str(e)}")
