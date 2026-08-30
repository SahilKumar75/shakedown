import json
import random
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from shakedown import bundle as bundle_module
from shakedown import runner


LEDGER_CASE_SOURCE = r'''
def make_case(rng):
    memos = ["rent", "coffee", "salary", "books", "fuel", "tickets", "repair", "gift"]
    wanted = rng.randint(7, 11)
    pool = set()
    while len(pool) < wanted:
        pool.add("TX%04d" % rng.randrange(1000, 9999))
    idents = sorted(pool)
    base = 1700000000
    epochs = []
    previous = base
    for index in range(len(idents)):
        if index and rng.random() < 0.3:
            epochs.append(previous)
        else:
            previous = base + rng.randrange(0, 90000)
            epochs.append(previous)
    rows = []
    for index, ident in enumerate(idents):
        rows.append((ident, epochs[index], rng.randrange(10, 9000), rng.choice(memos)))
    split = max(2, len(rows) // 2)
    alpha = rows[:split]
    beta = rows[split:]
    for ident, epoch, amount, memo in rng.sample(alpha, k=min(2, len(alpha))):
        beta.append((ident, epoch, amount + rng.randrange(1, 50), rng.choice(memos)))
    rng.shuffle(alpha)
    rng.shuffle(beta)
    lines = ["SOURCE alpha"]
    for row in alpha:
        lines.append("|".join([row[0], str(row[1]), str(row[2]), row[3]]))
    lines.append("SOURCE beta")
    for row in beta:
        lines.append("|".join([row[0], str(row[1]), str(row[2]), row[3]]))
    return ("\n".join(lines) + "\n").encode("utf8")
'''

LEDGER_REFERENCE_SOURCE = r'''
def expected_text(blob):
    text = bytes(blob).decode("utf8")
    order = []
    rows = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("SOURCE "):
            continue
        fields = line.split("|")
        key = fields[0]
        if key in rows:
            continue
        rows[key] = (int(fields[1]), int(fields[2]))
        order.append(key)
    ranked = sorted(order, key=lambda key: (rows[key][0], key))
    running = 0
    out = []
    for key in ranked:
        epoch, amount = rows[key]
        running = running + amount
        out.append("%s %d %d %d" % (key, epoch, amount, running))
    return "\n".join(out) + "\n"
'''

LEDGER_SOLVE = r'''import sys


def parse(text):
    alpha = []
    beta = []
    bucket = alpha
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("SOURCE "):
            bucket = alpha if line.split()[1] == "alpha" else beta
            continue
        parts = line.split("|")
        bucket.append((parts[0], int(parts[1]), int(parts[2])))
    return alpha, beta


def merge(alpha, beta):
    seen = set()
    rows = []
    for entry in alpha:
        if entry[0] in seen:
            continue
        seen.add(entry[0])
        rows.append(entry)
    for entry in beta:
        if entry[0] in seen:
            continue
        seen.add(entry[0])
        rows.append(entry)
    rows.sort(key=lambda entry: (entry[1], entry[0]))
    return rows


def render(rows):
    total = 0
    lines = []
    for ident, epoch, amount in rows:
        total = total + amount
        lines.append(" ".join([ident, str(epoch), str(amount), str(total)]))
    return "\n".join(lines) + "\n"


def main():
    text = open(sys.argv[1], "rb").read().decode("utf8")
    alpha, beta = parse(text)
    handle = open(sys.argv[2], "w", encoding="utf8")
    handle.write(render(merge(alpha, beta)))
    handle.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
'''

LEDGER_BROKEN = r'''import sys


def parse(text):
    alpha = []
    beta = []
    bucket = alpha
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("SOURCE "):
            bucket = alpha if line.split()[1] == "alpha" else beta
            continue
        parts = line.split("|")
        bucket.append((parts[0], int(parts[1]), int(parts[2])))
    return alpha, beta


def merge(alpha, beta):
    seen = set()
    rows = []
    for entry in alpha:
        if entry[0] in seen:
            continue
        seen.add(entry[0])
        rows.append(entry)
    for entry in beta:
        if entry[0] in seen:
            continue
        seen.add(entry[0])
        rows.append(entry)
    rows.sort(key=lambda entry: (entry[1], entry[0]))
    return rows


def render(rows):
    total = 0
    lines = []
    for ident, epoch, amount in rows:
        lines.append(" ".join([ident, str(epoch), str(amount), str(total)]))
        total = total + amount
    return "\n".join(lines) + "\n"


def main():
    text = open(sys.argv[1], "rb").read().decode("utf8")
    alpha, beta = parse(text)
    handle = open(sys.argv[2], "w", encoding="utf8")
    handle.write(render(merge(alpha, beta)))
    handle.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
'''

