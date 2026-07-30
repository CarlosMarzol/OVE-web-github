#!/usr/bin/env python3
"""Check the OVE Outlook inbox and report newly seen unread messages as JSON."""

from __future__ import annotations

import email
import imaplib
import json
import os
import re
from email.header import decode_header, make_header
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env.local"
STATE_PATH = ROOT / ".openclaw" / "ove-mail-state.json"


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def decode(value: str | None) -> str:
    if not value:
        return ""
    return str(make_header(decode_header(value))).strip()


def clean_text(value: str, limit: int = 700) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    return value[:limit] + ("..." if len(value) > limit else "")


def text_from_message(message: email.message.Message) -> str:
    if message.is_multipart():
        for part in message.walk():
            content_type = part.get_content_type()
            disposition = part.get_content_disposition()
            if content_type == "text/plain" and disposition != "attachment":
                payload = part.get_payload(decode=True) or b""
                charset = part.get_content_charset() or "utf-8"
                return payload.decode(charset, errors="replace")
        return ""

    payload = message.get_payload(decode=True) or b""
    charset = message.get_content_charset() or "utf-8"
    return payload.decode(charset, errors="replace")


def load_state() -> dict:
    if not STATE_PATH.exists():
        return {"reported_uids": []}
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"reported_uids": []}


def save_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    STATE_PATH.chmod(0o600)


def main() -> None:
    load_env(ENV_PATH)
    user = os.environ.get("OVE_IMAP_USER") or os.environ.get("OVE_SMTP_USER") or os.environ.get("OUTLOOK_SMTP_USER")
    password = os.environ.get("OVE_IMAP_PASS") or os.environ.get("OVE_SMTP_PASS") or os.environ.get("OUTLOOK_SMTP_PASS")
    host = os.environ.get("OVE_IMAP_HOST", "outlook.office365.com")
    port = int(os.environ.get("OVE_IMAP_PORT", "993"))

    if not user or not password:
        print(json.dumps({"ok": False, "error": "MAIL_CREDENTIALS_NOT_CONFIGURED"}))
        return

    state = load_state()
    reported = set(state.get("reported_uids", []))

    try:
      with imaplib.IMAP4_SSL(host, port) as inbox:
          inbox.login(user, password)
          inbox.select("INBOX", readonly=True)
          status, data = inbox.uid("search", None, "UNSEEN")
          if status != "OK":
              print(json.dumps({"ok": False, "error": "IMAP_SEARCH_FAILED"}))
              return

          uids = [uid.decode("ascii") for uid in data[0].split()]
          fresh_uids = [uid for uid in uids if uid not in reported]
          messages = []

          for uid in fresh_uids[-10:]:
              status, fetched = inbox.uid("fetch", uid, "(BODY.PEEK[])")
              if status != "OK" or not fetched or not fetched[0]:
                  continue
              raw = fetched[0][1]
              message = email.message_from_bytes(raw)
              messages.append({
                  "uid": uid,
                  "from": decode(message.get("From")),
                  "subject": decode(message.get("Subject")) or "(sin asunto)",
                  "date": decode(message.get("Date")),
                  "preview": clean_text(text_from_message(message)),
              })

          if fresh_uids:
              state["reported_uids"] = sorted((reported | set(fresh_uids)))[-500:]
              save_state(state)

          print(json.dumps({"ok": True, "new_count": len(messages), "messages": messages}, ensure_ascii=False))
    except imaplib.IMAP4.error:
        print(json.dumps({"ok": False, "error": "IMAP_AUTH_OR_ACCESS_FAILED"}))
    except Exception as exc:
        print(json.dumps({"ok": False, "error": "IMAP_CHECK_FAILED", "detail": exc.__class__.__name__}))


if __name__ == "__main__":
    main()
