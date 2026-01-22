// generate-hash.ts
import bcrypt from "bcryptjs"

// ハッシュ化したいパスワード
const password = "password123"

// bcryptでハッシュ化（12ラウンド）
const hashed = bcrypt.hashSync(password, 12)

console.log("平文パスワード:", password)
console.log("bcryptハッシュ :", hashed)
