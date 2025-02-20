import sqlite3
import re
from passlib.hash import pbkdf2_sha256
import secrets

DEFAULT_DATABASE_NAME = "real.db"

TABLES = {
    "events": [
        ("Id", "INTEGER PRIMARY KEY AUTOINCREMENT"),
        ("CreationTimestamp", "TEXT DEFAULT CURRENT_TIMESTAMP"),
        ("EventName", "TEXT"),
        ("Episode", "INTEGER"),
        ("Survivor", "TEXT"),
        ("Tribe", "TEXT"),
        ("Player", "TEXT"),
        ("Points", "INTEGER"),
        # Only for "Set episode metadata" events.
        ("EpisodeName", "TEXT"),
        ("EpisodeAirDate", "TEXT"),
        ("EpisodeDescription", "TEXT"),
        ("EpisodeImageSrc", "TEXT"),
    ],
    "survivors": [
        ("Name", "TEXT"),
        ("FullName", "TEXT"),
        ("Tribe", "TEXT"),
        ("Age", "INTEGER"),
        ("Hometown", "TEXT"),
        ("Residence", "TEXT"),
        ("Occupation", "TEXT"),
        ("ImageSrc", "TEXT"),
        ("HeadshotClass", "TEXT"),
    ],
    "tribes": [
        ("Name", "TEXT"),
        ("FullName", "TEXT"),
        ("Color", "TEXT"),
    ],
    "players": [
        ("CreationTimestamp", "TEXT DEFAULT CURRENT_TIMESTAMP"),
        ("Username", "TEXT"),
        ("Email", "TEXT"),
        ("PasswordHash", "TEXT"),
    ],
    "sessions": [
        ("CreationTimestamp", "TEXT DEFAULT CURRENT_TIMESTAMP"),
        ("Username", "TEXT"),
        ("SessionId", "TEXT"),
    ],
    "invitations": [
        ("CreationTimestamp", "TEXT DEFAULT CURRENT_TIMESTAMP"),
        ("InviteCode", "TEXT"),
    ]
}

USERNAME_REGEX = r'^[a-zA-Z0-9._\- ]+$'
EMAIL_REGEX = r'^\S+@\S+\.\S+$'
PASSWORD_REGEX = r"""^[a-zA-Z0-9.,_\-!?@#$%^&*+~(){}\[\];:'"`<>\\\/|= ]+$"""

def create_or_connect_db(db_name):
    """Creates or connects to an existing SQLite database."""
    conn = sqlite3.connect(db_name)
    return conn

def create_table(cursor, table_name, columns):
    """Creates a table if it doesn't exist."""
    column_def = ", ".join(name + " " + type for (name, type) in columns)
    cursor.execute(f'''CREATE TABLE IF NOT EXISTS {table_name} ({column_def})''')

def create_all_tables(conn):
    """Creates all the necessary tables if they don't exist."""
    cursor = conn.cursor()
    for (table_name, columns) in TABLES.items():
        create_table(cursor, table_name, columns)
    conn.commit()

def drop_all_tables(conn):
    """Drop all existing tables."""
    cursor = conn.cursor()
    for (table_name, _) in TABLES.items():
        cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
    conn.commit()

def initialize(db_name=DEFAULT_DATABASE_NAME, reset=False):
    conn = create_or_connect_db(db_name)
    if reset:
        drop_all_tables(conn)
    create_all_tables(conn)
    return conn

def add_row(conn, table_name, data):
    """Adds a new row to the given table."""
    cursor = conn.cursor()
    kvs = list(data.items())
    columns = [k for (k, v) in kvs]
    values = [v for (k, v) in kvs]
    placeholders = ",".join(["?"] * len(columns))
    sql = f"INSERT INTO {table_name} ({','.join(columns)}) VALUES ({placeholders})"
    cursor.execute(sql, values)
    conn.commit()

def hide_open_voting_round(events):
    voting_closed_episode = max((e["Episode"] for e in events if e["EventName"] == "Voting closed"), default=0)
    events_to_hide = set(["Predict vote out", "Select Sole Survivor"])
    return [e for e in events
            if (e["EventName"] not in events_to_hide or
                e["Episode"] <= voting_closed_episode)]

