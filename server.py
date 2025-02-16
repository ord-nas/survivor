from flask import Flask, request, Response
import json
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
        sql_str = f"""INSERT INTO events (Episode, Player, EventName, Survivor)
                      VALUES ({episode}, "{player}", "{event_type}", "{survivor}");"""
        print(sql_str)
        conn.execute(sql_str)
    conn.commit();

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/list_events', methods=['GET'])
def list_events():
    print("cookies", request.cookies)
    db_filename = request.cookies.get("db", "real.db")
    print("cookies[db] =", db_filename)
    conn = db.initialize(db_filename)
    as_json = json.dumps(db.fetch_data(conn),
                         indent=4)
    conn.close()
    return Response(response=as_json, status=200, mimetype="application/json")


@app.route('/submit_votes', methods=['POST'])
def submit_votes():
    db_filename = request.cookies.get("db", "real.db")
    print("cookies[db] =", db_filename)
    content = request.json
    conn = db.initialize(db_filename)
    add_vote_events(conn, content)
    conn.close()
    response = json.dumps({"status": "ok"})
    return Response(response=response, status=200, mimetype="application/json")
