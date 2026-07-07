"""Simulate a live feed: watch OFI answer 'who is in control?' as the game evolves.

In production, replace the historical load with a registered live provider:
    ofi.register_source("live", my_fetch_fn)
    events = ofi.load_match(MATCH_ID, source="live")   # polled mid-match
"""
import ofi

MATCH_ID = 3869685  # World Cup 2022 Final

def main():
    events = ofi.load_match(MATCH_ID)
    print(f"{'min':>4} {'score':>10} {'ARG tilt':>9} {'ARG xG':>7} {'FRA xG':>7}")
    for minute, state in ofi.live_replay(events, step_minutes=15, start=15, end=120):
        tm = state["team_metrics"]
        arg_xg = tm["xg"].get("Argentina", 0.0)
        fra_xg = tm["xg"].get("France", 0.0)
        tilt = state["field_tilt"].get("Argentina", 0.0)
        print(f"{minute:>4} {str(state['score']):>10} {tilt:>8.1f}% {arg_xg:>7.2f} {fra_xg:>7.2f}")

if __name__ == "__main__":
    main()
