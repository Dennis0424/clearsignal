import os
import tempfile
from app.database import Database


def test_create_tables():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    try:
        db = Database(db_path)
        db.create_tables()
        db.log_trade(
            ticker="AAPL",
            verdict="BUY",
            confluence_count=4,
            total_modules=5,
            shock_detected=False,
            scores_json='[]',
        )
        entries = db.get_history()
        assert len(entries) == 1
        assert entries[0]["ticker"] == "AAPL"
    finally:
        os.unlink(db_path)


def test_get_history_empty():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    try:
        db = Database(db_path)
        db.create_tables()
        entries = db.get_history()
        assert entries == []
    finally:
        os.unlink(db_path)


def test_get_history_ordered_newest_first():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    try:
        db = Database(db_path)
        db.create_tables()
        db.log_trade("AAPL", "BUY", 4, 5, False, '[]')
        db.log_trade("TSLA", "SELL", 4, 5, False, '[]')
        entries = db.get_history()
        assert len(entries) == 2
        assert entries[0]["ticker"] == "TSLA"
    finally:
        os.unlink(db_path)


def test_get_history_by_ticker():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    try:
        db = Database(db_path)
        db.create_tables()
        db.log_trade("AAPL", "BUY", 4, 5, False, '[]')
        db.log_trade("TSLA", "SELL", 4, 5, False, '[]')
        db.log_trade("AAPL", "HOLD", 3, 5, False, '[]')
        entries = db.get_history(ticker="AAPL")
        assert len(entries) == 2
        assert all(e["ticker"] == "AAPL" for e in entries)
    finally:
        os.unlink(db_path)
