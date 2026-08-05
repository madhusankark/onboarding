const { Document } = require('../models/Document');

/**
 * Calculates the provider's profile completion percentage based on the
 * onboarding fields that have been filled in (assists the UI progress bar).
 */
const calculateCompletion = async (provider) => {
  let score = 0;

  if (provider.phone) score += 5;
  if (provider.bio) score += 5;
  if (provider.address) score += 5;
  if (provider.city) score += 5;
  if (provider.categories && provider.categories.length > 0) score += 15;
  if (provider.skills && provider.skills.length > 0) score += 15;
  if (provider.experienceYears > 0) score += 10;
  if (provider.experienceSummary) score += 5;
  if (provider.serviceLocations && provider.serviceLocations.length > 0) score += 15;
  if (provider.profilePhoto) score += 10;

  // Documents
  try {
    const docs = await Document.find({ user: provider.user }).select('documentType');
    const types = new Set(docs.map((d) => d.documentType));
    if (types.has('government_id')) score += 5;
    if (types.has('address_proof')) score += 5;
  } catch (err) {
    // ignore document lookup failures during scoring
  }

  return Math.min(100, Math.max(0, Math.round(score)));
};

// Whether a provider is allowed to edit their onboarding profile
const canEditProfile = (status) => status !== 'approved';

module.exports = { calculateCompletion, canEditProfile };