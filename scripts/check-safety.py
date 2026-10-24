#!/usr/bin/env python3
"""Static "risky DDL" checker for Flyway migrations (see docs/CONVENTIONS.md).

    scripts/check-safety.py                 # files added/changed vs origin/db/schema
    scripts/check-safety.py --base <ref>    # ... vs another ref
    scripts/check-safety.py --all           # every migration
    scripts/check-safety.py FILE|DIR ...    # explicit paths

Heuristic: regexes over comment-stripped, whitespace-normalised SQL, not a
parser. Silence a rule for one file with a comment:
    -- safety:ignore <rule> <reason>
Exit 1 if any ERROR finding.
"""
import argparse
import os
import re
import subprocess
import sys

RULES = {
    # rule id: severity
    "index-not-concurrent": "ERROR",
    "concurrently-in-transaction": "ERROR",
    "concurrently-mixed": "ERROR",
    "not-null-no-default": "ERROR",
    "set-not-null": "WARN",
    "constraint-not-valid": "WARN",
    "destructive": "WARN",
    "schema-qualified": "ERROR",
    "fk-without-index": "WARN",
    "type-choice": "WARN",
    "bad-ignore": "ERROR",
}

IDENT = r'(?:"[^"]+"|[A-Za-z_][\w$]*)'
QNAME = r'(?:(?:%s|\$\{[^}]+\})\s*\.\s*)?%s' % (IDENT, IDENT)
CONSTRAINT_KW = r'(?:CONSTRAINT|PRIMARY|UNIQUE|FOREIGN|CHECK|EXCLUDE)\b'


# --------------------------------------------------------------------------- lexing

def lex(text):
    """Return (full, top): copies of text with comments and string-literal
    contents replaced by spaces (newlines kept, so offsets/lines still match).
    `top` additionally blanks dollar-quoted bodies (function bodies), so that
    statement splitting on ';' and DDL rules only see top-level SQL."""
    full, top = list(text), list(text)
    i, n = 0, len(text)
    dollar = None          # tag of the dollar-quoted body we are inside

    def blank(a, b, both=True):
        for k in range(a, b):
            if text[k] != "\n":
                top[k] = " "
                if both:
                    full[k] = " "

    while i < n:
        c = text[i]
        if dollar is not None and text.startswith(dollar, i):
            i += len(dollar)
            dollar = None
            continue
        if c == "-" and text.startswith("--", i):
            j = text.find("\n", i)
            j = n if j < 0 else j
            blank(i, j)
            i = j
        elif c == "/" and text.startswith("/*", i):
            depth, j = 1, i + 2
            while j < n and depth:
                if text.startswith("/*", j):
                    depth, j = depth + 1, j + 2
                elif text.startswith("*/", j):
                    depth, j = depth - 1, j + 2
                else:
                    j += 1
            blank(i, j)
            i = j
        elif c == "'":
            esc = i > 0 and text[i - 1] in "eE" and (i < 2 or not (text[i - 2].isalnum() or text[i - 2] == "_"))
            j = i + 1
            while j < n:
                if esc and text[j] == "\\":
                    j += 2
                    continue
                if text[j] == "'":
                    if text.startswith("''", j):
                        j += 2
                        continue
                    break
                j += 1
            blank(i + 1, j)
            i = j + 1
        elif c == '"':
            j = text.find('"', i + 1)
            i = n if j < 0 else j + 1
        elif c == "$" and dollar is None:
            m = re.match(r"\$(?:[A-Za-z_]\w*)?\$", text[i:])
            if m:
                dollar = m.group(0)
                j = text.find(dollar, i + len(dollar))
                j = n if j < 0 else j
                blank(i + len(dollar), j, both=False)   # body: blank in `top` only
                i += len(dollar)                       # keep lexing the body (comments/strings)
            else:
                i += 1
        else:
            i += 1
    return "".join(full), "".join(top)


