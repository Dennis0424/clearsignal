import sqlite3
from datetime import datetime, timezone


class Database:
    def __init__(self, db_path: str = "trades.db"):
        self.db_path = db_path

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def create_tables(self):
        conn = self._connect()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS trade_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                ticker TEXT NOT NULL,
                verdict TEXT NOT NULL,
                confluence_count INTEGER NOT NULL,
                total_modules INTEGER NOT NULL,
                shock_detected INTEGER NOT NULL,
                scores_json TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()

    def log_trade(
        self,
        ticker: str,
        verdict: str,
        confluence_count: int,
        total_modules: int,
        shock_detected: bool,
        scores_json: str,
    ) -> int:
        conn = self._connect()
        cursor = conn.execute(
            """
            INSERT INTO trade_log (timestamp, ticker, verdict, confluence_count, total_modules, shock_detected, scores_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                ticker,
                verdict,
                confluence_count,
                total_modules,
                int(shock_detected),
                scores_json,
            ),
        )
        conn.commit()
        row_id = cursor.lastrowid
        conn.close()
        return row_id

    def get_history(self, ticker: str | None = None, limit: int = 100) -> list[dict]:
        conn = self._connect()
        if ticker:
            rows = conn.execute(
                "SELECT * FROM trade_log WHERE ticker = ? ORDER BY id DESC LIMIT ?",
                (ticker, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM trade_log ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
        conn.close()
        return [dict(row) for row in rows]