LEDGER_INSTRUCTION = """# Merge two transaction logs into one ledger

You are given one input file that holds two transaction logs, written one after the other. Each log starts with a line of the form `SOURCE alpha` or `SOURCE beta` and is followed by one transaction per line.

A transaction line has four fields separated by the pipe character:

```
identifier|epoch|amount|memo
```

The identifier is a short token. The epoch is a whole number of seconds. The amount is a whole number of cents. The memo is free text and carries no meaning for this task.

Produce the merged ledger.

1. Read every transaction from both logs.
2. If the same identifier appears more than once, keep only the first occurrence in file order and discard the later ones, whatever their amount says.
3. Sort the kept transactions by epoch ascending. When two transactions share an epoch, order them by identifier ascending, comparing the identifiers as text.
4. Walk the sorted transactions and keep a running total of the amounts, starting from zero. The running total on a line includes the amount on that same line.

Write one line per kept transaction to the output file, fields separated by single spaces:

```
identifier epoch amount running_total
```

End the file with a trailing newline.

Your program is run as `python3 your_program.py input_path output_path`. It must read the input file at the first path and write the ledger to the second path.
"""

LEDGER_NOTES = """# Format notes

The input file is UTF8 text.

Section headers look like `SOURCE alpha` and `SOURCE beta`. Everything between one header and the next belongs to that log.

Transaction lines carry four pipe separated fields. Blank lines may appear anywhere and mean nothing.

The memo field may repeat between transactions and may contain spaces. It never contains a pipe character.

Amounts are whole numbers of cents and are always positive.

The example input and the example output in this folder are a matched pair. Reproducing that pair exactly is a good first check of your reading of the rules.
"""

RECORD_CASE_SOURCE = r'''
def make_case(rng):
    words = ["alpha", "bravo", "cargo", "delta", "ember", "flint", "gamma", "harbour", "indigo", "juniper"]
    frames = []
    records = rng.randint(3, 6)
    for position in range(records):
        text = " ".join(rng.choice(words) for _ in range(rng.randint(2, 5)))
        frames.append((1, text.encode("ascii")))
        extras = 1 if position == 0 else rng.randint(0, 2)
        for _ in range(extras):
            more = " " + " ".join(rng.choice(words) for _ in range(rng.randint(1, 3)))
            frames.append((2, more.encode("ascii")))
        if rng.random() < 0.5:
            noise = bytes(rng.randrange(0, 256) for _ in range(rng.randint(1, 6)))
            frames.append((0, noise))
    blob = bytearray()
    for tag, payload in frames:
        blob.append(tag)
        blob.append((len(payload) >> 8) & 255)
        blob.append(len(payload) & 255)
        blob.extend(payload)
    return bytes(blob)
'''

RECORD_REFERENCE_SOURCE = r'''
def expected_text(blob):
    data = bytes(blob)
    offset = 0
    records = []
    current = None
    while offset + 3 <= len(data):
        tag = data[offset]
        size = (data[offset + 1] << 8) | data[offset + 2]
        payload = data[offset + 3:offset + 3 + size]
        offset = offset + 3 + size
        if tag == 1:
            if current is not None:
                records.append(current)
            current = payload.decode("ascii", "replace")
        elif tag == 2 and current is not None:
            current = current + payload.decode("ascii", "replace")
    if current is not None:
        records.append(current)
    out = []
    for index, text in enumerate(records, start=1):
        out.append("%d %d %s" % (index, len(text), text))
    return "\n".join(out) + "\n"
'''

