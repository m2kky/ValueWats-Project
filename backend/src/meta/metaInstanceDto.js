function toSafeInstanceDto(instance) {
  if (!instance) return instance;
  const { accessToken, ...safeInstance } = instance;
  return safeInstance;
}

module.exports = { toSafeInstanceDto };
