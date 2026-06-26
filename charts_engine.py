# -*- coding: utf-8 -*-

"""Compatibility module.

Charts are generated as editable native PowerPoint charts by ``ppt_builder.mjs``.
This module remains only so older integrations importing ``generate_all_charts``
do not fail.
"""


def generate_all_charts(df, kpis) -> None:
    return None
