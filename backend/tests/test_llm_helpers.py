from app.services.llm import compute_cache_key, estimate_cost


def test_compute_cache_key_deterministic() -> None:
    a = compute_cache_key("desc", "cv", "model-x")
    b = compute_cache_key("desc", "cv", "model-x")
    assert a == b
    assert len(a) == 64


def test_compute_cache_key_changes_on_input() -> None:
    base = compute_cache_key("desc", "cv", "model-x")
    assert compute_cache_key("desc2", "cv", "model-x") != base
    assert compute_cache_key("desc", "cv2", "model-x") != base
    assert compute_cache_key("desc", "cv", "model-y") != base


def test_estimate_cost_known_model() -> None:
    cost = estimate_cost("openai/gpt-4o-mini", 1_000_000, 1_000_000)
    assert cost == 0.75


def test_estimate_cost_unknown_model() -> None:
    assert estimate_cost("unknown/model", 1000, 1000) == 0.0
