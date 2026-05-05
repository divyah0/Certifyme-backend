from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import uuid

app = Flask(__name__)
CORS(app)

# ================= DB =================
def get_db():
    return sqlite3.connect("database.db")

def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT,
        email TEXT UNIQUE,
        password TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        duration TEXT,
        start_date TEXT,
        description TEXT,
        skills TEXT,
        category TEXT,
        future_opportunities TEXT,
        max_applicants TEXT
    )
    """)

    conn.commit()
    conn.close()

init_db()

# ================= AUTH =================

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")

    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute("INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
                    (full_name, email, password))
        conn.commit()
        return jsonify({"msg": "created"}), 201
    except:
        return jsonify({"error": "User already exists"}), 400


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE email=? AND password=?", (email, password))
    user = cur.fetchone()

    if user:
        token = str(uuid.uuid4())
        return jsonify({"token": token}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401


# ================= OPPORTUNITIES =================

@app.route("/opportunities", methods=["GET"])
def get_opportunities():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM opportunities")
    rows = cur.fetchall()

    result = []
    for r in rows:
        result.append({
            "id": r[0],
            "name": r[2],
            "duration": r[3],
            "start_date": r[4],
            "description": r[5]
        })

    return jsonify(result)


@app.route("/opportunities", methods=["POST"])
def add_opportunity():
    data = request.json

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    INSERT INTO opportunities 
    (user_id, name, duration, start_date, description, skills, category, future_opportunities, max_applicants)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        1,
        data.get("name"),
        data.get("duration"),
        data.get("start_date"),
        data.get("description"),
        data.get("skills"),
        data.get("category"),
        data.get("future_opportunities"),
        data.get("max_applicants")
    ))

    conn.commit()
    return jsonify({"msg": "added"}), 201


@app.route("/opportunities/<int:id>", methods=["DELETE"])
def delete_opportunity(id):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("DELETE FROM opportunities WHERE id=?", (id,))
    conn.commit()

    return jsonify({"msg": "deleted"}), 200

@app.route("/opportunities/<int:id>", methods=["PUT"])
def update_opportunity(id):
    data = request.json

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    UPDATE opportunities
    SET name=?, duration=?, start_date=?, description=?, skills=?, category=?, future_opportunities=?, max_applicants=?
    WHERE id=?
    """, (
        data.get("name"),
        data.get("duration"),
        data.get("start_date"),
        data.get("description"),
        data.get("skills"),
        data.get("category"),
        data.get("future_opportunities"),
        data.get("max_applicants"),
        id
    ))

    conn.commit()
    return jsonify({"msg": "updated"}), 200


# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=True)