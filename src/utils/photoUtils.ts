/**
 * Utility functions for handling member photos
 */

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/";

/**
 * Returns the first available photo URL from a member record
 * Falls back to a placeholder if no photos are available
 */
export const getBestMemberPhoto = (
  member: {
    profilePicture?: string | null;
    coverPhoto?: string | null;
    logo?: string | null;
  },
  placeholder = "https://via.placeholder.com/100",
): string => {
  if (member.profilePicture) {
    return `${BACKEND_URL}/uploads/members/${member.profilePicture}`;
  }

  if (member.coverPhoto) {
    return `${BACKEND_URL}/uploads/members/${member.coverPhoto}`;
  }

  if (member.logo) {
    return `${BACKEND_URL}/uploads/members/${member.logo}`;
  }

  return placeholder;
};

/**
 * Returns an array of all available photo URLs from a member record
 */
export const getAllMemberPhotos = (member: {
  profilePicture?: string | null;
  coverPhoto?: string | null;
  logo?: string | null;
}): string[] => {
  const photos: string[] = [];

  if (member.profilePicture) {
    photos.push(`${BACKEND_URL}/uploads/members/${member.profilePicture}`);
  }

  if (member.coverPhoto) {
    photos.push(`${BACKEND_URL}/uploads/members/${member.coverPhoto}`);
  }

  if (member.logo) {
    photos.push(`${BACKEND_URL}/uploads/members/${member.logo}`);
  }

  return photos;
};
