from flask import Flask, request, Response, redirect, url_for, send_file, abort
import json
import os
import survivor_database as db

app = Flask(__name__,
            static_url_path='/s/',
            static_folder='static')
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


def get_db_filename(request):
    if "db" in request.cookies:
        db_name = request.cookies["db"]
        print("cookies[db] =", db_name)
    else:
        db_name = "real.db"
        print("cookies[db] = <unset> defaulting to", db_name)
    return os.path.join("db", db_name)


@app.route('/')
def index():
    return redirect(url_for('static', filename='standings.html'))


@app.route('/state', methods=['GET'])
def get_state():
    conn = db.initialize(get_db_filename(request))
    as_json = json.dumps(db.fetch_state(conn),
                         indent=4)
    conn.close()
    return Response(response=as_json, status=200, mimetype="application/json")


@app.route('/user_state', methods=['GET'])
def get_user_state():
    conn = db.initialize(get_db_filename(request))
    content = request.cookies
    as_json = json.dumps(db.fetch_user_state(conn, content),
                         indent=4)
    conn.close()
    return Response(response=as_json, status=200, mimetype="application/json")


@app.route('/submit_votes', methods=['POST'])
def submit_votes():
    content = request.json
    conn = db.initialize(get_db_filename(request))
    db.add_vote_events(conn, content)
    conn.close()
    response = json.dumps({"status": "ok"})
    return Response(response=response, status=200, mimetype="application/json")


@app.route('/submit_login', methods=['POST'])
def submit_login():
    content = request.json
    conn = db.initialize(get_db_filename(request))
    result = db.try_login(conn, content)
    conn.close()
    return Response(response=json.dumps(result), status=200, mimetype="application/json")


@app.route('/submit_logout', methods=['POST'])
def submit_logout():
    content = request.json
    cookies = request.cookies
    conn = db.initialize(get_db_filename(request))
    result = db.try_logout(conn, content, cookies)
    conn.close()
    return Response(response=json.dumps(result), status=200, mimetype="application/json")


@app.route('/submit_register', methods=['POST'])
def submit_register():
    content = request.json
    conn = db.initialize(get_db_filename(request))
    result = db.try_register(conn, content)
    conn.close()
    return Response(response=json.dumps(result), status=200, mimetype="application/json")


@app.route('/admin.html', methods=['GET'])
def admin():
    cookies = request.cookies
    conn = db.initialize(get_db_filename(request))
    if db.is_admin(conn, cookies):
        response = send_file("admin.html")
    else:
        response = abort(403)
    conn.close()
    return response


@app.route('/admin_state', methods=['GET'])
def get_admin_state():
    cookies = request.cookies
    conn = db.initialize(get_db_filename(request))
    if db.is_admin(conn, cookies):
        as_json = json.dumps(db.fetch_admin_state(conn),
                             indent=4)
        response = Response(response=as_json, status=200, mimetype="application/json")
    else:
        response = abort(403)
    conn.close()
    return response
