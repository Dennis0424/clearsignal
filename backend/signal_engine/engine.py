from signal_engine.models import SignalInput, Verdict
from signal_engine.normalizer import normalize
from signal_engine.voter import vote


def analyze(inputs: list[SignalInput]) -> Verdict:
    scores = [normalize(sig) for sig in inputs]
    return vote(scores)
