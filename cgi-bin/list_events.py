#!/usr/bin/env python3

import sqlite3
import json
import survivor_database as db
import os
from http.cookies import SimpleCookie
import sys

def fetch_and_print_data(conn):
    """Fetches data from the table and prints it in JSON format."""
    as_json = json.dumps(db.fetch_data(conn),
                         indent=4)

    print(
        f"""Content-Type: application/json

        {as_json}
        """
    )


if __name__ == "__main__":
    cookies = SimpleCookie(os.getenv("HTTP_COOKIE"));
    db_filename = cookies["db"].value
    print("cookies[db] =", db_filename, file=sys.stderr)
    conn = db.initialize(db_filename)
    fetch_and_print_data(conn)
    conn.close()
