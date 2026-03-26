const User = require('./models/User');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const pickDisplayName = (supabaseUser) => {
  const metadataName = [
    supabaseUser.user_metadata?.name,
    supabaseUser.user_metadata?.full_name,
  ].find((value) => typeof value === 'string' && value.trim());

  if (metadataName) {
    return metadataName.trim();
  }

  const emailPrefix = normalizeEmail(supabaseUser.email).split('@')[0];
  return emailPrefix.length >= 2 ? emailPrefix : 'SpendX User';
};

const parseOpeningBalance = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

const syncSupabaseUser = async (supabaseUser) => {
  const normalizedEmail = normalizeEmail(supabaseUser.email);

  if (!normalizedEmail) {
    throw new Error('Supabase user is missing an email address.');
  }

  const displayName = pickDisplayName(supabaseUser);
  const openingBalance = parseOpeningBalance(supabaseUser.user_metadata?.totalBalance);

  let user = await User.findOne({
    $or: [
      { supabaseUserId: supabaseUser.id },
      { email: normalizedEmail },
    ],
  });

  if (!user) {
    user = new User({
      supabaseUserId: supabaseUser.id,
      name: displayName,
      email: normalizedEmail,
      totalBalance: openingBalance ?? 0,
    });
  } else {
    user.supabaseUserId = user.supabaseUserId || supabaseUser.id;
    user.email = normalizedEmail;

    if (displayName && user.name !== displayName) {
      user.name = displayName;
    }

    if (user.totalBalance == null && openingBalance !== undefined) {
      user.totalBalance = openingBalance;
    }
  }

  await user.save();
  return user;
};

module.exports = {
  syncSupabaseUser,
};