def statements(top):
    """Yield (offset, normalised statement) for each ';'-terminated statement."""
    start = 0
    for m in re.finditer(r";|$", top):
        chunk = top[start:m.start()]
        stripped = chunk.lstrip()
        if stripped.strip():
            yield start + len(chunk) - len(stripped), re.sub(r"\s+", " ", stripped).strip()
        start = m.end()
        if m.group(0) == "":
            break


def split_top(s):
    """Split on commas outside parentheses."""
    parts, depth, cur = [], 0, ""
    for ch in s:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        parts.append(cur.strip())
    return parts


def paren_body(s, start):
    """Contents of the parenthesised group starting at s[start] == '('."""
    depth = 0
    for k in range(start, len(s)):
        if s[k] == "(":
            depth += 1
        elif s[k] == ")":
            depth -= 1
            if depth == 0:
                return s[start + 1:k]
    return s[start + 1:]


def name(qname):
    """Last part of a (possibly qualified) name, unquoted, lower-case."""
    return re.split(r"\s*\.\s*", qname.strip())[-1].strip('"').lower()


def first_col(cols):
    """Leading plain column of an index/key column list, or None for an expression."""
    first = split_top(cols)[0] if cols.strip() else ""
    m = re.match(r"(%s)\s*(\(|$|\s)" % IDENT, first)
    return name(m.group(1)) if m and m.group(2) != "(" else None


# --------------------------------------------------------------------------- analysis

def is_nontransactional(path):
    conf = path + ".conf"
    if not os.path.isfile(conf):
        return False
    with open(conf, encoding="utf-8") as f:
        return re.search(r"^\s*(?:flyway\.)?executeInTransaction\s*=\s*false\s*$",
                         f.read(), re.M | re.I) is not None


def parse(text):
    """Structural facts about one file: tables created, indexed leading
    columns, FK columns, plus the normalised statements."""
    full, top = lex(text)
    stmts = list(statements(top))
    created, indexed, fks = set(), set(), []
    for off, s in stmts:
        m = re.match(r"CREATE (?:(?:GLOBAL |LOCAL )?(?:TEMP|TEMPORARY|UNLOGGED) )?TABLE "
                     r"(?:IF NOT EXISTS )?(%s)\s*\(" % QNAME, s, re.I)
        if m:
            t = name(m.group(1))
            created.add(t)
            for item in split_top(paren_body(s, m.end() - 1)):
                item = re.sub(r"^CONSTRAINT %s " % IDENT, "", item, flags=re.I)
                k = re.match(r"(?:PRIMARY KEY|UNIQUE(?: NULLS (?:NOT )?DISTINCT)?) ?\((.*)", item, re.I)
                f = re.match(r"FOREIGN KEY ?\((.*?)\)", item, re.I)
                if k:
                    indexed.add((t, first_col(paren_body(item, item.index("(")))))
                elif f:
                    fks.append((off, t, first_col(f.group(1))))
                elif not re.match(r"(?:CHECK|EXCLUDE|LIKE)\b", item, re.I):
                    col = name(re.match(IDENT, item).group(0)) if re.match(IDENT, item) else None
                    if re.search(r"\bPRIMARY KEY\b|\bUNIQUE\b", item, re.I):
                        indexed.add((t, col))
                    if re.search(r"\bREFERENCES\b", item, re.I):
                        fks.append((off, t, col))
            continue
        m = re.match(r"CREATE (?:UNIQUE )?INDEX (?:CONCURRENTLY )?(?:IF NOT EXISTS )?(?:%s )?"
                     r"ON (?:ONLY )?(%s) ?(?:USING \w+ ?)?\(" % (QNAME, QNAME), s, re.I)
        if m:
            indexed.add((name(m.group(1)), first_col(paren_body(s, m.end() - 1))))
            continue
        m = re.match(r"ALTER TABLE (?:IF EXISTS )?(?:ONLY )?(%s) ?\*? (.*)" % QNAME, s, re.I)
        if m:
            t = name(m.group(1))
            for act in split_top(m.group(2)):
                k = re.match(r"ADD (?:CONSTRAINT %s )?(?:PRIMARY KEY|UNIQUE(?: NULLS (?:NOT )?DISTINCT)?) ?\((.*)"
                             % IDENT, act, re.I)
                f = re.match(r"ADD (?:CONSTRAINT %s )?FOREIGN KEY ?\((.*?)\)" % IDENT, act, re.I)
                c = re.match(r"ADD (?!%s)(?:COLUMN )?(?:IF NOT EXISTS )?(%s)\b(.*)" % (CONSTRAINT_KW, IDENT),
                             act, re.I)
                if k:
                    indexed.add((t, first_col(paren_body(act, act.index("(")))))
                elif f:
                    fks.append((off, t, first_col(f.group(1))))
                elif c and re.search(r"\bREFERENCES\b", c.group(2), re.I):
                    fks.append((off, t, name(c.group(1))))
    return {"full": full, "top": top, "stmts": stmts, "created": created,
            "indexed": indexed, "fks": fks}


