"""Reproduce the OFI demo: World Cup 2022 Final tactical metrics."""
import ofi

MATCH_ID = 3869685  # Argentina 3-3 France, FIFA World Cup 2022 Final

def main():
    m = ofi.load_match(MATCH_ID)
    print("=== Team metrics ===")
    print(ofi.team_metrics(m)[
        ["possession_pct", "field_tilt", "progressive_passes",
         "xt_total", "shots", "xg", "goals", "ppda"]].to_string())

    print("\n=== Phase split ===")
    print(ofi.phase_split(m, [(0, 45, "1H"), (45, 90, "2H"), (90, 120, "ET")])
          [["phase", "team", "field_tilt", "shots", "xg", "goals"]].to_string(index=False))

    print("\n=== France passing network (top betweenness) ===")
    nodes, _ = ofi.passing_network(m, "France")
    print(nodes[["player", "passes", "betweenness"]].head(5).to_string(index=False))

if __name__ == "__main__":
    main()
