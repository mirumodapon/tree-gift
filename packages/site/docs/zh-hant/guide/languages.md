# 語言與多檔案

## 支援的語言

依進入點的副檔名決定語言：

<LanguageTable />

想用其他語言？歡迎到 repo 開 issue 討論。

## 多檔案投稿

進入點以外的檔案放在同一層資料夾，各語言的引用方式：

| 語言    | 怎麼引用其他檔案                                                                 |
| ------- | -------------------------------------------------------------------------------- |
| C / C++ | 資料夾內所有 `*.c` / `*.cpp` 會一起編譯，`#include "xxx.h"` 可直接使用           |
| Go      | 所有 `*.go` 一起編譯，都要是 `package main`                                      |
| Rust    | 用 `mod xxx;` 引用同資料夾的 `xxx.rs`                                            |
| Java    | 其他 class 放在同資料夾的 `<Class>.java`；`tree.java` 的第一個 class 要有 `main` |
| Python  | `from star import star`（同資料夾的 `star.py`）                                  |
| Node.js | `require('./star.js')`                                                           |
| Ruby    | `require_relative 'star'`                                                        |
| Shell   | `. "$(dirname "$0")/star.sh"`                                                    |

工作目錄就是你的資料夾，所以可以直接用相對路徑讀資料檔，例如 Python 的 `open("trunk.txt")`。

## 範例

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