RECORD_SOLVE = r'''import struct
import sys


def frames(data):
    offset = 0
    while offset + 3 <= len(data):
        tag, size = struct.unpack_from(">BH", data, offset)
        payload = data[offset + 3:offset + 3 + size]
        if len(payload) < size:
            return
        offset = offset + 3 + size
        yield tag, payload


def rebuild(data):
    records = []
    current = None
    for tag, payload in frames(data):
        if tag == 1:
            if current is not None:
                records.append(current)
            current = bytearray(payload)
        elif tag == 2 and current is not None:
            current.extend(payload)
    if current is not None:
        records.append(current)
    return [bytes(item).decode("ascii", "replace") for item in records]


def main():
    data = open(sys.argv[1], "rb").read()
    lines = []
    index = 1
    for text in rebuild(data):
        lines.append("%d %d %s" % (index, len(text), text))
        index = index + 1
    handle = open(sys.argv[2], "w", encoding="utf8")
    handle.write("\n".join(lines) + "\n")
    handle.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
'''

RECORD_BROKEN = r'''import struct
import sys


def frames(data):
    offset = 0
    while offset + 3 <= len(data):
        tag, size = struct.unpack_from(">BH", data, offset)
        payload = data[offset + 3:offset + 3 + size]
        if len(payload) < size:
            return
        offset = offset + 3 + size
        yield tag, payload


def rebuild(data):
    records = []
    for tag, payload in frames(data):
        if tag == 1:
            records.append(bytearray(payload))
        elif tag == 2:
            continue
    return [bytes(item).decode("ascii", "replace") for item in records]


def main():
    data = open(sys.argv[1], "rb").read()
    lines = []
    index = 1
    for text in rebuild(data):
        lines.append("%d %d %s" % (index, len(text), text))
        index = index + 1
    handle = open(sys.argv[2], "w", encoding="utf8")
    handle.write("\n".join(lines) + "\n")
    handle.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
'''

RECORD_INSTRUCTION = """# Recover the records from a framed dump

You are given a binary dump. The dump is a flat sequence of frames with no header, no footer and no index. Frames sit back to back until the file ends.

Every frame begins with three bytes:

```
byte 0      tag
byte 1, 2   payload length, big endian, unsigned
```

The payload follows immediately and is exactly that many bytes long. The next frame starts right after it.

Three tags are defined:

```
tag 1   the payload starts a new record and holds ASCII text
tag 2   the payload continues the record that started most recently
tag 0   the payload is padding and carries nothing
```

Rebuild every record in the order the records were started, appending each continuation payload to the text of the record it continues.

Write one line per record to the output file:

```
index length text
```

The index counts records from one. The length is the number of characters in the rebuilt text, after every continuation has been joined on. The text is the rebuilt text itself, which may contain spaces. End the file with a trailing newline.

Your program is run as `python3 your_program.py input_path output_path`. It must read the dump at the first path and write the recovered records to the second path.
"""

RECORD_NOTES = """# Format notes

The dump is binary. Read it in binary mode.

The length field is two bytes, most significant byte first, so a payload of 300 bytes is written as the two bytes 1 and 44.

Padding frames may appear anywhere, including before the first record. Their payload is arbitrary and may contain bytes that are not valid ASCII. Skip the payload using the declared length and carry on with the next frame.

A continuation frame always follows the record it belongs to, though other padding frames may sit between them.

The example dump and the example output in this folder are a matched pair.
"""

