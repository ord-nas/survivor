#!/usr/bin/env python3

import sqlite3
import json
import survivor_database as db
import os
from http.cookies import SimpleCookie
import sys
import urllib.parse as parse

def add_events(conn, qs):
    cursor = conn.cursor();
    for (event_type, survivor) in zip(qs["event_type"], qs["survivor"]):
        sql_str = f"""INSERT INTO events (Episode, Player, EventName, Survivor)
                      VALUES ({qs['episode'][0]}, "{qs['player'][0]}", "{event_type}", "{survivor}");"""
        print(sql_str, file=sys.stderr)
        conn.execute(sql_str)
    conn.commit();

if __name__ == "__main__":
    cookies = SimpleCookie(os.getenv("HTTP_COOKIE"));
    db_filename = cookies["db"].value
    qs = parse.parse_qs(os.getenv("QUERY_STRING"))
    print("cookies[db] =", db_filename, file=sys.stderr)
    print("query_string =", qs, file=sys.stderr)
    conn = db.initialize(db_filename)
    add_events(conn, qs)
    conn.close()
    print(
        """Content-Type: application/json

        {"status": "ok"}
        """
    )
