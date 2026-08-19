from app.services.reference_selection import ReferenceCandidate, rank_references, score_reference


def make_candidates():
    return [
        ReferenceCandidate(id="mug", name="Coffee mug", category="everyday", volume_l=0.35, familiarity_score=8),
        ReferenceCandidate(id="bottle", name="Water bottle", category="everyday", volume_l=0.75, familiarity_score=9),
        ReferenceCandidate(id="backpack", name="Backpack", category="everyday", volume_l=20.0, familiarity_score=7),
        ReferenceCandidate(id="fridge", name="Refrigerator", category="large", volume_l=400.0, familiarity_score=6),
        ReferenceCandidate(id="obscure", name="Obscure crate", category="everyday", volume_l=0.76, familiarity_score=1),
    ]


def test_water_bottle_wins_for_close_familiar_match():
    candidates = make_candidates()
    ranked = rank_references(0.75, candidates)
    assert ranked[0].candidate.id == "bottle"


def test_familiarity_breaks_near_ties_over_pure_closeness():
    # "obscure" is mathematically closer (0.76 vs 0.75 target) than "bottle"
    # in absolute terms is *equal*, but even when obscure is closer than
    # bottle, low familiarity should keep it from winning.
    candidates = make_candidates()
    ranked = rank_references(0.76, candidates)
    assert ranked[0].candidate.id == "bottle"
    # obscure should not outrank bottle despite being literally closer
    obscure_score = next(r.score for r in ranked if r.candidate.id == "obscure")
    bottle_score = next(r.score for r in ranked if r.candidate.id == "bottle")
    assert bottle_score > obscure_score


def test_scale_fit_penalizes_wildly_different_scale():
    candidates = make_candidates()
    # Small target volume should not pick the fridge even if nothing else existed nearby
    scored_fridge = score_reference(0.75, next(c for c in candidates if c.id == "fridge"))
    scored_bottle = score_reference(0.75, next(c for c in candidates if c.id == "bottle"))
    assert scored_bottle.score > scored_fridge.score


def test_rank_references_respects_limit():
    candidates = make_candidates()
    ranked = rank_references(0.75, candidates, limit=3)
    assert len(ranked) == 3


def test_rank_references_empty_candidates():
    assert rank_references(1.0, []) == []


def test_large_volume_prefers_large_reference():
    candidates = make_candidates()
    ranked = rank_references(380.0, candidates)
    assert ranked[0].candidate.id == "fridge"