ADDRESS_CASE_SOURCE = r'''
def scramble(rng, text):
    parts = text.split(" ")
    out = []
    for part in parts:
        if rng.random() < 0.4:
            part = part.upper()
        elif rng.random() < 0.3:
            part = part.capitalize()
        out.append(part)
    joiner = "  " if rng.random() < 0.4 else " "
    body = joiner.join(out)
    if rng.random() < 0.3:
        body = " " + body
    if rng.random() < 0.3:
        body = body + "  "
    return body


def blur(rng, code):
    body = code
    if rng.random() < 0.4:
        body = body.lstrip("0")
    if rng.random() < 0.3:
        body = " " + body + " "
    if rng.random() < 0.3:
        body = body[:2] + " " + body[2:]
    return body


def make_case(rng):
    firsts = ["ada", "brij", "carla", "dinesh", "elena", "farid", "gita", "hugo"]
    lasts = ["mehra", "okafor", "silva", "novak", "chen", "haddad", "rossi", "khan"]
    streets = ["maple street", "harbour road", "kiln lane", "orchard way", "quarry rise", "linden close"]
    cities = ["bristol", "leeds", "porto", "graz", "utrecht", "cork"]
    rows = []
    for _ in range(rng.randint(6, 9)):
        name = rng.choice(firsts) + " " + rng.choice(lasts)
        street = str(rng.randrange(1, 200)) + " " + rng.choice(streets)
        rows.append((name, street, rng.choice(cities), "%05d" % rng.randrange(0, 99999)))
    rows.extend(rng.sample(rows, k=min(2, len(rows))))
    rng.shuffle(rows)
    lines = []
    for name, street, city, code in rows:
        tail = rng.choice(["", ".", ","])
        lines.append(";".join([scramble(rng, name), scramble(rng, street) + tail, scramble(rng, city), blur(rng, code)]))
    return ("\n".join(lines) + "\n").encode("utf8")
'''

ADDRESS_REFERENCE_SOURCE = r'''
def tidy(value):
    return " ".join(value.split())


def expected_text(blob):
    text = bytes(blob).decode("utf8")
    seen = set()
    kept = []
    for raw in text.splitlines():
        if not raw.strip():
            continue
        fields = raw.split(";")
        if len(fields) != 4:
            continue
        name = tidy(fields[0]).title()
        street = tidy(fields[1].replace(".", "").replace(",", "")).lower()
        city = tidy(fields[2]).upper()
        digits = "".join(character for character in fields[3] if character.isdigit())
        code = digits.rjust(5, "0")
        key = (code, name, street, city)
        if key in seen:
            continue
        seen.add(key)
        kept.append(key)
    kept.sort(key=lambda item: (item[0], item[1], item[2]))
    out = []
    for code, name, street, city in kept:
        out.append("|".join([code, name, street, city]))
    return "\n".join(out) + "\n"
'''

ADDRESS_SOLVE = r'''import re
import sys

SPACES = re.compile(r"\s+")
NOISE = re.compile(r"[.,]")


def normalise(line):
    fields = line.split(";")
    if len(fields) != 4:
        return None
    name = SPACES.sub(" ", fields[0].strip()).title()
    street = SPACES.sub(" ", NOISE.sub("", fields[1]).strip()).lower()
    city = SPACES.sub(" ", fields[2].strip()).upper()
    code = SPACES.sub("", fields[3])
    code = "".join(character for character in code if character in "0123456789")
    while len(code) < 5:
        code = "0" + code
    return (code, name, street, city)


def main():
    text = open(sys.argv[1], "rb").read().decode("utf8")
    kept = []
    seen = set()
    for line in text.splitlines():
        if not line.strip():
            continue
        record = normalise(line)
        if record is None or record in seen:
            continue
        seen.add(record)
        kept.append(record)
    kept.sort(key=lambda record: (record[0], record[1], record[2]))
    handle = open(sys.argv[2], "w", encoding="utf8")
    handle.write("\n".join("|".join(record) for record in kept) + "\n")
    handle.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
'''

ADDRESS_BROKEN = r'''import re
import sys

SPACES = re.compile(r"\s+")
NOISE = re.compile(r"[.,]")


def normalise(line):
    fields = line.split(";")
    if len(fields) != 4:
        return None
    name = SPACES.sub(" ", fields[0].strip()).title()
    street = SPACES.sub(" ", NOISE.sub("", fields[1]).strip()).lower()
    city = SPACES.sub(" ", fields[2].strip()).upper()
    code = SPACES.sub("", fields[3])
    code = "".join(character for character in code if character in "0123456789")
    while len(code) < 5:
        code = "0" + code
    return (code, name, street, city)


def main():
    text = open(sys.argv[1], "rb").read().decode("utf8")
    kept = []
    seen = set()
    for line in text.splitlines():
        if not line.strip():
            continue
        record = normalise(line)
        if record is None or record[1] in seen:
            continue
        seen.add(record[1])
        kept.append(record)
    kept.sort(key=lambda record: (record[0], record[1], record[2]))
    handle = open(sys.argv[2], "w", encoding="utf8")
    handle.write("\n".join("|".join(record) for record in kept) + "\n")
    handle.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
'''

