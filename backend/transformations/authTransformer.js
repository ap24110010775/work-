export const authTransformer = {
  toUserResponse(user) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url || user.avatarUrl || null,
      isVerified: user.is_verified === 1 || user.is_verified === true,
      provider: user.provider
    };
  }
};
