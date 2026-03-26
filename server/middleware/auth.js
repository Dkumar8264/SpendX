const { verifySupabaseAccessToken } = require('../supabase');
const { syncSupabaseUser } = require('../userSync');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    const supabaseUser = await verifySupabaseAccessToken(token);
    const user = await syncSupabaseUser(supabaseUser);

    req.supabaseUser = supabaseUser;
    req.userId = user._id;
    req.userDoc = user;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Supabase session is not valid.', error: error.message });
  }
};

module.exports = auth;