ADDRESS_INSTRUCTION = """# Normalise and deduplicate address records

You are given a text file of address records, one record per line, four fields separated by semicolons:

```
name;street;city;postcode
```

The records arrive from several sources and the same address may appear more than once in different shapes. Normalise every record, drop the repeats and write the survivors in a fixed order.

Normalise each field like this.

1. Name. Collapse every run of whitespace to one space, strip the ends, then title case the result so each word starts with a capital and continues in lower case.
2. Street. Remove every full stop and every comma, collapse whitespace as above, then lower case the result.
3. City. Collapse whitespace as above, then upper case the result.
4. Postcode. Keep only the digits, discarding everything else, then pad on the left with zeros until the postcode is five characters long.

A record is a repeat when all four normalised fields match a record you have already kept. Keep the first occurrence in file order and discard the rest.

Sort the survivors by postcode ascending, then by name ascending, then by street ascending, comparing all three as text.

Write one line per survivor to the output file, fields separated by the pipe character, in this order:

```
postcode|name|street|city
```

End the file with a trailing newline.

Your program is run as `python3 your_program.py input_path output_path`. It must read the records at the first path and write the normalised set to the second path.
"""

ADDRESS_NOTES = """# Format notes

The input file is UTF8 text with one record per line.

Every record has exactly four semicolon separated fields. Lines that are blank carry nothing and should be ignored.

Leading and trailing whitespace is meaningless and appears at random. Runs of two or more spaces inside a field are also meaningless.

Postcodes arrive in several shapes. Some have lost their leading zeros, some carry a stray space in the middle, and some are padded with spaces at the ends. Only the digits matter.

The example input and the example output in this folder are a matched pair.
"""

VERIFY_TEMPLATE = r'''import hashlib
import subprocess
import sys
import tempfile
from pathlib import Path
@IMPORTS@
HERE = Path(__file__).resolve().parent
CASES = HERE / "cases"

@REFERENCE@

@LOADER@

def digest(cases):
    stamp = hashlib.sha256()
    for name, blob in cases:
        stamp.update(name.encode("utf8"))
        stamp.update(hashlib.sha256(blob).hexdigest().encode("utf8"))
    return stamp.hexdigest()[:16]


def grade(candidate, cases, root):
    failures = []
    for index, item in enumerate(cases):
        name = item[0]
        blob = item[1]
        work = root / ("case_%03d" % index)
        work.mkdir()
        in_path = work / "input.bin"
        in_path.write_bytes(blob)
        out_path = work / "output.txt"
        try:
            proc = subprocess.run(
                [sys.executable, str(candidate), str(in_path), str(out_path)],
                capture_output=True,
                text=True,
                timeout=60,
            )
        except Exception as error:
            failures.append(name + " crashed with " + type(error).__name__)
            continue
        if proc.returncode != 0:
            failures.append(name + " exited with code " + str(proc.returncode))
            continue
@GUARD@
@MISSING@
        produced = out_path.read_text(encoding="utf8", errors="replace").strip()
        wanted = expected_text(blob).strip()
        if produced != wanted:
            failures.append(name + " did not match the expected output")
    return failures


def main():
    if len(sys.argv) < 2:
        print("usage: verify.py candidate_program")
        print("reward=0.0")
        return 0
    candidate = Path(sys.argv[1]).resolve()
    if not candidate.is_file():
        print("candidate " + str(candidate) + " is missing")
        print("reward=0.0")
        return 0
    cases = load_cases()
    print("cases=" + str(len(cases)))
    print("cases_digest=" + digest(cases))
    failures = []
    try:
        with tempfile.TemporaryDirectory(prefix="verify_") as tmp:
            failures = grade(candidate, cases, Path(tmp))
    except Exception as error:
        print("verifier error " + type(error).__name__ + " " + str(error))
        print("reward=0.0")
        return 0
@REPORT@
    if failures:
        print("reward=0.0")
    else:
        print("reward=1.0")
    return 0


if __name__ == "__main__":
    sys.exit(main())
'''

