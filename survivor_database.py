import sqlite3

DEFAULT_DATABASE_NAME = "real.db"

TABLES = {
    "events": [
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
        ("Username", "TEXT"),
        ("Email", "TEXT"),
        ("PasswordHash", "TEXT"),
    ],
    "sessions": [
        ("Username", "TEXT"),
        ("SessionId", "TEXT"),
    ],
}

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
    def get(col):
        name, data_type = col
        return data.get(name, None)
    columns = TABLES[table_name]
    values = [get(c) for c in columns]
    placeholders = ",".join(["?"] * len(columns))
    sql = f"INSERT INTO {table_name} VALUES ({placeholders})"
    cursor.execute(sql, values)
    conn.commit()

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
    data["events"] = get_table_contents(
        "events",
        "SELECT * FROM events ORDER BY Episode"
    )
    data["survivors"] = get_table_contents(
        "survivors",
        "SELECT * FROM survivors ORDER BY Name"
    )
    data["tribes"] = get_table_contents(
        "tribes",
        "SELECT * FROM tribes ORDER BY Name"
    )

    return data
