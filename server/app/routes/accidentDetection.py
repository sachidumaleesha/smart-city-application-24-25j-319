from flask import Blueprint, jsonify

accident_bp = Blueprint("accidentDetection", __name__)

@accident_bp.route("/accident-1", methods=["GET"])
def test1():
    return jsonify({"message": "Login successful"})

@accident_bp.route("/accident-2", methods=["POST"])
def test2():
    return jsonify({"message": "User registered successfully"})