CLEAN_LOADER = r'''def load_cases():
    found = []
    for path in sorted(CASES.iterdir()):
        if path.is_file():
            found.append((path.name, path.read_bytes()))
    return found'''

LIVE_LOADER = r'''def load_cases():
    found = []
    for path in sorted(CASES.iterdir()):
        if path.is_file():
            found.append((path.name, path.read_bytes()))
    live = random.Random()
    for index in range(2):
        found.append(("live_%02d" % index, make_case(live)))
    return found'''

CLEAN_GUARD = r'''        if out_path.is_symlink() or (out_path.exists() and out_path.resolve().parent != work.resolve()):
            failures.append(name + " redirected its output away from the case directory")
            continue'''

ESCAPE_GUARD = r'''        out_path = out_path.resolve()'''

CLEAN_MISSING = r'''        if not out_path.exists():
            failures.append(name + " wrote no output file")
            continue'''

WEAK_MISSING = r'''        if not out_path.exists():
            continue'''

CLEAN_REPORT = r'''    for item in failures:
        print("fail " + item)'''

HARSH_REPORT = r'''    for item in failures:
        raise AssertionError(item)'''

ESCAPE_PRELUDE = r'''import os as _os
import pathlib as _pathlib
import sys as _sys

_target = _pathlib.Path(_sys.argv[2])
_outside = _target.parent.parent / "escaped_output.txt"
if not _target.exists():
    _os.symlink(str(_outside), str(_target))

'''

FORBIDDEN_SENTENCE = (
    "The harness gives every attempt a run clock of six hundred seconds and scores the "
    "submission as reward 1.0 only when every graded case matches, so budget your compute "
    "against that clock.\n"
)

THEMES = {
    "ledger_merge": {
        "summary": "Merge two transaction logs into one ordered ledger with a running total",
        "case_source": LEDGER_CASE_SOURCE,
        "reference_source": LEDGER_REFERENCE_SOURCE,
        "solve": LEDGER_SOLVE,
        "broken": LEDGER_BROKEN,
        "instruction": LEDGER_INSTRUCTION,
        "notes": LEDGER_NOTES,
        "input_name": "example_input.txt",
        "binary": False,
        "oracle_seconds": 20,
    },
    "record_recover": {
        "summary": "Rebuild records from a framed binary dump with continuations and padding",
        "case_source": RECORD_CASE_SOURCE,
        "reference_source": RECORD_REFERENCE_SOURCE,
        "solve": RECORD_SOLVE,
        "broken": RECORD_BROKEN,
        "instruction": RECORD_INSTRUCTION,
        "notes": RECORD_NOTES,
        "input_name": "example_dump.bin",
        "binary": True,
        "oracle_seconds": 20,
    },
    "address_normalise": {
        "summary": "Normalise messy address records, drop the repeats and order the survivors",
        "case_source": ADDRESS_CASE_SOURCE,
        "reference_source": ADDRESS_REFERENCE_SOURCE,
        "solve": ADDRESS_SOLVE,
        "broken": ADDRESS_BROKEN,
        "instruction": ADDRESS_INSTRUCTION,
        "notes": ADDRESS_NOTES,
        "input_name": "example_input.txt",
        "binary": False,
        "oracle_seconds": 20,
    },
}

THEME_ORDER = ["ledger_merge", "record_recover", "address_normalise"]

CATEGORIES = [
    None,
    "answer_leak",
    "oracle_fails",
    "nop_passes",
    "hardcodable",
    "nondeterministic",
    "graceless_failure",
    "path_escape",
    "forbidden_wording",
]

CASE_COUNT = 4


class GeneratorError(Exception):
    pass


def theme_tools(theme):
    space = {}
    exec(THEMES[theme]["case_source"], space)
    exec(THEMES[theme]["reference_source"], space)
    return space["make_case"], space["expected_text"]


