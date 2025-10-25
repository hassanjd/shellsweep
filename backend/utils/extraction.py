import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Simple, defensive extraction pipeline with staged execution and limits.

MAX_EXTRACT_BYTES = 2 * 1024 * 1024 * 1024  # 2 GB
DEPTH_LIMIT = 4
TIMEOUT_S = 180  # per command
STD_TAIL_BYTES = 6000

SAFE_ARCHIVE_EXT = {".zip", ".tar", ".tgz", ".gz", ".xz", ".7z", ".rar"}
FS_HINTS = [
    ("squashfs", re.compile(r"squashfs", re.I)),
    ("ubifs", re.compile(r"ubifs|ubi filesystem", re.I)),
    ("jffs2", re.compile(r"jffs2", re.I)),
    ("cramfs", re.compile(r"cramfs", re.I)),
    ("ext", re.compile(r"ext(2|3|4)", re.I)),
    ("trx", re.compile(r"trx\b", re.I)),
    ("chk", re.compile(r"\.chk\b", re.I)),
]

class StageLog:
    def __init__(self, name: str):
        self.name = name
        self.status = "skipped"
        self.duration_ms = 0
        self.stdout_tail = ""
        self.stderr_tail = ""

    def to_dict(self):
        return {
            "name": self.name,
            "status": self.status,
            "duration_ms": self.duration_ms,
            "stdout_tail": self.stdout_tail,
            "stderr_tail": self.stderr_tail,
        }


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def run_cmd(cmd: List[str], cwd: Optional[Path] = None, timeout: int = TIMEOUT_S) -> Tuple[int, str, str]:
    try:
        p = subprocess.run(
            cmd,
            cwd=str(cwd) if cwd else None,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return p.returncode, p.stdout or "", p.stderr or ""
    except Exception as e:
        return -1, "", str(e)


def file_magic(path: Path) -> str:
    # Try native 'file', fallback to simple header read
    code, out, err = run_cmd(["file", "-b", str(path)])
    if code == 0 and out:
        return out.strip()
    # Fallback heuristic
    with open(path, "rb") as f:
        head = f.read(4096)
    if b"squashfs" in head:
        return "Squashfs filesystem"
    if b"UBI#" in head or b"UBI" in head:
        return "UBI filesystem"
    if b"HSQS" in head:
        return "Squashfs (HSQS)"
    return "Unknown"


def ensure_within(base: Path, target: Path) -> bool:
    try:
        base = base.resolve()
        target = target.resolve()
        return str(target).startswith(str(base))
    except Exception:
        return False


def safe_extract_tree_size(root: Path) -> int:
    total = 0
    for p in root.rglob("*"):
        if p.is_file():
            try:
                total += p.stat().st_size
            except Exception:
                pass
    return total


def try_tool_or_wsl(cmd: List[str]) -> Tuple[int, str, str]:
    # Try native first
    code, out, err = run_cmd(cmd)
    if code == 0:
        return code, out, err
    # Fallback to WSL if available
    wsl_cmd = ["wsl"] + cmd
    return run_cmd(wsl_cmd)


def stage_quick_detect(fw_path: Path, workdir: Path) -> Tuple[StageLog, Dict]:
    stage = StageLog("quick_detect")
    t0 = time.time()
    info: Dict = {"magic": "", "binwalk": ""}
    try:
        magic = file_magic(fw_path)
        info["magic"] = magic
        # Prefer targeted binwalk signatures to reduce noise
        code, out, err = try_tool_or_wsl(["binwalk", str(fw_path)])
        info["binwalk"] = out[-STD_TAIL_BYTES:]
        stage.stdout_tail = out[-STD_TAIL_BYTES:]
        stage.stderr_tail = err[-STD_TAIL_BYTES:]
        stage.status = "success" if code == 0 else "failed"
    except Exception as e:
        stage.status = "failed"
        stage.stderr_tail = str(e)
    finally:
        stage.duration_ms = int((time.time() - t0) * 1000)
    return stage, info


def extract_archive(path: Path, outdir: Path) -> Tuple[int, str, str]:
    ext = path.suffix.lower()
    if ext == ".zip":
        return try_tool_or_wsl(["unzip", "-o", str(path), "-d", str(outdir)])
    if ext in {".tar", ".tgz"} or path.name.endswith(".tar.gz") or path.name.endswith(".tar.xz"):
        return try_tool_or_wsl(["tar", "-xf", str(path), "-C", str(outdir)])
    if ext in {".gz", ".xz"} and not path.name.endswith(".tar.gz") and not path.name.endswith(".tar.xz"):
        # Single file compression; let 7z handle
        return try_tool_or_wsl(["7z", "x", "-y", str(path), f"-o{str(outdir)}"])
    if ext in {".7z", ".rar"}:
        return try_tool_or_wsl(["7z", "x", "-y", str(path), f"-o{str(outdir)}"])
    # Fallback
    return try_tool_or_wsl(["7z", "x", "-y", str(path), f"-o{str(outdir)}"])


def stage_deep_extract(fw_path: Path, workdir: Path, depth: int = 0) -> List[StageLog]:
    stages: List[StageLog] = []
    if depth > DEPTH_LIMIT:
        return stages

    # Attempt archive extraction first
    if fw_path.suffix.lower() in SAFE_ARCHIVE_EXT or any(fw_path.name.endswith(s) for s in (".tar.gz", ".tar.xz")):
        st = StageLog(f"extract_archive_d{depth}")
        t0 = time.time()
        outdir = workdir / f"archive_d{depth}"
        outdir.mkdir(parents=True, exist_ok=True)
        code, out, err = extract_archive(fw_path, outdir)
        st.stdout_tail = out[-STD_TAIL_BYTES:]
        st.stderr_tail = err[-STD_TAIL_BYTES:]
        st.status = "success" if code == 0 else "failed"
        st.duration_ms = int((time.time() - t0) * 1000)
        stages.append(st)
        if code == 0:
            if safe_extract_tree_size(workdir) > MAX_EXTRACT_BYTES:
                return stages
            # Recurse into extracted files
            for p in outdir.rglob("*"):
                if p.is_file():
                    stages.extend(stage_deep_extract(p, workdir, depth + 1))
        return stages

    # Targeted FS handlers via magic
    magic = file_magic(fw_path).lower()

    def run_and_record(name: str, cmd: List[str], outdir: Path) -> StageLog:
        st = StageLog(f"{name}_d{depth}")
        t0 = time.time()
        outdir.mkdir(parents=True, exist_ok=True)
        code, out, err = try_tool_or_wsl(cmd)
        st.stdout_tail = out[-STD_TAIL_BYTES:]
        st.stderr_tail = err[-STD_TAIL_BYTES:]
        st.status = "success" if code == 0 else "failed"
        st.duration_ms = int((time.time() - t0) * 1000)
        return st

    # squashfs
    if "squashfs" in magic or fw_path.suffix.lower() in {".squashfs"}:
        outdir = workdir / f"squashfs_d{depth}"
        stages.append(run_and_record("unsquashfs", ["unsquashfs", "-d", str(outdir), str(fw_path)], outdir))
        if safe_extract_tree_size(workdir) > MAX_EXTRACT_BYTES:
            return stages
        return stages

    # ubifs / jffs2 (best-effort)
    if "ubifs" in magic or "ubi" in magic:
        outdir = workdir / f"ubifs_d{depth}"
        st = run_and_record("ubireader_extract", ["ubireader_extract_images", str(fw_path), "-o", str(outdir)], outdir)
        stages.append(st)
        return stages

    if "jffs2" in magic:
        # jefferson requires Python module; we try via CLI if available
        outdir = workdir / f"jffs2_d{depth}"
        stages.append(run_and_record("jefferson", ["jefferson", str(fw_path), "-d", str(outdir)], outdir))
        return stages

    if "cramfs" in magic:
        outdir = workdir / f"cramfs_d{depth}"
        stages.append(run_and_record("cramfsck", ["cramfsck", "-x", str(outdir), str(fw_path)], outdir))
        return stages

    # fallback: binwalk -e
    outdir = workdir
    st = StageLog(f"binwalk_extract_d{depth}")
    t0 = time.time()
    code, out, err = try_tool_or_wsl(["binwalk", "-e", str(fw_path)])
    st.stdout_tail = out[-STD_TAIL_BYTES:]
    st.stderr_tail = err[-STD_TAIL_BYTES:]
    st.status = "success" if code == 0 else "failed"
    st.duration_ms = int((time.time() - t0) * 1000)
    stages.append(st)

    return stages


def enumerate_summary(workdir: Path) -> Tuple[Dict, List[Dict], Dict]:
    filesystems: List[str] = []
    vendor_hints: List[str] = []
    kernel_found = False
    rootfs_count = 0
    artifacts: List[Dict] = []

    totals_files = 0
    totals_dirs = 0
    totals_bytes = 0

    credentials: List[Dict] = []
    keys: List[Dict] = []
    certs: List[Dict] = []
    web_configs: List[Dict] = []
    web_roots: List[Dict] = []
    init_scripts: List[Dict] = []
    suid_binaries: List[Dict] = []
    busybox = {"present": False}

    for p in workdir.rglob("*"):
        try:
            if p.is_dir():
                totals_dirs += 1
                continue
        except Exception:
            continue

        if p.is_file():
            totals_files += 1
            try:
                size = p.stat().st_size
                totals_bytes += size
            except Exception:
                size = 0
            name = p.name.lower()

            # kernel indicators
            if re.search(r"vmlinux|zimage|uimage|bzimage", name):
                kernel_found = True

            # FS hints via magic
            try:
                m = file_magic(p).lower()
            except Exception:
                m = ""
            for fs, rx in FS_HINTS:
                if rx.search(m):
                    filesystems.append(fs)
            if "trx" in name or re.search(r"\btrx\b", m):
                vendor_hints.append("trx")
            if name.endswith(('.squashfs', '.ubi', '.jffs2', '.cramfs')):
                rootfs_count += 1

            # Credentials
            rel = p.relative_to(workdir)
            rels = str(rel).replace('\\', '/')
            if re.search(r"(^|/)etc/(passwd|shadow|group)$", rels):
                credentials.append({"path": rels, "type": "system"})
            if re.search(r"(^|/)etc/(default|config|network|wpa_supplicant\.conf|hostapd\.conf)", rels):
                credentials.append({"path": rels, "type": "network"})

            # Keys and certs
            if re.search(r"\.(key|pem)$", name) or re.search(r"(^|/)ssh/.*(id_rsa|id_ecdsa)$", rels):
                keys.append({"path": rels, "type": "private_key"})
            if re.search(r"\.(crt|cer)$", name):
                certs.append({"path": rels})

            # Web configs and roots
            if re.search(r"(^|/)(nginx|lighttpd|uhttpd|boa)/.*(conf|config)$", rels) or re.search(r"(^|/)etc/(nginx|lighttpd|uhttpd|boa)/", rels):
                web_configs.append({"path": rels, "server": "auto"})
            if re.search(r"(^|/)(www|htdocs|web|wwwroot)(/|$)", rels):
                web_roots.append({"path": rels})

            # Init/system scripts
            if re.search(r"(^|/)etc/init\.d/", rels) or re.search(r"(^|/)etc/inittab$", rels) or re.search(r"(^|/)etc/cron", rels):
                init_scripts.append({"path": rels})

            # SUID binaries (best-effort)
            if name == "busybox" and not busybox["present"]:
                busybox = {"present": True, "path": rels}

            # record artifact (> 0 bytes)
            if size > 0:
                artifacts.append({
                    "type": "file",
                    "path": rels,
                    "size": size,
                    "notes": ""
                })

    filesystems = sorted(set(filesystems))
    vendor_hints = sorted(set(vendor_hints))
    summary = {
        "filesystems": filesystems,
        "kernel_found": kernel_found,
        "rootfs_count": rootfs_count,
        "vendor_hints": vendor_hints,
    }

    inventory = {
        "totals": {"files": totals_files, "dirs": totals_dirs, "bytes": totals_bytes},
        "matches": {
            "credentials": credentials[:500],
            "keys": keys[:500],
            "certs": certs[:500],
            "web_configs": web_configs[:500],
            "web_roots": web_roots[:500],
            "init_scripts": init_scripts[:500],
            "suid_binaries": suid_binaries[:500],
            "busybox": busybox,
        },
    }

    return summary, artifacts, inventory


def analyze_firmware_pipeline(uploaded_path: str) -> Dict:
    src = Path(uploaded_path)
    session_id = str(uuid.uuid4())
    session_dir = Path(os.getcwd()) / "firmware_uploads" / f"session-{session_id}"
    session_dir.mkdir(parents=True, exist_ok=True)

    # Copy uploaded into session dir for isolation
    target_fw = session_dir / src.name
    shutil.copy2(src, target_fw)

    sha = sha256_file(target_fw)

    stages: List[Dict] = []

    # Stage 1: quick detect
    st1, info = stage_quick_detect(target_fw, session_dir)
    stages.append(st1.to_dict())

    # Stage 2: deep extract
    deep_stages = stage_deep_extract(target_fw, session_dir, 0)
    for s in deep_stages:
        stages.append(s.to_dict())
        if safe_extract_tree_size(session_dir) > MAX_EXTRACT_BYTES:
            break

    # Post process
    summary, artifacts, inventory = enumerate_summary(session_dir)

    result = {
        "status": "success",
        "session_id": session_id,
        "sha256": sha,
        "summary": summary,
        "artifacts": artifacts[:5000],  # cap to avoid giant responses
        "stages": stages,
        "inventory": inventory,
        "limits": {"max_bytes": MAX_EXTRACT_BYTES, "timeout_s": TIMEOUT_S, "depth_limit": DEPTH_LIMIT},
    }
    return result
