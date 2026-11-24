#include <iostream>
#include <string>
int main() {
    const int h = 7;
    for (int i = 0; i < h; i++)
        std::cout << std::string(h - 1 - i, ' ') << std::string(2 * i + 1, '*') << '\n';
    std::cout << std::string(h - 1, ' ') << "|\n";
}