def fetch_state(conn):
    """Fetches survivor state and returns it as a dictionary."""

    def get_table_contents(table_name, sql):
        columns = TABLES[table_name]
        contents = []
        cursor = conn.cursor()
        cursor.execute(sql)
        for row in cursor.fetchall():
            contents.append({
                name : value
                for ((name, _), value) in zip(columns, row)
                if value is not None
            })
        return contents

    # Convert dictionary.
    data = {}
    data["events"] = hide_open_voting_round(get_table_contents(
        "events",
        "SELECT * FROM events ORDER BY Episode, Id"
    ))
    data["survivors"] = get_table_contents(
        "survivors",
        "SELECT * FROM survivors ORDER BY Name"
    )
    data["tribes"] = get_table_contents(
        "tribes",
        "SELECT * FROM tribes ORDER BY Name"
    )
    data["players"] = [
        p["Username"]
        for p in get_table_contents(
            "players",
            'SELECT * FROM players '
            'WHERE Username != "admin" '
            'ORDER BY LOWER(Username)',
        )
    ]

    return data

def add_vote_events(conn, data):
    cursor = conn.cursor();
    episode = data["episode"]
    player = data["player"]
    for vote in data["votes"]:
        event_type = vote["event_type"]
        survivor = vote["survivor"]
        sql_str = "INSERT INTO events (Episode, Player, EventName, Survivor) VALUES (?,?,?,?);"
        conn.execute(sql_str, (episode, player, event_type, survivor))
    conn.commit()

def try_login(conn, data):
    if "identifier" not in data:
        return { "status": "error", "message": "Invalid request, missing identifier." }

    if "password" not in data:
        return { "status": "error", "message": "Invalid request, missing password." }

    identifier = data["identifier"]
    password = data["password"]

    valid_username = re.match(USERNAME_REGEX, identifier) is not None
    valid_email = re.match(EMAIL_REGEX, identifier) is not None
    valid_identifier = valid_username or valid_email
    valid_password = re.match(PASSWORD_REGEX, password) is not None

    if not valid_identifier or not valid_password:
        result = { "status": "error" }
        if not valid_identifier:
            if identifier == "":
                result["identifier_message"] = "Username or email is required."
            else:
                result["identifier_message"] = "Please enter a valid username or email address."
        if not valid_password:
            if password == "":
                result["password_message"] = "Password is required."
            else:
                result["password_message"] = "Invalid character in password."
        return result

    cursor = conn.cursor()
    cursor.execute("SELECT Username, Email, PasswordHash FROM players "
                   "WHERE Username = ? OR EMAIL = ?", (identifier, identifier))
    matching_players = cursor.fetchall()

    if len(matching_players) != 1:
        return {
            "status": "error",
            "identifier_message": "No matching account found."
        }

    username, email, password_hash = matching_players[0]
    if not pbkdf2_sha256.verify(password, password_hash):
        return {
            "status": "error",
            "password_message": "Incorrect password."
        }

    session_id = secrets.token_hex()
    cursor.execute("INSERT INTO sessions (Username, SessionId) VALUES (?, ?)", (username, session_id))
    conn.commit()

    return {
        "status": "success",
        "account": {
            "username": username,
            "email": email,
            "session_id": session_id,
        }
    }

def try_logout(conn, content, cookies):
    """Attempts to log out the current session."""

    if "username" not in cookies:
        return { "status": "error", "message": "Invalid request, missing username." }

    if "session_id" not in cookies:
        return { "status": "error", "message": "Invalid request, missing session id." }

    if "scope" not in content:
        return { "status": "error", "message": "Invalid request, missing scope." }

    username = cookies["username"]
    session_id = cookies["session_id"]
    scope = content["scope"]

    cursor = conn.cursor()
    cursor.execute("SELECT p.Username, p.Email FROM players AS p "
                   "INNER JOIN sessions AS s "
                   "ON p.Username = s.Username "
                   "WHERE s.Username = ? AND s.SessionId = ? "
                   "LIMIT 1", (username, session_id))
    matching_users = cursor.fetchall()

    if len(matching_users) != 1:
        return { "status": "error", "message": "Invalid session." }

    if scope == "local":
        cursor.execute("DELETE FROM sessions "
                       "WHERE Username = ? AND SessionId = ?",
                       (username, session_id))
        conn.commit()
    elif scope == "global":
        cursor.execute("DELETE FROM sessions "
                       "WHERE Username = ?",
                       (username,))
        conn.commit()
    else:
        return { "status": "error", "message": "Invalid request, invalid scope." }

    return { "status": "success" }