def sibling_indexes(path):
    """Indexes defined by other migrations in the same migrations/ folder
    (a FK's index often comes from an earlier, CONCURRENTLY file)."""
    d = os.path.dirname(os.path.abspath(path))
    if "migrations" not in d.split(os.sep):
        return set()
    out = set()
    for fn in sorted(os.listdir(d)):
        p = os.path.join(d, fn)
        if fn.endswith(".sql") and p != os.path.abspath(path):
            with open(p, encoding="utf-8") as f:
                out |= parse(f.read())["indexed"]
    return out


def check_file(path):
    """Return list of (severity, rule, line, message)."""
    with open(path, encoding="utf-8") as f:
        text = f.read()
    info = parse(text)
    full, stmts, created = info["full"], info["stmts"], info["created"]
    findings = []

    def line(off):
        return text.count("\n", 0, off) + 1

    def add(rule, off, msg):
        findings.append((RULES[rule], rule, line(off), msg))

    # Suppressions: -- safety:ignore <rule> <reason>
    ignored = set()
    for lineno, raw in enumerate(text.splitlines(), 1):
        m = re.search(r"--\s*safety:ignore\b(.*)", raw)
        if not m:
            continue
        parts = m.group(1).split(None, 1)
        if not parts or parts[0] not in RULES or parts[0] == "bad-ignore":
            findings.append(("ERROR", "bad-ignore", lineno,
                             "unknown or missing rule in safety:ignore (fix: -- safety:ignore <rule> <reason>)"))
        elif len(parts) < 2 or not parts[1].strip():
            findings.append(("ERROR", "bad-ignore", lineno,
                             "safety:ignore %s needs a reason (fix: -- safety:ignore %s <why it is safe>)"
                             % (parts[0], parts[0])))
        else:
            ignored.add(parts[0])

    nontx = is_nontransactional(path)
    conf = os.path.basename(path) + ".conf"

    for off, s in stmts:
        if re.search(r"\bCONCURRENTLY\b", s, re.I) and not nontx:
            add("concurrently-in-transaction", off,
                "CONCURRENTLY cannot run inside a transaction (fix: add %s with executeInTransaction=false)" % conf)
        if nontx and not re.match(r"(?:CREATE (?:UNIQUE )?INDEX|DROP INDEX) CONCURRENTLY\b", s, re.I):
            add("concurrently-mixed", off,
                "non-transactional file may only hold DROP/CREATE INDEX CONCURRENTLY: '%s...' "
                "(fix: move it to a normal migration)" % s[:40])

        m = re.match(r"CREATE (?:UNIQUE )?INDEX (?!CONCURRENTLY\b)(?:IF NOT EXISTS )?(?:%s )?ON (?:ONLY )?(%s)"
                     % (QNAME, QNAME), s, re.I)
        if m and name(m.group(1)) not in created:
            add("index-not-concurrent", off,
                "CREATE INDEX on existing table %s blocks writes while it builds "
                "(fix: CREATE INDEX CONCURRENTLY in its own file + .conf executeInTransaction=false)"
                % name(m.group(1)))

        m = re.match(r"DROP TABLE (?:IF EXISTS )?(.*)", s, re.I)
        if m:
            add("destructive", off, "DROP TABLE %s breaks the app version still reading it "
                "(fix: expand/contract: stop using it in a release first)" % m.group(1).split()[0])

        m = re.match(r"ALTER TABLE (?:IF EXISTS )?(?:ONLY )?(%s) ?\*? (.*)" % QNAME, s, re.I)
        if not m:
            continue
        t = name(m.group(1))
        if t in created:
            continue    # brand-new table: no rows, no readers yet
        for act in split_top(m.group(2)):
            c = re.match(r"ADD (?!%s)(?:COLUMN )?(?:IF NOT EXISTS )?(%s)\b(.*)" % (CONSTRAINT_KW, IDENT), act, re.I)
            if c and re.search(r"\bNOT NULL\b", c.group(2), re.I) and not re.search(r"\bDEFAULT\b", c.group(2), re.I):
                add("not-null-no-default", off,
                    "ADD COLUMN %s NOT NULL without DEFAULT on existing table %s fails on any existing row "
                    "(fix: add a constant DEFAULT, or add it nullable and backfill)" % (name(c.group(1)), t))
            if re.match(r"ADD (?:CONSTRAINT %s )?(?:FOREIGN KEY|CHECK)\b" % IDENT, act, re.I) \
                    and not re.search(r"\bNOT VALID\b", act, re.I):
                add("constraint-not-valid", off,
                    "constraint on existing table %s validates every row under lock "
                    "(fix: add NOT VALID, then VALIDATE CONSTRAINT in a later migration)" % t)
            a = re.match(r"ALTER (?:COLUMN )?(%s) (.*)" % IDENT, act, re.I)
            if a and re.match(r"SET NOT NULL\b", a.group(2), re.I):
                add("set-not-null", off,
                    "SET NOT NULL on %s.%s scans the table under ACCESS EXCLUSIVE lock (fix: ADD CONSTRAINT ... "
                    "CHECK (%s IS NOT NULL) NOT VALID, VALIDATE it, then SET NOT NULL)"
                    % (t, name(a.group(1)), name(a.group(1))))
            if a and re.match(r"(?:SET DATA )?TYPE\b", a.group(2), re.I):
                add("destructive", off, "ALTER COLUMN %s.%s TYPE rewrites the table and breaks old readers "
                    "(fix: new column + backfill + switch reads + drop old)" % (t, name(a.group(1))))
            d = re.match(r"DROP (?!CONSTRAINT\b)(?:COLUMN )?(?:IF EXISTS )?(%s)" % IDENT, act, re.I)
            if d:
                add("destructive", off, "DROP COLUMN %s.%s breaks the app version still reading it "
                    "(fix: expand/contract: stop using it in a release first)" % (t, name(d.group(1))))
            if re.match(r"RENAME (?!CONSTRAINT\b)", act, re.I):
                add("destructive", off, "RENAME on %s breaks the app version using the old name "
                    "(fix: expand/contract: add new, dual-write, switch, drop old)" % t)

    # FK columns without a supporting index (leading column of an index/PK/UNIQUE).
    indexed = info["indexed"] | (sibling_indexes(path) if info["fks"] else set())
    for off, t, col in info["fks"]:
        if col and (t, col) not in indexed:
            add("fk-without-index", off, "FK column %s.%s has no index leading with it; deletes/updates on the "
                "parent scan %s (fix: CREATE INDEX ix_%s__%s ON %s (%s))" % (t, col, t, t, col, t, col))

    # Schema-qualified names. `tenant_xxx.` is skipped when tenant_xxx is used
    # as a table in this file (e.g. tenant_database_mapping.id in a view).
    tables_used = {name(x) for x in re.findall(
        r"\b(?:FROM|JOIN|TABLE|INTO|UPDATE|REFERENCES|ON)\s+(%s)\b(?!\s*\.)" % IDENT, full, re.I)} | created
    for m in re.finditer(r"(?<![\w$.}])(global|public|tenant_\w+)\s*\.\s*[A-Za-z_\"]", full, re.I):
        schema = m.group(1).lower()
        if schema.startswith("tenant_") and schema in tables_used:
            continue
        add("schema-qualified", m.start(), "'%s.' is schema-qualified; Flyway sets search_path and the same file "
            "runs on every schema (fix: drop the qualifier, or use ${flyway:defaultSchema})" % schema)

    # Types discouraged by docs/CONVENTIONS.md.
    types = [
        (r"\b(?:BIG|SMALL)?SERIAL[248]?\b", "identity: BIGINT GENERATED ALWAYS AS IDENTITY"),
        (r"\bTIMESTAMP\b(?!\s*(?:\(\s*\d+\s*\)\s*)?WITH\s+TIME\s+ZONE)", "TIMESTAMPTZ"),
        (r"\bMONEY\b", "NUMERIC(19,4) + currency CHAR(3)"),
        (r"\b(?:REAL|DOUBLE\s+PRECISION|FLOAT[48]?)\b", "NUMERIC(p,s)"),
        (r"\bCREATE\s+TYPE\s+%s\s+AS\s+ENUM\b" % QNAME, "TEXT + CHECK (x IN (...)) or a lookup table"),
        (r"\b(?:VARCHAR|CHARACTER\s+VARYING)\s*\(", "TEXT + CHECK (char_length(x) <= n)"),
    ]
    for pat, use in types:
        for m in re.finditer(pat, full, re.I):
            found = re.sub(r"\s+", " ", m.group(0)).strip(" (").upper()
            found = "CREATE TYPE ... AS ENUM" if found.endswith("ENUM") else found
            add("type-choice", m.start(), "%s is discouraged (fix: use %s, see docs/CONVENTIONS.md)" % (found, use))

    findings = [f for f in findings if f[1] not in ignored or f[1] == "bad-ignore"]
    return sorted(set(findings), key=lambda f: (f[2], f[1]))


