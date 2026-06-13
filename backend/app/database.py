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
        conn.execute("""
            CREATE TABLE IF NOT EXISTS decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                side TEXT NOT NULL,
                quantity REAL NOT NULL,
                price REAL NOT NULL,
                fomo_score TEXT NOT NULL,
                fomo_signals TEXT,
                reasoning TEXT NOT NULL,
                confidence INTEGER NOT NULL,
                time_horizon TEXT NOT NULL,
                outcome_price REAL,
                outcome_pct REAL,
                created_at TEXT NOT NULL,
                resolved_at TEXT
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

    def save_decision(self, ticker: str, side: str, quantity: float, price: float,
                      fomo_score: str, fomo_signals: str, reasoning: str,
                      confidence: int, time_horizon: str) -> int:
        conn = self._connect()
        cursor = conn.execute(
            """INSERT INTO decisions (ticker, side, quantity, price, fomo_score, fomo_signals,
               reasoning, confidence, time_horizon, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (ticker, side, quantity, price, fomo_score, fomo_signals,
             reasoning, confidence, time_horizon,
             datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()
        row_id = cursor.lastrowid
        conn.close()
        return row_id

    def get_decisions(self, limit: int = 50) -> list[dict]:
        conn = self._connect()
        rows = conn.execute(
            "SELECT * FROM decisions ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_recent_decision_count(self, ticker: str, hours: int = 24) -> int:
        conn = self._connect()
        row = conn.execute(
            """SELECT COUNT(*) as cnt FROM decisions
               WHERE ticker = ? AND created_at > datetime('now', ?)""",
            (ticker, f"-{hours} hours"),
        ).fetchone()
        conn.close()
        return row["cnt"] if row else 0

    def get_autopsy_stats(self) -> dict:
        conn = self._connect()
        total = conn.execute("SELECT COUNT(*) as cnt FROM decisions").fetchone()["cnt"]
        if total == 0:
            conn.close()
            return {"total_trades": 0}

        fomo_trades = conn.execute(
            "SELECT COUNT(*) as cnt FROM decisions WHERE fomo_score != 'LOW'"
        ).fetchone()["cnt"]
        calm_trades = total - fomo_trades

        avg_confidence = conn.execute(
            "SELECT AVG(confidence) as avg FROM decisions"
        ).fetchone()["avg"]

        resolved = conn.execute(
            "SELECT * FROM decisions WHERE outcome_pct IS NOT NULL"
        ).fetchall()

        fomo_resolved = [r for r in resolved if r["fomo_score"] != "LOW"]
        calm_resolved = [r for r in resolved if r["fomo_score"] == "LOW"]

        fomo_avg_return = (sum(r["outcome_pct"] for r in fomo_resolved) / len(fomo_resolved)) if fomo_resolved else None
        calm_avg_return = (sum(r["outcome_pct"] for r in calm_resolved) / len(calm_resolved)) if calm_resolved else None
        win_rate = (sum(1 for r in resolved if r["outcome_pct"] > 0) / len(resolved) * 100) if resolved else None

        conn.close()
        return {
            "total_trades": total,
            "fomo_trades": fomo_trades,
            "calm_trades": calm_trades,
            "avg_confidence": round(avg_confidence, 1) if avg_confidence else None,
            "fomo_avg_return": round(fomo_avg_return, 2) if fomo_avg_return is not None else None,
            "calm_avg_return": round(calm_avg_return, 2) if calm_avg_return is not None else None,
            "win_rate": round(win_rate, 1) if win_rate is not None else None,
            "resolved_count": len(resolved),
        }
