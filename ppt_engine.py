# -*- coding: utf-8 -*-

"""Run the artifact-tool PowerPoint builder."""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import uuid
import zipfile
from pathlib import Path


def _find_node() -> str:
    explicit = os.environ.get("CPR_NODE")
    if explicit and Path(explicit).exists():
        return explicit
    node = shutil.which("node")
    if node:
        return node
    raise RuntimeError("Node.js was not found. Set CPR_NODE to the Node executable.")


def _find_artifact_workspace() -> Path:
    explicit = os.environ.get("CPR_ARTIFACT_WORKSPACE")
    if explicit:
        workspace = Path(explicit)
        if (workspace / "node_modules" / "@oai" / "artifact-tool").exists():
            return workspace
    local = Path("node_modules") / "@oai" / "artifact-tool"
    if local.exists():
        return Path.cwd()
    raise RuntimeError(
        "Artifact-tool workspace was not found. Set CPR_ARTIFACT_WORKSPACE to a "
        "workspace initialized with setup_artifact_tool_workspace.mjs."
    )


def generate_powerpoint(report_data_path: str, output_path: str) -> None:
    node = _find_node()
    artifact_workspace = _find_artifact_workspace()
    builder_source = Path(__file__).with_name("ppt_builder.mjs")
    builder_runtime = artifact_workspace / "cpr_ppt_builder.mjs"
    shutil.copy2(builder_source, builder_runtime)

    output = Path(output_path).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    build_output = output.with_name(
        f".{output.stem}.{uuid.uuid4().hex}.building{output.suffix}"
    )
    preview_dir = Path(
        os.environ.get(
            "CPR_PREVIEW_DIR",
            str(Path(tempfile.gettempdir()) / "cpr-report-previews"),
        )
    ).resolve()

    result = subprocess.run(
        [
            node,
            str(builder_runtime),
            "--data",
            str(Path(report_data_path).resolve()),
            "--output",
            str(build_output),
            "--preview",
            str(preview_dir),
        ],
        check=False,
    )
    if result.returncode != 0:
        valid_output = (
            build_output.exists()
            and build_output.stat().st_size > 0
            and zipfile.is_zipfile(build_output)
        )
        if not valid_output:
            raise subprocess.CalledProcessError(result.returncode, result.args)

    if not build_output.exists() or not zipfile.is_zipfile(build_output):
        raise RuntimeError("PowerPoint builder did not produce a valid PPTX file.")
    os.replace(build_output, output)

    inspect_sidecar = Path(f"{build_output}.inspect.ndjson")
    if inspect_sidecar.exists():
        inspect_sidecar.unlink()
