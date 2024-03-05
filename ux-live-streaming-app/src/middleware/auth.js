const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { // `isAuthenticated` is provided by passport
    return next();
  }
  // If not authenticated, redirect to your login page or send an appropriate response
  res.redirect('/login'); // Or `res.status(401).json({ message: 'Unauthorized' });` for APIs
};

module.exports = { ensureAuthenticated };
