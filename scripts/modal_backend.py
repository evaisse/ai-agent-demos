#!/usr/bin/env python3

import base64
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

try:
    import modal
except ImportError as exc:
    print(
        json.dumps(
            {
                "status": "runtime_error",
                "errors": [
                    f"Modal Python SDK is required locally. Install it with: python3 -m pip install modal ({exc})"
                ],
            }
        )
    )
    sys.exit(2)


APP_NAME = os.environ.get("BENCH_MODAL_APP_NAME", "opencode-bench-runner")
OPENCODE_INSTALL_COMMAND = os.environ.get(
    "BENCH_OPENCODE_INSTALL_COMMAND", "bun install -g opencode-ai"
)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("curl", "git")
    .run_commands(
        "curl -fsSL https://bun.sh/install | bash",
        "ln -sf /root/.bun/bin/bun /usr/local/bin/bun",
        OPENCODE_INSTALL_COMMAND,
        "opencode --version",
    )
)

app = modal.App(APP_NAME)


@app.function(image=image, timeout=60 * 60)
def execute_benchmark(payload: dict) -> dict:
    started_at = time.time()
    errors = []

    with tempfile.TemporaryDirectory(prefix="opencode-bench-") as temp_dir:
        workspace = Path(temp_dir) / "workspace"
        workspace.mkdir(parents=True, exist_ok=True)

        for relative_path, content in payload["workspaceFiles"].items():
            destination = workspace / relative_path
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(content, encoding="utf-8")

        subprocess.run(
            ["git", "init"],
            cwd=workspace,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )

        config_content = {
            "$schema": "https://opencode.ai/config.json",
            "model": payload["opencodeModel"],
        }
        (workspace / "opencode.json").write_text(
            json.dumps(config_content, indent=2), encoding="utf-8"
        )

        env = os.environ.copy()
        env["OPENROUTER_API_KEY"] = payload["openrouterKey"]
        env["OPENCODE_CLIENT"] = "bench-modal"
        env["OPENCODE_DISABLE_AUTOUPDATE"] = "1"
        env["OPENCODE_DISABLE_PRUNE"] = "1"

        command = [
            "opencode",
            "run",
            "--agent",
            payload.get("opencodeAgent", "build"),
            "--model",
            payload["opencodeModel"],
            "--format",
            "json",
            "--title",
            payload["runId"],
            payload["instruction"],
        ]

        status = "success"
        stdout = ""
        stderr = ""

        try:
            completed = subprocess.run(
                command,
                cwd=workspace,
                env=env,
                capture_output=True,
                text=True,
                timeout=payload["timeoutSeconds"],
                check=False,
            )
            stdout = completed.stdout
            stderr = completed.stderr
            if completed.returncode != 0:
                status = "runtime_error"
                errors.append(f"opencode run exited with code {completed.returncode}")
        except subprocess.TimeoutExpired as exc:
            stdout = exc.stdout or ""
            stderr = exc.stderr or ""
            status = "timeout"
            errors.append(
                f"opencode run exceeded timeout of {payload['timeoutSeconds']}s"
            )
        except Exception as exc:  # pragma: no cover - defensive
            status = "runtime_error"
            errors.append(f"Unexpected remote execution error: {exc}")

        parsed_events = parse_json_lines(stdout)
        session_id = extract_session_id(parsed_events)
        export_payload = None

        if session_id:
            exported = subprocess.run(
                ["opencode", "export", session_id],
                cwd=workspace,
                env=env,
                capture_output=True,
                text=True,
                check=False,
            )
            if exported.returncode == 0 and exported.stdout.strip():
                export_payload = try_parse_json(exported.stdout)
            elif exported.stderr.strip():
                errors.append(f"opencode export failed: {exported.stderr.strip()}")

        api_usage = extract_usage(parsed_events, export_payload)
        final_message = extract_final_message(parsed_events, stdout)
        artifacts, artifact_contents = collect_artifacts(
            workspace, payload["expectedArtifacts"]
        )

        ended_at = time.time()
        return {
            "status": status,
            "timing": {
                "started_at": iso_timestamp(started_at),
                "ended_at": iso_timestamp(ended_at),
                "duration_ms": int((ended_at - started_at) * 1000),
            },
            "apiUsage": api_usage,
            "agent": {
                "system": "opencode",
                "loop_style": "cli-run",
                "turns_completed": extract_turn_count(parsed_events),
                "final_message_path": "final-message.md",
                "session_id": session_id,
            },
            "artifacts": artifacts,
            "artifactContents": artifact_contents,
            "finalMessage": final_message,
            "stdout": stdout,
            "stderr": stderr,
            "opencodeExport": export_payload,
            "opencodeEvents": parsed_events,
            "errors": errors,
        }


def parse_json_lines(stdout: str) -> list:
    events = []
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return events


