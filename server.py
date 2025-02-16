from flask import Flask, request, Response, redirect, url_for
import json
import os
import survivor_database as db

app = Flask(__name__,
            static_url_path='/s/',
            static_folder='static')
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

def add_vote_events(conn, content):
    cursor = conn.cursor();
    episode = content["episode"]
    player = content["player"]
    for vote in content["votes"]:
        event_type = vote["event_type"]
        survivor = vote["survivor"]
        sql_str = "INSERT INTO events (Episode, Player, EventName, Survivor) VALUES (?,?,?,?);"
        conn.execute(sql_str, (episode, player, event_type, survivor))
    conn.commit();


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


@app.route('/submit_votes', methods=['POST'])
def submit_votes():
    content = request.json
    conn = db.initialize(get_db_filename(request))
    add_vote_events(conn, content)
    conn.close()
    response = json.dumps({"status": "ok"})
    return Response(response=response, status=200, mimetype="application/json")
