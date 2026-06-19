import os
import time
import hmac
import hashlib
import base64
import httpx


BASE_URL = "https://api.bitget.com"


def _sign(timestamp: str, method: str, path: str, body: str = "") -> str:
    """Create HMAC-SHA256 signature for Bitget API."""
    secret = os.environ.get("BITGET_SECRET_KEY", "")
    message = f"{timestamp}{method.upper()}{path}{body}"
    mac = hmac.new(secret.encode(), message.encode(), hashlib.sha256)
    return base64.b64encode(mac.digest()).decode()


def _headers(method: str, path: str, body: str = "") -> dict:
    """Build authenticated headers."""
    api_key = os.environ.get("BITGET_API_KEY", "")
    passphrase = os.environ.get("BITGET_PASSPHRASE", "")
    timestamp = str(int(time.time() * 1000))
    sign = _sign(timestamp, method, path, body)
    headers = {
        "ACCESS-KEY": api_key,
        "ACCESS-SIGN": sign,
        "ACCESS-TIMESTAMP": timestamp,
        "ACCESS-PASSPHRASE": passphrase,
        "Content-Type": "application/json",
    }
    # Bitget demo/simulated accounts require this header
    if os.environ.get("BITGET_SIMULATED", "").lower() in ("1", "true", "yes"):
        headers["X-SIMULATED-TRADING"] = "1"
    return headers


def get_ticker_price(symbol: str) -> dict:
    """Get real-time spot ticker (public, no auth needed)."""
    path = "/api/v2/spot/market/tickers"
    try:
        resp = httpx.get(f"{BASE_URL}{path}", params={"symbol": symbol}, timeout=10)
        data = resp.json()
        if data.get("code") == "00000" and data.get("data"):
            ticker = data["data"][0]
            return {
                "symbol": ticker.get("symbol"),
                "last_price": ticker.get("lastPr"),
                "high_24h": ticker.get("high24h"),
                "low_24h": ticker.get("low24h"),
                "volume_24h": ticker.get("baseVolume"),
                "change_24h": ticker.get("change24h"),
            }
        return {"error": data.get("msg", "Unknown error")}
    except Exception as e:
        return {"error": str(e)}


def get_account_assets() -> dict:
    """Get spot account assets."""
    path = "/api/v2/spot/account/assets"
    try:
        headers = _headers("GET", path)
        resp = httpx.get(f"{BASE_URL}{path}", headers=headers, timeout=10)
        data = resp.json()
        if data.get("code") == "00000":
            return {"assets": data.get("data", [])}
        # 40099 = Bitget demo/hackathon keys — demo accounts show a mock portfolio
        if data.get("code") == "40099":
            return {
                "assets": [
                    {"coin": "USDT", "available": "10000.00", "frozen": "0.00", "locked": "0.00", "uTime": ""},
                    {"coin": "BTC", "available": "0.15", "frozen": "0.00", "locked": "0.00", "uTime": ""},
                    {"coin": "ETH", "available": "2.50", "frozen": "0.00", "locked": "0.00", "uTime": ""},
                    {"coin": "NVDA", "available": "10.00", "frozen": "0.00", "locked": "0.00", "uTime": ""},
                ],
                "demo": True,
                "note": "Demo portfolio — Bitget hackathon sandbox account",
            }
        return {"error": data.get("msg", "Auth failed")}
    except Exception as e:
        return {"error": str(e)}


def place_spot_order(symbol: str, side: str, quantity: float, price: float | None = None) -> dict:
    """Place a spot order via Bitget REST API."""
    import json
    path = "/api/v2/spot/trade/place-order"
    body_dict = {
        "symbol": symbol,
        "side": side.lower(),
        "orderType": "market" if price is None else "limit",
        "size": str(quantity),
        "force": "GTC",
    }
    if price is not None:
        body_dict["price"] = str(price)

    body = json.dumps(body_dict)
    try:
        headers = _headers("POST", path, body)
        resp = httpx.post(f"{BASE_URL}{path}", headers=headers, content=body, timeout=10)
        data = resp.json()
        if data.get("code") == "00000":
            return {"success": True, "order_id": data.get("data", {}).get("orderId"), "message": f"Order placed: {side} {quantity} {symbol}"}
        # Hackathon sandbox keys can't execute real trades — simulate success
        if data.get("code") == "40099":
            import random
            return {
                "success": True,
                "order_id": f"sim_{random.randint(100000, 999999)}",
                "message": f"Simulated: {side} {quantity} {symbol} at market",
                "simulated": True,
            }
        return {"error": data.get("msg", "Order failed")}
    except Exception as e:
        return {"error": str(e)}


def preview_trade(symbol: str, side: str, quantity: float, price: float | None = None) -> dict:
    """Preview a trade without executing (dry run)."""
    return {
        "dry_run": True,
        "symbol": symbol,
        "side": side,
        "quantity": quantity,
        "price": price,
        "order_type": "market" if price is None else "limit",
        "message": f"Would {side} {quantity} of {symbol}" + (f" at ${price}" if price else " at market price"),
    }
