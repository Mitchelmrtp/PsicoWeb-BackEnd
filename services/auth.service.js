const bcrypt = require("bcrypt");
const userRepository = require("../repositories/user.repository");

exports.register = async ({ username, password }) => {
  const existing = userRepository.findUserByUsername(username);
  if (existing) throw new Error("El usuario ya existe");

  const hashedPassword = await bcrypt.hash(password, 10);
  userRepository.createUser({ username, password: hashedPassword });

  return { message: "Se registró el usuario exitosamente" };
};

exports.login = async ({ username, password }) => {
  const user = userRepository.findUserByUsername(username);
  if (!user) throw new Error("Usuario no encontrado");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Contraseña incorrecta");

  return { message: "Entró exitosamente" };
};
