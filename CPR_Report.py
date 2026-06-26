# -*- coding: utf-8 -*-

"""Production entry point for the CPR management report."""

from __future__ import annotations

import json
import os

import pandas as pd

from config import INPUT_FILE, OUTPUT_FOLDER, OUTPUT_PPT
from data_engine import build_report_data, calculate_kpis, prepare_data
from ppt_engine import generate_powerpoint


def main() -> None:
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    print("=" * 60)
    print("CPR REPORTING ENGINE")
    print("=" * 60)

    raw_df = pd.read_excel(INPUT_FILE)
    df, quality = prepare_data(raw_df)
    kpis = calculate_kpis(df, quality)
    report_data = build_report_data(df, kpis)

    report_data_path = os.path.join(OUTPUT_FOLDER, "report_data.json")
    with open(report_data_path, "w", encoding="utf-8") as handle:
        json.dump(report_data, handle, ensure_ascii=False, indent=2)

    print(
        f"Validated {kpis['total_events']} events "
        f"({quality['duplicates_removed']} exact duplicates removed)."
    )
    print(
        f"Outcome: {kpis['success_count']} successful, "
        f"{kpis['failure_count']} unsuccessful, "
        f"{kpis['success_rate']:.1f}% success."
    )

    generate_powerpoint(report_data_path=report_data_path, output_path=OUTPUT_PPT)

    print("=" * 60)
    print(f"REPORT GENERATED: {OUTPUT_PPT}")
    print("=" * 60)


if __name__ == "__main__":
    main()
