from __future__ import annotations

import base64
import json
import sys
from io import BytesIO

from pypdf import PdfReader


def main() -> None:
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        raise ValueError("Missing JSON input on stdin.")

    payload = json.loads(raw_input)
    encoded_pdf = payload.get("data")

    if not encoded_pdf:
        raise ValueError("Missing PDF data.")

    pdf_bytes = base64.b64decode(encoded_pdf)
    reader = PdfReader(BytesIO(pdf_bytes))

    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")

    text = " ".join(" ".join(pages).split())

    sys.stdout.write(
        json.dumps(
            {
                "text": text,
                "pageCount": len(reader.pages),
            }
        )
    )


if __name__ == "__main__":
    main()
