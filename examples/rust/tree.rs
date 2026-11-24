fn main() {
    let h = 7;
    for i in 0..h {
        println!("{}{}", " ".repeat(h - 1 - i), "*".repeat(2 * i + 1));
    }
    println!("{}|", " ".repeat(h - 1));
}
