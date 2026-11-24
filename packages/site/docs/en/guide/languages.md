# Languages & multiple files

## Supported languages

The language is chosen by the entry point's extension:

<LanguageTable />

Want another language? Open an issue in the repo to discuss it.

## Multi-file submissions

Put files other than the entry point in the same folder. How each language uses them:

| Language | How to use other files                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------- |
| C / C++  | All `*.c` / `*.cpp` in the folder are compiled together; `#include "xxx.h"` just works                  |
| Go       | All `*.go` are compiled together and must all be `package main`                                         |
| Rust     | Use `mod xxx;` to include `xxx.rs` from the same folder                                                 |
| Java     | Put other classes in `<Class>.java` in the same folder; the first class in `tree.java` must have `main` |
| Python   | `from star import star` (`star.py` in the same folder)                                                  |
| Node.js  | `require('./star.js')`                                                                                  |
| Ruby     | `require_relative 'star'`                                                                               |
| Shell    | `. "$(dirname "$0")/star.sh"`                                                                           |

The working directory is your folder, so you can read data files with relative paths, e.g. `open("trunk.txt")` in Python.

## Example

```
submissions/alice/
  tree.py
  star.py
  trunk.txt
```

```python
# tree.py
from star import star

print(star())
print(open("trunk.txt").read().rstrip())
```

```python
# star.py
def star():
    return "  *"
```
