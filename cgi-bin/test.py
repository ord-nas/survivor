#!/usr/bin/env python3

import os

print(
    f"""Content-Type: text/html

<!DOCTYPE html>
<html>
<body>
    Hello World! {os.getenv("QUERY_STRING")}
</body>
</html>"""
)
