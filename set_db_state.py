"""
Example command:

python3 set_db_state.py db_snapshots/real.json db/real.db

"""

import json
import sys
import survivor_database as db

def read_json_file(filename):
  """Reads a JSON file and converts it to a Python list.

  Args:
    filename: The path to the JSON file.

  Returns:
    A Python list representing the JSON data.
  """
  try:
    with open(filename, 'r') as f:
      data = json.load(f)
    return data
  except FileNotFoundError:
    print(f"Error: File '{filename}' not found.")
    return None
  except json.JSONDecodeError as e:
    print(f"Error: Invalid JSON format in '{filename}'.")
    print(e)
    return None

if __name__ == "__main__":
  if len(sys.argv) < 2 or len(sys.argv) > 3:
    print("Usage: python program.py json_filename [db_filename]")
    sys.exit(1)

  filename = sys.argv[1]
  db_filename = sys.argv[2] if len(sys.argv) == 3 else db.DATABASE_NAME
  data = read_json_file(filename)

  if data:
    print("Data loaded successfully!")

  conn = db.initialize(db_filename, reset=True)
  for row in data["events"]:
      db.add_row(conn, row)

  print("Added rows!")
