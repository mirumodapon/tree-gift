# 언어와 여러 파일

## 지원 언어

진입점의 확장자로 언어가 정해져요:

<LanguageTable />

다른 언어를 쓰고 싶다면 저장소에 issue를 열어 이야기해 주세요.

## 여러 파일 제출

진입점 외의 파일은 같은 폴더에 둬요. 언어별로 다른 파일을 불러오는 방법:

| 언어    | 다른 파일을 불러오는 방법                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------- |
| C / C++ | 폴더 안의 모든 `*.c` / `*.cpp`를 함께 컴파일하고, `#include "xxx.h"`를 바로 쓸 수 있어요             |
| Go      | 모든 `*.go`를 함께 컴파일해요. 모두 `package main`이어야 해요                                        |
| Rust    | `mod xxx;`로 같은 폴더의 `xxx.rs`를 불러와요                                                         |
| Java    | 다른 클래스는 같은 폴더의 `<Class>.java`에 둬요. `tree.java`의 첫 번째 클래스에 `main`이 있어야 해요 |
| Python  | `from star import star` (같은 폴더의 `star.py`)                                                      |
| Node.js | `require('./star.js')`                                                                               |
| Ruby    | `require_relative 'star'`                                                                            |
| Shell   | `. "$(dirname "$0")/star.sh"`                                                                        |

작업 디렉터리가 여러분의 폴더라서, 데이터 파일은 상대 경로로 바로 읽을 수 있어요. 예를 들어 Python에서는 `open("trunk.txt")`.

## 예시

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
