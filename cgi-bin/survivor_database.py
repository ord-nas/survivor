import sqlite3

DATABASE_NAME = "survivor.db"

COLUMNS = [
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
]

def create_or_connect_db(db_name):
    """Creates or connects to an existing SQLite database."""
    conn = sqlite3.connect(db_name)
    return conn

def create_table(conn):
    """Creates a table if it doesn't exist."""
    cursor = conn.cursor()
    column_def = ", ".join(name + " " + type for (name, type) in COLUMNS)
    cursor.execute(f'''CREATE TABLE IF NOT EXISTS events ({column_def})''')
    conn.commit()

def initialize(db_name=DATABASE_NAME, reset=False):
    conn = create_or_connect_db(db_name)
    if reset:
        cursor = conn.cursor()
        cursor.execute("DROP TABLE IF EXISTS events")
        conn.commit()
    create_table(conn)
    return conn

def add_row(conn, data):
    """Adds a new row to the event table."""
    cursor = conn.cursor()
    def get(col):
        name, data_type = col
        if name not in data:
            return "NULL"
        value = data[name]
        if data_type == "INTEGER":
            return str(value)
        if data_type == "TEXT":
            return '"' + value + '"'
        assert False
    values = ', '.join(get(c) for c in COLUMNS)
    cursor.execute(f"INSERT INTO events VALUES ({values})")
    conn.commit()

def fetch_data(conn):
    """Fetches data from the table and prints it in JSON format."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events ORDER BY Episode")
    rows = cursor.fetchall()

    # Convert to list of dictionaries
    data = []
    for row in rows:
        data.append({ name : value
                      for ((name, _), value) in zip(COLUMNS, row)
                      if value is not None
        })
    return data