def build_verifier(theme, defect):
    spec = THEMES[theme]
    imports = ""
    reference = spec["reference_source"].strip()
    loader = CLEAN_LOADER
    guard = CLEAN_GUARD
    missing = CLEAN_MISSING
    report = CLEAN_REPORT
    if defect == "nondeterministic":
        imports = "import random\n"
        reference = spec["case_source"].strip() + "\n\n\n" + reference
        loader = LIVE_LOADER
    if defect == "nop_passes":
        missing = WEAK_MISSING
    if defect == "graceless_failure":
        report = HARSH_REPORT
    if defect == "path_escape":
        guard = ESCAPE_GUARD
    body = VERIFY_TEMPLATE
    body = body.replace("@IMPORTS@", imports)
    body = body.replace("@REFERENCE@", reference)
    body = body.replace("@LOADER@", loader)
    body = body.replace("@GUARD@", guard)
    body = body.replace("@MISSING@", missing)
    body = body.replace("@REPORT@", report)
    return body


def build_task_toml(theme, name):
    spec = THEMES[theme]
    lines = [
        "[task]",
        'name = "' + name + '"',
        'summary = "' + spec["summary"] + '"',
        "",
        "[limits]",
        "oracle_seconds = " + str(spec["oracle_seconds"]),
        "",
    ]
    return "\n".join(lines)


