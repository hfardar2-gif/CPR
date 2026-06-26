# -*- coding: utf-8 -*-

"""Data validation, normalization, and KPI calculation for the CPR report."""

from __future__ import annotations

import math
import re
from typing import Any

import numpy as np
import pandas as pd

from config import (
    AGE_BINS,
    AGE_LABELS,
    FAIL_VALUE,
    HOSPITAL_NAME,
    MONTH_ORDER,
    REPORT_PERIOD,
    REQUIRED_COLUMNS,
    RESULT_COLUMN,
    SUCCESS_VALUE,
)


SUCCESS_COLUMN = "احیا موفق"
FAILURE_COLUMN = "احیا ناموفق"
SUPERVISOR_COLUMN = "سوپروایزر حاضر بر احیا"
DEPARTMENT_COLUMN = "بخش"
SHIFT_COLUMN = "شیفت"
MONTH_COLUMN = "ماه"
AGE_COLUMN = "سن"

MIN_SUPERVISOR_CASES = 5


def _clean_text(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    value = value.replace("\u200c", " ")
    return re.sub(r"\s+", " ", value).strip()


def _json_value(value: Any) -> Any:
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        value = float(value)
        return None if math.isnan(value) else value
    return value


def prepare_data(raw_df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    missing_columns = [column for column in REQUIRED_COLUMNS if column not in raw_df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")

    if SUCCESS_COLUMN not in raw_df.columns or FAILURE_COLUMN not in raw_df.columns:
        raise ValueError(
            f"Workbook must contain both '{SUCCESS_COLUMN}' and '{FAILURE_COLUMN}'."
        )

    df = raw_df.copy()
    text_columns = df.select_dtypes(include=["object", "string"]).columns
    for column in text_columns:
        df[column] = df[column].map(_clean_text)

    # Canonicalize known labels that otherwise split the same reporting group.
    df[DEPARTMENT_COLUMN] = df[DEPARTMENT_COLUMN].replace(
        {
            "ccuویژه": "CCU ویژه",
            "CCUویژه": "CCU ویژه",
        }
    )
    df[SUPERVISOR_COLUMN] = df[SUPERVISOR_COLUMN].replace(
        {"اقای حاجی علی": "آقای حاجی علی"}
    )

    duplicate_count = int(df.duplicated().sum())
    df = df.drop_duplicates().reset_index(drop=True)

    success_marked = df[SUCCESS_COLUMN].notna()
    failure_marked = df[FAILURE_COLUMN].notna()
    invalid_outcome_count = int((success_marked == failure_marked).sum())
    if invalid_outcome_count:
        raise ValueError(
            f"{invalid_outcome_count} rows have an ambiguous outcome; exactly one outcome "
            "column must be marked."
        )

    df[RESULT_COLUMN] = np.where(success_marked, SUCCESS_VALUE, FAIL_VALUE)
    df[AGE_COLUMN] = pd.to_numeric(df[AGE_COLUMN], errors="coerce")
    invalid_age_count = int(df[AGE_COLUMN].isna().sum())
    if invalid_age_count:
        raise ValueError(f"{invalid_age_count} rows contain a missing or invalid age.")

    df["گروه سنی"] = pd.cut(
        df[AGE_COLUMN],
        bins=AGE_BINS,
        labels=AGE_LABELS,
        include_lowest=True,
    )

    observed_months = set(df[MONTH_COLUMN].dropna().astype(str))
    unknown_months = sorted(observed_months.difference(MONTH_ORDER))
    if unknown_months:
        raise ValueError(f"Unknown month labels: {unknown_months}")
    df[MONTH_COLUMN] = pd.Categorical(
        df[MONTH_COLUMN], categories=MONTH_ORDER, ordered=True
    )

    quality = {
        "source_rows": int(len(raw_df)),
        "valid_rows": int(len(df)),
        "duplicates_removed": duplicate_count,
        "invalid_outcomes": invalid_outcome_count,
        "invalid_ages": invalid_age_count,
    }
    return df, quality


def _group_stats(df: pd.DataFrame, column: str) -> pd.DataFrame:
    stats = (
        df.groupby(column, observed=True)
        .agg(
            total=(RESULT_COLUMN, "size"),
            success=(RESULT_COLUMN, lambda values: (values == SUCCESS_VALUE).sum()),
        )
        .reset_index()
    )
    stats["failure"] = stats["total"] - stats["success"]
    stats["success_rate"] = stats["success"] / stats["total"] * 100
    return stats


def calculate_kpis(df: pd.DataFrame, quality: dict[str, Any]) -> dict[str, Any]:
    total_events = int(len(df))
    success_count = int((df[RESULT_COLUMN] == SUCCESS_VALUE).sum())
    failure_count = int((df[RESULT_COLUMN] == FAIL_VALUE).sum())
    success_rate = round(success_count / total_events * 100, 1) if total_events else 0.0

    department_stats = _group_stats(df, DEPARTMENT_COLUMN)
    shift_stats = _group_stats(df, SHIFT_COLUMN)
    supervisor_stats = _group_stats(df, SUPERVISOR_COLUMN)
    month_stats = _group_stats(df, MONTH_COLUMN)

    top_department = department_stats.sort_values(
        ["total", "success_rate"], ascending=[False, False]
    ).iloc[0]
    top_shift = shift_stats.sort_values(
        ["total", "success_rate"], ascending=[False, False]
    ).iloc[0]

    eligible_supervisors = supervisor_stats[
        supervisor_stats["total"] >= MIN_SUPERVISOR_CASES
    ]
    if eligible_supervisors.empty:
        eligible_supervisors = supervisor_stats

    best_supervisor = eligible_supervisors.sort_values(
        ["success_rate", "total"], ascending=[False, False]
    ).iloc[0]
    worst_supervisor = eligible_supervisors.sort_values(
        ["success_rate", "total"], ascending=[True, False]
    ).iloc[0]

    best_month = month_stats.sort_values(
        ["success_rate", "total"], ascending=[False, False]
    ).iloc[0]
    lowest_month = month_stats.sort_values(
        ["success_rate", "total"], ascending=[True, False]
    ).iloc[0]

    return {
        "hospital_name": HOSPITAL_NAME,
        "report_period": REPORT_PERIOD,
        "total_events": total_events,
        "success_count": success_count,
        "failure_count": failure_count,
        "success_rate": success_rate,
        "avg_age": round(float(df[AGE_COLUMN].mean()), 1),
        "median_age": round(float(df[AGE_COLUMN].median()), 1),
        "top_department": _json_value(top_department[DEPARTMENT_COLUMN]),
        "top_department_count": int(top_department["total"]),
        "top_shift": _json_value(top_shift[SHIFT_COLUMN]),
        "top_shift_count": int(top_shift["total"]),
        "best_supervisor": _json_value(best_supervisor[SUPERVISOR_COLUMN]),
        "best_supervisor_rate": round(float(best_supervisor["success_rate"]), 1),
        "best_supervisor_cases": int(best_supervisor["total"]),
        "worst_supervisor": _json_value(worst_supervisor[SUPERVISOR_COLUMN]),
        "worst_supervisor_rate": round(float(worst_supervisor["success_rate"]), 1),
        "worst_supervisor_cases": int(worst_supervisor["total"]),
        "best_month": _json_value(best_month[MONTH_COLUMN]),
        "best_month_rate": round(float(best_month["success_rate"]), 1),
        "lowest_month": _json_value(lowest_month[MONTH_COLUMN]),
        "lowest_month_rate": round(float(lowest_month["success_rate"]), 1),
        "minimum_supervisor_cases": MIN_SUPERVISOR_CASES,
        "quality": quality,
    }


def build_report_data(df: pd.DataFrame, kpis: dict[str, Any]) -> dict[str, Any]:
    def records(frame: pd.DataFrame) -> list[dict[str, Any]]:
        return [
            {key: _json_value(value) for key, value in row.items()}
            for row in frame.to_dict(orient="records")
        ]

    department_shift = pd.crosstab(
        df[DEPARTMENT_COLUMN], df[SHIFT_COLUMN]
    ).reset_index()
    month_shift = (
        pd.crosstab(df[MONTH_COLUMN], df[SHIFT_COLUMN])
        .reindex(MONTH_ORDER)
        .dropna(how="all")
        .fillna(0)
        .astype(int)
        .reset_index()
    )

    return {
        "kpis": kpis,
        "monthly": records(_group_stats(df, MONTH_COLUMN)),
        "departments": records(_group_stats(df, DEPARTMENT_COLUMN)),
        "shifts": records(_group_stats(df, SHIFT_COLUMN)),
        "supervisors": records(_group_stats(df, SUPERVISOR_COLUMN)),
        "age_groups": records(_group_stats(df, "گروه سنی")),
        "department_shift": {
            "columns": [str(value) for value in department_shift.columns],
            "rows": records(department_shift),
        },
        "month_shift": {
            "columns": [str(value) for value in month_shift.columns],
            "rows": records(month_shift),
        },
    }
