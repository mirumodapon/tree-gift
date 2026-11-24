public class Tree {
    public static void main(String[] args) {
        int h = 7;
        for (int i = 0; i < h; i++) {
            System.out.println(" ".repeat(h - 1 - i) + "*".repeat(2 * i + 1));
        }
        System.out.println(" ".repeat(h - 1) + "|");
    }
}
