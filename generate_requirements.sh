source .venv/bin/activate
pip freeze | grep -v "pkg-resources" > requirements.txt
