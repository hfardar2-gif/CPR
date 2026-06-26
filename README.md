# CPR Management Report

This project validates the CPR workbook, normalizes Persian labels, removes exact
duplicate rows, calculates auditable KPIs, and builds a 10-slide management
PowerPoint with editable native charts.

## Run

1. Install the Python dependencies: `pandas`, `numpy`.
2. Initialize an `@oai/artifact-tool` workspace.
3. Set `CPR_ARTIFACT_WORKSPACE` to that workspace.
4. Run `python CPR_Report.py`.

Optional environment variables:

- `CPR_NODE`: full path to Node.js.
- `CPR_PREVIEW_DIR`: directory for rendered slide previews and layout checks.

The final deck is written to `output/CPR_Management_Report_Production.pptx`.
