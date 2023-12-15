from app import create_embedding
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route("/ping")
def ping():
    return "pong"

@app.route("/embeddings", methods=["POST"])
def embeddings():
    data = request.json
    return jsonify({
        "embeddings": create_embedding(data["text"]).tolist()
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
