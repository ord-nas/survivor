for db in real real_post_merge real_pre_merge test_post_merge test_pre_merge test_real_votes
do
    echo python3 set_db_state.py db_snapshots/${db}.json db/${db}.db
    python3 set_db_state.py db_snapshots/${db}.json db/${db}.db
done
