# -*- coding: utf-8 -*-

import unittest

import pandas as pd

from data_engine import calculate_kpis, prepare_data


class ReportDataTests(unittest.TestCase):
    def test_workbook_kpis_and_quality(self):
        raw = pd.read_excel("CPR.xlsx")
        df, quality = prepare_data(raw)
        kpis = calculate_kpis(df, quality)

        self.assertEqual(quality["source_rows"], 141)
        self.assertEqual(quality["duplicates_removed"], 2)
        self.assertEqual(kpis["total_events"], 139)
        self.assertEqual(kpis["success_count"], 64)
        self.assertEqual(kpis["failure_count"], 75)
        self.assertEqual(kpis["success_rate"], 46.0)
        self.assertEqual(kpis["top_department"], "CICU")
        self.assertEqual(kpis["top_shift"], "شب")
        self.assertEqual(kpis["best_supervisor"], "خانم رضائی")

    def test_outcome_columns_must_be_exclusive(self):
        raw = pd.read_excel("CPR.xlsx").head(1).copy()
        raw.loc[raw.index[0], "احیا ناموفق"] = "*"
        with self.assertRaises(ValueError):
            prepare_data(raw)


if __name__ == "__main__":
    unittest.main()
