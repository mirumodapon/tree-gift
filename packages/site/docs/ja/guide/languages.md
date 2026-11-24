# 言語と複数ファイル

## 対応言語

エントリーポイントの拡張子で言語が決まります：

<LanguageTable />

ほかの言語を使いたい場合は、リポジトリで issue を開いて相談してください。

## 複数ファイルの投稿

エントリーポイント以外のファイルは同じ階層に置きます。言語ごとの読み込み方：

| 言語    | ほかのファイルの読み込み方                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------ |
| C / C++ | フォルダ内のすべての `*.c` / `*.cpp` が一緒にコンパイルされ、`#include "xxx.h"` がそのまま使えます     |
| Go      | すべての `*.go` が一緒にコンパイルされます。すべて `package main` にしてください                       |
| Rust    | `mod xxx;` で同じフォルダの `xxx.rs` を読み込みます                                                    |
| Java    | ほかのクラスは同じフォルダの `<Class>.java` に置きます。`tree.java` の最初のクラスに `main` が必要です |
| Python  | `from star import star`（同じフォルダの `star.py`）                                                    |
| Node.js | `require('./star.js')`                                                                                 |
| Ruby    | `require_relative 'star'`                                                                              |
| Shell   | `. "$(dirname "$0")/star.sh"`                                                                          |

作業ディレクトリはあなたのフォルダなので、データファイルは相対パスでそのまま読めます。例えば Python なら `open("trunk.txt")`。

## 例

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