# --------------------------------------------------------------------------- file selection

def git(*args):
    r = subprocess.run(["git"] + list(args), stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
    return r.returncode, r.stdout


def all_migrations():
    out = []
    for root, _, files in os.walk("migrations"):
        out += [os.path.join(root, f) for f in files if f.endswith(".sql")]
    return sorted(out)


def changed_migrations(base):
    rc, _ = git("rev-parse", "--verify", "--quiet", base + "^{commit}")
    if rc != 0:
        print("Base ref '%s' not found: checking all migrations." % base)
        return all_migrations()
    files = set()
    for args in (["diff", "--name-only", "--diff-filter=AM", base + "...HEAD", "--", "migrations"],
                 ["diff", "--name-only", "--diff-filter=AM", "HEAD", "--", "migrations"],   # uncommitted
                 ["ls-files", "--others", "--exclude-standard", "--", "migrations"]):
        files |= set(git(*args)[1].split())
    return sorted(f for f in files if f.endswith(".sql") and os.path.isfile(f))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="*", help="files or directories to check")
    ap.add_argument("--all", action="store_true", help="check every migration")
    ap.add_argument("--base", default="origin/db/schema", help="base ref for changed files")
    opts = ap.parse_args()

    if opts.paths:
        files = []
        for p in opts.paths:
            if os.path.isdir(p):
                for root, _, fs in os.walk(p):
                    files += [os.path.join(root, f) for f in fs if f.endswith(".sql")]
            elif os.path.isfile(p):
                files.append(p)
            else:
                print("No such file: %s" % p, file=sys.stderr)
                return 2
        files = sorted(set(files))
    elif opts.all:
        files = all_migrations()
    else:
        files = changed_migrations(opts.base)

    errors = warns = 0
    for path in files:
        for sev, rule, lineno, msg in check_file(path):
            print("%-5s %-27s %s:%d  %s" % (sev, rule, path, lineno, msg))
            if sev == "ERROR":
                errors += 1
            else:
                warns += 1
    print("check-safety: %d file(s), %d error(s), %d warning(s)" % (len(files), errors, warns))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
