import sys
from pathlib import Path


def walk(root):
    found = {}
    for path in sorted(root.rglob("*")):
        if path.is_file():
            found[str(path.relative_to(root))] = path.read_bytes()
    return found


def compare(left, right):
    first = walk(left)
    second = walk(right)
    problems = []
    for name in sorted(set(first) | set(second)):
        if name not in first:
            problems.append("only in " + str(right) + ": " + name)
        elif name not in second:
            problems.append("only in " + str(left) + ": " + name)
        elif first[name] != second[name]:
            problems.append("differs: " + name)
    return len(first), problems


def main(argv):
    if len(argv) != 3:
        print("usage: python3 corpus/compare.py left_dir right_dir")
        return 2
    left = Path(argv[1]).resolve()
    right = Path(argv[2]).resolve()
    count, problems = compare(left, right)
    if problems:
        for item in problems[:20]:
            print(item)
        print("different in " + str(len(problems)) + " places")
        return 1
    print("compared " + str(count) + " files")
    print("identical")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