def try_register(conn, data):
    if "username" not in data:
        return { "status": "error", "message": "Invalid request, missing username." }

    if "email" not in data:
        return { "status": "error", "message": "Invalid request, missing email." }

    if "password" not in data:
        return { "status": "error", "message": "Invalid request, missing password." }

    if "invite_code" not in data:
        return { "status": "error", "message": "Invalid request, missing invite code." }

    username = data["username"]
    email = data["email"]
    password = data["password"]
    invite_code = data["invite_code"]

    valid_username = re.match(USERNAME_REGEX, username) is not None
    valid_email = re.match(EMAIL_REGEX, email) is not None
    valid_password = re.match(PASSWORD_REGEX, password) is not None

    if not valid_username or not valid_email or not valid_password:
        result = { "status": "error" }
        if not valid_username:
            if username == "":
                result["username_message"] = "Name is required."
            else:
                result["username_message"] = "Invalid character in name."
        if not valid_email:
            if email == "":
                result["email_message"] = "Email is required."
            else:
                result["email_message"] = "Please enter a valid email."
        if not valid_password:
            if password == "":
                result["password_message"] = "Password is required."
            else:
                result["password_message"] = "Invalid character in password."
        return result

    cursor = conn.cursor()
    cursor.execute("SELECT InviteCode FROM invitations "
                   "WHERE InviteCode = ?", (invite_code,))
    matching_invites = cursor.fetchall()

    if len(matching_invites) == 0:
        return { "status": "error", "message": "Missing or invalid invite code. Are you using the right registration URL?" }

    cursor = conn.cursor()
    cursor.execute("SELECT Username, Email FROM players "
                   "WHERE Username = ? OR EMAIL = ?", (username, email))
    matching_players = cursor.fetchall()

    if len(matching_players) != 0:
        existing_usernames = set(row[0] for row in matching_players)
        existing_emails = set(row[1] for row in matching_players)
        result = { "status": "error" }
        if username in existing_usernames:
            result["username_message"] = "There is already an account with that name."
        if email in existing_emails:
            result["email_message"] = "There is already an account with that email."
        return result

    password_hash = pbkdf2_sha256.hash(password)

    cursor.execute("INSERT INTO players (Username, Email, PasswordHash) VALUES (?, ?, ?)", (username, email, password_hash))
    conn.commit()

    session_id = secrets.token_hex()
    cursor.execute("INSERT INTO sessions (Username, SessionId) VALUES (?, ?)", (username, session_id))
    conn.commit()

    return {
        "status": "success",
        "account": {
            "username": username,
            "email": email,
            "session_id": session_id,
        }
    }

def get_voting_state(username, cursor):
    # Handle the admin case.
    if username == "admin":
        return { "status": "blocked_for_admin" }

    # Get all the potentially relevant voting events.
    cursor.execute('SELECT Episode, EventName, Survivor, Player FROM events '
                   'WHERE '
                   '  EventName = "Voting open" OR '
                   '  EventName = "Voting closed" OR '
                   '  EventName = "Merge" OR '
                   '  (Player = ? AND EventName = "Predict vote out") OR '
                   '  (Player = ? AND EventName = "Select Sole Survivor") '
                   'ORDER BY Episode, Id',
                   (username, username))
    voting_events = [
        {
            "Episode": row[0],
            "EventName": row[1],
            "Survivor": row[2],
            "Player": row[3],
        }
        for row in cursor.fetchall()
    ]

    # Check if voting is open.
    voting_open_episode = max((e["Episode"] for e in voting_events if e["EventName"] == "Voting open"), default=0)
    voting_closed_episode = max((e["Episode"] for e in voting_events if e["EventName"] == "Voting closed"), default=0)
    if voting_closed_episode >= voting_open_episode:
        return { "status": "closed" }

    # Check if we are past the merge.
    post_merge = any(e["Episode"] < voting_open_episode
                     for e in voting_events
                     if e["EventName"] == "Merge")

    # Grab any existing sole survivor selection.
    sole_survivor_selections = [e
                                for e in voting_events
                                if (e["EventName"] == "Select Sole Survivor")]

    # Grab any existing vote out predictions.
    current_predictions = [e
                           for e in voting_events
                           if (e["Player"] == username and
                               e["Episode"] == voting_open_episode and
                               e["EventName"] == "Predict vote out")]

    # Assemble state.
    return {
        "status": "open",
        "episode": voting_open_episode,
        "post_merge": post_merge,
        "sole_survivor": sole_survivor_selections[0] if sole_survivor_selections else None,
        "current_predictions": current_predictions,
    }