def try_parse_json(raw: str):
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"raw": raw}


def extract_session_id(events: list):
    for event in events:
        for key in ("sessionID", "sessionId", "session_id"):
            if isinstance(event, dict) and key in event and isinstance(event[key], str):
                return event[key]
        if isinstance(event, dict):
            info = event.get("info")
            if isinstance(info, dict):
                for key in ("sessionID", "sessionId", "session_id"):
                    if isinstance(info.get(key), str):
                        return info[key]
    return None


def extract_turn_count(events: list) -> int:
    count = 0
    for event in events:
        event_type = event.get("type") if isinstance(event, dict) else None
        if isinstance(event_type, str) and "message" in event_type.lower():
            count += 1
    return count


def extract_final_message(events: list, stdout: str) -> str:
    for event in reversed(events):
        if not isinstance(event, dict):
            continue
        for key in ("text", "content", "message"):
            value = event.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip() + "\n"
        info = event.get("info")
        if isinstance(info, dict):
            for key in ("text", "content", "message"):
                value = info.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip() + "\n"
    return stdout.strip() + ("\n" if stdout.strip() else "")


def extract_usage(events: list, export_payload) -> dict:
    totals = {
        "input": 0,
        "output": 0,
        "total": 0,
        "cost_usd": 0.0,
        "api_calls": 0,
        "tool_calls": 0,
    }

    def visit(node):
        if isinstance(node, dict):
            if any(
                key in node
                for key in (
                    "prompt_tokens",
                    "completion_tokens",
                    "total_tokens",
                    "inputTokens",
                    "outputTokens",
                )
            ):
                prompt_tokens = as_int(
                    node.get("prompt_tokens", node.get("inputTokens", 0))
                )
                completion_tokens = as_int(
                    node.get("completion_tokens", node.get("outputTokens", 0))
                )
                total_tokens = as_int(
                    node.get(
                        "total_tokens",
                        node.get("totalTokens", prompt_tokens + completion_tokens),
                    )
                )
                totals["input"] = max(totals["input"], prompt_tokens)
                totals["output"] = max(totals["output"], completion_tokens)
                totals["total"] = max(totals["total"], total_tokens)
            if "cost" in node and isinstance(node["cost"], (int, float)):
                totals["cost_usd"] = max(totals["cost_usd"], float(node["cost"]))
            if "cost_usd" in node and isinstance(node["cost_usd"], (int, float)):
                totals["cost_usd"] = max(totals["cost_usd"], float(node["cost_usd"]))
            event_type = node.get("type")
            if isinstance(event_type, str):
                if "tool" in event_type.lower():
                    totals["tool_calls"] += 1
                if "request" in event_type.lower() or "message" in event_type.lower():
                    totals["api_calls"] += 1
            for value in node.values():
                visit(value)
        elif isinstance(node, list):
            for item in node:
                visit(item)

    visit(events)
    if export_payload is not None:
        visit(export_payload)

    return {
        "tokens": {
            "input": totals["input"],
            "output": totals["output"],
            "total": totals["total"],
        },
        "cost_usd": round(totals["cost_usd"], 6),
        "api_calls": totals["api_calls"],
        "tool_calls": totals["tool_calls"],
        "raw": {
            "events": events,
            "export": export_payload,
        },
    }


def collect_artifacts(workspace: Path, expected_artifacts: list):
    artifacts = []
    contents = {}
    for artifact_name in expected_artifacts:
        source = workspace / artifact_name
        exists = source.exists()
        relative_output_path = f"artifacts/{artifact_name}"
        artifact_record = {
            "path": relative_output_path,
            "type": infer_artifact_type(artifact_name),
            "required": True,
            "exists": exists,
        }
        if exists:
            if is_text_file(source):
                contents[relative_output_path] = {
                    "encoding": "utf-8",
                    "content": source.read_text(encoding="utf-8"),
                }
            else:
                contents[relative_output_path] = {
                    "encoding": "base64",
                    "content": base64.b64encode(source.read_bytes()).decode("ascii"),
                }
        artifacts.append(artifact_record)
    return artifacts, contents


def infer_artifact_type(name: str) -> str:
    suffix = Path(name).suffix.lower()
    if suffix == ".html":
        return "html"
    if suffix in {".png", ".jpg", ".jpeg", ".webp"}:
        return "image"
    return "file"


def is_text_file(file_path: Path) -> bool:
    return file_path.suffix.lower() in {".html", ".md", ".json", ".txt", ".js", ".css"}


def as_int(value) -> int:
    try:
        return int(value)
    except Exception:
        return 0


def iso_timestamp(value: float) -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(value))


def main():
    payload = json.loads(sys.stdin.read())
    with app.run():
        result = execute_benchmark.remote(payload)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