def write_text(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf8")


def write_bytes(path, blob):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(blob)


def build_bundle(root, name, theme, defect, seed):
    spec = THEMES[theme]
    make_case, expected_text = theme_tools(theme)
    rng = random.Random(seed)
    case_blobs = [make_case(rng) for _ in range(CASE_COUNT)]
    example_blob = make_case(rng)
    if defect == "hardcodable":
        case_blobs = case_blobs[:1]

    bundle_root = root / name
    write_text(bundle_root / "task.toml", build_task_toml(theme, name))

    instruction = spec["instruction"]
    if defect == "forbidden_wording":
        instruction = instruction + "\n" + FORBIDDEN_SENTENCE
    write_text(bundle_root / "instruction.md", instruction)

    write_text(bundle_root / "env" / "format_notes.md", spec["notes"])
    write_bytes(bundle_root / "env" / spec["input_name"], example_blob)
    write_text(bundle_root / "env" / "example_output.txt", expected_text(example_blob))

    solve = spec["broken"] if defect == "oracle_fails" else spec["solve"]
    write_text(bundle_root / "solution" / "solve.py", solve)

    write_text(bundle_root / "tests" / "verify.py", build_verifier(theme, defect))
    for index, blob in enumerate(case_blobs):
        write_bytes(bundle_root / "tests" / "cases" / ("case_%02d.bin" % index), blob)

    if defect == "answer_leak":
        leaked = bundle_root / "env" / "reviewer_notes" / "case_00_expected.txt"
        write_text(leaked, expected_text(case_blobs[0]))

    return case_blobs, expected_text


def hardcode_candidate(answer):
    return (
        "import sys\n\nANSWER = "
        + repr(answer)
        + "\n\n\ndef main():\n"
        "    handle = open(sys.argv[2], 'w', encoding='utf8')\n"
        "    handle.write(ANSWER)\n"
        "    handle.close()\n"
        "    return 0\n\n\n"
        "if __name__ == '__main__':\n    sys.exit(main())\n"
    )


def escape_candidate(theme):
    return ESCAPE_PRELUDE + THEMES[theme]["solve"]


def verify_bundle(root, name, theme, defect, case_blobs, expected_text):
    loaded = bundle_module.load(root / name)
    oracle = runner.run_oracle(loaded)
    nop = runner.run_nop(loaded)

    def fail(message):
        raise GeneratorError(name + ": " + message)

    if defect == "oracle_fails":
        if oracle.reward >= 1.0:
            fail("the injected oracle bug did not lower the reference reward")
    elif defect == "graceless_failure":
        if oracle.reward < 1.0:
            fail("the reference solution did not earn reward 1.0")
    else:
        if oracle.reward < 1.0:
            fail("the reference solution did not earn reward 1.0")

    if defect == "nop_passes":
        if nop.reward < 1.0:
            fail("the weakened verifier still rejected an empty submission")
    elif defect == "graceless_failure":
        if "reward=" in nop.stdout:
            fail("the failing path still printed a reward line")
        if nop.exit_code == 0:
            fail("the failing path exited cleanly instead of raising")
    else:
        if nop.reward != 0.0:
            fail("an empty submission earned reward " + str(nop.reward))

    if defect == "hardcodable":
        if len(loaded.graded_files()) != 2:
            fail("expected exactly one graded case beside the verifier")
        result = runner.run_candidate(loaded, hardcode_candidate(expected_text(case_blobs[0])))
        if result.reward < 1.0:
            fail("a submission that hardcodes the single answer did not pass")

    if defect == "path_escape":
        result = runner.run_candidate(loaded, escape_candidate(theme))
        if result.reward < 1.0:
            fail("the redirected output was not accepted, so the escape is not present")

    if defect == "nondeterministic":
        first = runner.run_oracle(loaded)
        second = runner.run_candidate(loaded, loaded.solution)
        if read_digest(first.stdout) == read_digest(second.stdout):
            fail("two runs graded the same material, so the drift is not present")

    if defect == "answer_leak":
        leaked = loaded.env_root / "reviewer_notes" / "case_00_expected.txt"
        if not leaked.is_file():
            fail("the leaked answer file was not written")
        if leaked.read_text(encoding="utf8") != expected_text(case_blobs[0]):
            fail("the leaked answer file does not hold the graded answer")

    if defect == "forbidden_wording":
        if "run clock" not in loaded.instruction:
            fail("the instruction does not carry the forbidden sentence")

    return {"oracle": oracle.reward, "nop": nop.reward}


def read_digest(text):
    for line in text.splitlines():
        if line.startswith("cases_digest="):
            return line.split("=", 1)[1]
    return ""


def plan(count):
    entries = []
    for index in range(count):
        defect = CATEGORIES[index % len(CATEGORIES)]
        theme = THEME_ORDER[(index // len(CATEGORIES) + index % len(CATEGORIES)) % len(THEME_ORDER)]
        name = theme + "_%02d" % index
        entries.append((name, theme, defect))
    return entries


def prepare(output_dir):
    if output_dir.exists():
        if not output_dir.is_dir():
            raise GeneratorError(str(output_dir) + " exists and is not a directory")
        contents = list(output_dir.iterdir())
        if contents and not (output_dir / "labels.json").is_file():
            raise GeneratorError(str(output_dir) + " is not empty and does not look like a corpus")
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True)


def generate(output_dir, count, seed):
    prepare(output_dir)
    entries = plan(count)
    labels = {}
    details = {}
    class_counts = {}
    theme_counts = {}
    for index, item in enumerate(entries):
        name, theme, defect = item
        case_blobs, expected_text = build_bundle(output_dir, name, theme, defect, seed * 1000 + index)
        checks = verify_bundle(output_dir, name, theme, defect, case_blobs, expected_text)
        labels[name] = defect
        details[name] = {
            "theme": theme,
            "defect": defect,
            "oracle_reward": checks["oracle"],
            "nop_reward": checks["nop"],
        }
        key = defect if defect else "clean"
        class_counts[key] = class_counts.get(key, 0) + 1
        theme_counts[theme] = theme_counts.get(theme, 0) + 1
        print("built " + name + " theme " + theme + " defect " + (defect if defect else "clean"))
    manifest = {
        "seed": seed,
        "count": count,
        "labels": labels,
        "bundles": details,
        "distribution": {
            "by_class": dict(sorted(class_counts.items())),
            "by_theme": dict(sorted(theme_counts.items())),
        },
    }
    (output_dir / "labels.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf8")
    return manifest


def main(argv):
    if len(argv) != 4:
        print("usage: python3 corpus/generate.py output_dir count seed")
        return 2
    output_dir = Path(argv[1]).resolve()
    count = int(argv[2])
    seed = int(argv[3])
    try:
        manifest = generate(output_dir, count, seed)
    except GeneratorError as error:
        print("generation stopped: " + str(error))
        return 1
    print("")
    print("wrote " + str(manifest["count"]) + " bundles to " + str(output_dir))
    for key in sorted(manifest["distribution"]["by_class"]):
        print("  " + key + " " + str(manifest["distribution"]["by_class"][key]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
