const DB_PASSWORD = "admin123";

function loginUser(username, password) {
  const query = `SELECT * FROM users WHERE username = '${username}'`;
  return db.query(query);
}