def fetch_user_state(conn, data):
    """Fetches user state and returns it as a dictionary."""

    if "username" not in data:
        return { "status": "error", "message": "Invalid request, missing username." }

    if "session_id" not in data:
        return { "status": "error", "message": "Invalid request, missing session id." }

    username = data["username"]
    session_id = data["session_id"]

    cursor = conn.cursor()
    cursor.execute("SELECT p.Username, p.Email FROM players AS p "
                   "INNER JOIN sessions AS s "
                   "ON p.Username = s.Username "
                   "WHERE s.Username = ? AND s.SessionId = ? "
                   "LIMIT 1", (username, session_id))
    matching_users = cursor.fetchall()

    if len(matching_users) != 1:
        return { "status": "error", "message": "Invalid session." }

    _, email = matching_users[0]

    return {
        "status": "success",
        "account": {
            "username": username,
            "email": email,
            "session_id": session_id,
        },
        "voting": get_voting_state(username, cursor),
    }

def is_admin(conn, data):
    if "username" not in data:
        return False

    if "session_id" not in data:
        return False

    username = data["username"]
    session_id = data["session_id"]

    if username != "admin":
        return False

    cursor = conn.cursor()
    cursor.execute("SELECT Username FROM sessions "
                   "WHERE Username = ? AND SessionId = ? "
                   "LIMIT 1", (username, session_id))
    matching_users = cursor.fetchall()

    return len(matching_users) == 1

def fetch_admin_state(conn):
    """Fetches admin state and returns it as a dictionary."""

    def get_table_contents(table_name, sql, columns=None):
        if columns is None:
            columns = [c[0] for c in TABLES[table_name]]
        contents = []
        cursor = conn.cursor()
        cursor.execute(sql)
        for row in cursor.fetchall():
            contents.append({
                name : value
                for (name, value) in zip(columns, row)
                if value is not None
            })
        return contents

    # Convert dictionary.
    data = {}
    data["events"] = get_table_contents(
        "events",
        "SELECT * FROM events ORDER BY Episode, Id"
    )
    data["players"] = get_table_contents(
        "players",
        'SELECT CreationTimestamp, Username, Email FROM players '
        'ORDER BY LOWER(Username)',
        columns=["CreationTimestsamp", "Username", "Email"]
    )
    data["invitations"] = get_table_contents(
        "invitations",
        'SELECT * FROM invitations'
    )

    return data

def delete_events(conn, data):
    """Deletes the given events."""

    if "events" not in data:
        return { "status": "error", "message": "Invalid request, missing events." }

    events = data["events"]

    if not isinstance(events, list):
        return { "status": "error", "message": "Invalid request, events format is invalid." }
    if len(events) < 1:
        return { "status": "error", "message": "Invalid request, events format is invalid." }
    if not all(isinstance(e, int) for e in events):
        return { "status": "error", "message": "Invalid request, events format is invalid." }

    placeholder_clauses = " OR ".join(["Id = ?"] * len(events))
    sql = f"DELETE FROM events WHERE {placeholder_clauses}"
    print(sql)
    cursor = conn.cursor()
    cursor.execute(sql, events)
    conn.commit()

    return { "status": "success" }
