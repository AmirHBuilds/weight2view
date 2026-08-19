"""
Reference object selection.

Given a calculated volume, rank candidate reference objects by a weighted
score of volume closeness, familiarity, and scale-fit - NOT simply by
mathematically closest volume. Kept isolated from the API/DB layer so the
scoring heuristic can be tuned or replaced independently.
"""
import math
from dataclasses import dataclass

# Tunable weights - adjust here without touching the algorithm's structure.
WEIGHT_VOLUME_CLOSENESS = 0.55
WEIGHT_FAMILIARITY = 0.30
WEIGHT_SCALE_FIT = 0.15


@dataclass(frozen=True)
class ReferenceCandidate:
    """ORM-independent view of a ReferenceObject for scoring purposes."""

    id: str
    name: str
    category: str
    volume_l: float
    familiarity_score: int  # 1-10


@dataclass(frozen=True)
class ScoredReference:
    candidate: ReferenceCandidate
    score: float
    volume_ratio: float  # target / candidate, for display/debugging


def _volume_closeness(target_l: float, candidate_l: float) -> float:
    """
    1.0 = identical volume, decaying smoothly as the ratio moves away from 1
    in either direction. Uses a log-ratio so being 2x too big and 2x too
    small are penalized equally (unlike a raw linear difference).
    """
    if target_l <= 0 or candidate_l <= 0:
        return 0.0
    log_ratio = abs(math.log(target_l / candidate_l))
    return 1.0 / (1.0 + log_ratio)


def _scale_fit_penalty(target_l: float, candidate_l: float) -> float:
    """
    Extra penalty (returned as a 0..1 "fit" score, 1 = no penalty) for
    references wildly larger/smaller than the target, even if familiarity
    is high. Prevents e.g. "about the size of a car" for 2 liters.
    """
    if target_l <= 0 or candidate_l <= 0:
        return 0.0
    ratio = max(target_l / candidate_l, candidate_l / target_l)
    if ratio <= 3:
        return 1.0
    if ratio >= 50:
        return 0.0
    # Linear falloff between 3x and 50x difference.
    return 1.0 - (ratio - 3) / (50 - 3)


def score_reference(target_volume_l: float, candidate: ReferenceCandidate) -> ScoredReference:
    closeness = _volume_closeness(target_volume_l, candidate.volume_l)
    familiarity = candidate.familiarity_score / 10.0
    scale_fit = _scale_fit_penalty(target_volume_l, candidate.volume_l)

    score = (
        WEIGHT_VOLUME_CLOSENESS * closeness
        + WEIGHT_FAMILIARITY * familiarity
        + WEIGHT_SCALE_FIT * scale_fit
    )

    return ScoredReference(
        candidate=candidate,
        score=score,
        volume_ratio=target_volume_l / candidate.volume_l if candidate.volume_l else 0.0,
    )


def rank_references(
    target_volume_l: float,
    candidates: list[ReferenceCandidate],
    limit: int = 5,
) -> list[ScoredReference]:
    """
    Return the top `limit` reference candidates for the given target volume,
    best first. Empty list in => empty list out (caller should handle "no
    references configured" as a distinct case).
    """
    scored = [score_reference(target_volume_l, c) for c in candidates]
    scored.sort(key=lambda s: s.score, reverse=True)
    return scored[:limit]
