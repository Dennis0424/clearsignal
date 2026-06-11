from signal_engine.models import SignalInput, ModuleScore

BULLISH_THRESHOLD = 1.0
BEARISH_THRESHOLD = -1.0
MAX_Z = 2.0
MIN_Z = -2.0


def normalize(signal: SignalInput) -> ModuleScore:
    if signal.historical_std == 0.0:
        z = 0.0
    else:
        z = (signal.raw_value - signal.historical_mean) / signal.historical_std

    z = max(MIN_Z, min(MAX_Z, z))

    if z > BULLISH_THRESHOLD:
        vote = "bullish"
    elif z < BEARISH_THRESHOLD:
        vote = "bearish"
    else:
        vote = "neutral"

    return ModuleScore(module_name=signal.module_name, z_score=z, vote=vote)
